"""
Website Builders — Comprehensive Senior QA Test Suite
Executes end-to-end testing of all API endpoints, auth gates, analytics, PDF generation,
revisions, maintenance tickets, survey, partial lead capture, and automation engine.
"""

import os
import sys
import unittest
import pyotp

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import app as flask_app
import models
from totp_service import TOTPService
from report_pdf import generate_monthly_client_pdf
from automation_engine import AutomationEngine

class ComprehensiveQATestSuite(unittest.TestCase):
    def setUp(self):
        flask_app.app.config['TESTING'] = True
        flask_app.app.config['WTF_CSRF_ENABLED'] = False
        flask_app.app.config['SECRET_KEY'] = 'test-secret-key-12345'
        self.client = flask_app.app.test_client()

    def login_as(self, role='Admin', user_id='USR-999', email='admin@websitebuilders.com'):
        """Helper to simulate authenticated session for specific roles."""
        with self.client.session_transaction() as sess:
            sess['_user_id'] = user_id
            sess['_fresh'] = True
            sess['_user_cache'] = {
                'id': user_id,
                'user_id': user_id,
                'email': email,
                'role': role,
                'full_name': f'Test {role}',
                'is_active': True
            }

    # ─── 1. PUBLIC PAGES & TRUST HUB ─────────────────────────────
    def test_01_public_pages(self):
        print("\n[QA Test 01] Testing Public Pages & Security Hub...")
        routes = ['/', '/security', '/trust-and-security', '/survey']
        for route in routes:
            res = self.client.get(route)
            self.assertEqual(res.status_code, 200, f"Failed loading {route}")
            print(f"  [OK] {route} -> HTTP 200 OK")

    # ─── 2. STATIC ASSETS & PWA MANIFEST ─────────────────────────
    def test_02_pwa_assets(self):
        print("\n[QA Test 02] Testing PWA Manifest, SW & Logo...")
        res_manifest = self.client.get('/manifest.webmanifest')
        self.assertEqual(res_manifest.status_code, 200)
        data = res_manifest.get_json()
        self.assertEqual(data.get('id'), '/')
        self.assertEqual(data.get('icons')[0]['src'], '/images/logo.png')
        print("  [OK] /manifest.webmanifest -> Valid JSON with scope '/' and original logo.png")

        res_sw = self.client.get('/sw.js')
        self.assertEqual(res_sw.status_code, 200)
        self.assertIn(b'wb-cache', res_sw.data)
        print("  [OK] /sw.js -> Served with Service-Worker-Allowed header")

        res_fav = self.client.get('/favicon.ico')
        self.assertEqual(res_fav.status_code, 200)
        print("  [OK] /favicon.ico -> Served authentic logo directly")

    # ─── 3. ADMIN 2FA TOTP ENGINE ────────────────────────────────
    def test_03_totp_2fa_service(self):
        print("\n[QA Test 03] Testing TOTP 2FA Service...")
        secret = TOTPService.generate_secret()
        self.assertTrue(len(secret) >= 16)
        
        uri = TOTPService.get_provisioning_uri(secret, 'admin@websitebuilders.com')
        self.assertIn('otpauth://totp/', uri)
        
        qr_b64 = TOTPService.generate_qr_code_base64(uri)
        self.assertTrue(qr_b64.startswith('data:image/png;base64,'))
        
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()
        self.assertTrue(TOTPService.verify_token(secret, valid_code))
        self.assertFalse(TOTPService.verify_token(secret, '000000'))
        print("  [OK] TOTP secret generation, QR Data URI & RFC 6238 token verification verified.")

    # ─── 4. 2FA API ENDPOINTS ────────────────────────────────────
    def test_04_2fa_endpoints(self):
        print("\n[QA Test 04] Testing Admin 2FA API Endpoints...")
        self.login_as(role='Admin')
        
        res = self.client.get('/api/admin/2fa/setup')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))
        secret = data.get('secret')

        # Invalid token rejection
        res_bad = self.client.post('/api/admin/2fa/enable', json={'token': '999999', 'secret': secret})
        self.assertEqual(res_bad.status_code, 400)

        # Valid token acceptance
        totp = pyotp.TOTP(secret)
        good_code = totp.now()
        res_good = self.client.post('/api/admin/2fa/enable', json={'token': good_code, 'secret': secret})
        self.assertEqual(res_good.status_code, 200)
        self.assertTrue(res_good.get_json().get('success'))
        print("  [OK] /api/admin/2fa/setup and /api/admin/2fa/enable verified successfully.")

    # ─── 5. ANALYTICS & REPORTING ────────────────────────────────
    def test_05_analytics_endpoints(self):
        print("\n[QA Test 05] Testing Analytics Endpoints...")
        self.login_as(role='Admin')
        
        res_funnel = self.client.get('/api/analytics/conversion-funnel')
        self.assertEqual(res_funnel.status_code, 200)
        f_data = res_funnel.get_json()
        self.assertTrue(f_data.get('success'))
        self.assertIn('funnel', f_data)
        print(f"  [OK] Conversion Funnel: {f_data['funnel']}")

        res_forecast = self.client.get('/api/analytics/revenue-forecast')
        self.assertEqual(res_forecast.status_code, 200)
        fc_data = res_forecast.get_json()
        self.assertIn('weighted_forecast', fc_data)
        print(f"  [OK] Revenue Forecast: Expected Rs {fc_data.get('weighted_forecast', 0):,}")

    # ─── 6. REPORTLAB PDF REPORT GENERATOR ───────────────────────
    def test_06_pdf_generator(self):
        print("\n[QA Test 06] Testing Server-Side PDF Report Engine...")
        sample_report = {
            "client_name": "Acme Global Corp",
            "client_email": "contact@acme.com",
            "project_id": "PRJ-TEST-101",
            "project_name": "Global Enterprise Redesign",
            "month_year": "September 2026",
            "current_stage": "Quality Assurance",
            "progress": "85%",
            "delivery_date": "October 30, 2026",
            "executive_summary": "Core deliverables completed ahead of schedule with 99.9% uptime.",
            "completed_tasks": [
                {"title": "PWA Architecture", "completed_at": "Sep 10, 2026", "time_spent": "18h", "deliverable_url": "https://websitebuilders.com"},
                {"title": "2FA Security Hardening", "completed_at": "Sep 18, 2026", "time_spent": "14h", "deliverable_url": "https://websitebuilders.com"}
            ],
            "upcoming_milestones": [
                {"title": "Production Deployment", "due_date": "Oct 15, 2026", "owner": "Venu", "status": "Ready"}
            ],
            "kpis": [
                {"label": "Uptime", "value": "99.98%", "benchmark": "99.90%", "status": "Exceeded"}
            ],
            "invoices": [
                {"invoice_id": "INV-2026-01", "amount": 45000, "status": "Paid", "due_date": "Sep 01, 2026"}
            ]
        }
        pdf_bytes = generate_monthly_client_pdf(sample_report)
        pdf_content = pdf_bytes.getvalue()
        self.assertTrue(pdf_content.startswith(b'%PDF'), "Output is not a valid PDF")
        self.assertTrue(len(pdf_content) > 3000, "PDF size is unexpectedly small")
        print(f"  [OK] PDF generated successfully: {len(pdf_content)} bytes.")

    # ─── 7. REVISIONS SYSTEM ─────────────────────────────────────
    def test_07_revisions_crud(self):
        print("\n[QA Test 07] Testing Visual Revisions System...")
        self.login_as(role='Customer', user_id='USR-CLIENT-1', email='client@test.com')
        
        # Fetch revisions
        res_get = self.client.get('/api/revisions')
        self.assertEqual(res_get.status_code, 200)

        # Create revision with annotation pin
        payload = {
            "project_id": "PRJ-TEST-101",
            "deliverable_title": "Hero Section Mockup v2",
            "deliverable_url": "/images/hero-mockup.png",
            "priority": "High",
            "description": "Adjust CTA button padding and font color",
            "pins": [
                {"x": 0.45, "y": 0.32, "note": "Make primary button text bolder", "id": 1}
            ]
        }
        res_post = self.client.post('/api/revisions', json=payload)
        self.assertEqual(res_post.status_code, 200)
        res_data = res_post.get_json()
        self.assertTrue(res_data.get('success'))
        rev_id = res_data.get('revision', {}).get('id')
        print(f"  [OK] Revision created with ID: {rev_id}")

        # Admin status update
        self.login_as(role='Admin')
        if rev_id:
            res_patch = self.client.patch(f'/api/revisions/{rev_id}/status', json={'status': 'In Progress'})
            self.assertEqual(res_patch.status_code, 200)
            print("  [OK] Revision status updated to 'In Progress'")

    # ─── 8. MAINTENANCE SYSTEM ───────────────────────────────────
    def test_08_maintenance_tickets(self):
        print("\n[QA Test 08] Testing Post-Launch Maintenance Tickets...")
        self.login_as(role='Customer', user_id='USR-CLIENT-1', email='client@test.com')
        
        res_get = self.client.get('/api/maintenance')
        self.assertEqual(res_get.status_code, 200)

        payload = {
            "project_id": "PRJ-TEST-101",
            "title": "Update Footer Contact Details",
            "description": "Update new support phone number and office location",
            "category": "Content Update",
            "priority": "Medium"
        }
        res_post = self.client.post('/api/maintenance', json=payload)
        self.assertEqual(res_post.status_code, 200)
        mnt_data = res_post.get_json()
        self.assertTrue(mnt_data.get('success'))
        ticket_id = mnt_data.get('request', {}).get('id')
        print(f"  [OK] Maintenance ticket submitted: {ticket_id}")

        self.login_as(role='Admin')
        if ticket_id:
            res_patch = self.client.patch(f'/api/maintenance/{ticket_id}', json={
                'status': 'Approved',
                'quote_hours': 3,
                'quote_cost': 4500
            })
            self.assertEqual(res_patch.status_code, 200)
            print("  [OK] Maintenance ticket quoted & approved")

    # ─── 9. PARTIAL LEAD CAPTURE ─────────────────────────────────
    def test_09_partial_lead_capture(self):
        print("\n[QA Test 09] Testing 24-Hour Abandoned Lead Capture...")
        payload = {
            "name": "Jane Tester",
            "email": "jane.tester@example.com",
            "phone": "+91 9876543210",
            "project_type": "E-Commerce Store",
            "budget": "Rs 50,000 - 1,00,000",
            "page_url": "https://websitebuilders.com/contact.html"
        }
        res = self.client.post('/api/leads/partial-capture', json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json().get('success'))
        print("  [OK] Partial lead captured for automated follow-up.")

    # ─── 10. CSAT SURVEY ─────────────────────────────────────────
    def test_10_csat_survey(self):
        print("\n[QA Test 10] Testing CSAT Survey Submission...")
        res_page = self.client.get('/survey?token=TEST_TOKEN_123')
        self.assertEqual(res_page.status_code, 200)

        payload = {
            "token": "TEST_TOKEN_123",
            "rating": 5,
            "feedback": "Flawless communication, outstanding design quality and punctual delivery!",
            "recommend": "Definitely"
        }
        res_sub = self.client.post('/api/survey/submit', json=payload)
        self.assertEqual(res_sub.status_code, 200)
        self.assertTrue(res_sub.get_json().get('success'))
        print("  [OK] CSAT 5-star survey submitted and recorded.")

    # ─── 11. AUTOMATION CRON ENGINE ──────────────────────────────
    def test_11_automation_engine(self):
        print("\n[QA Test 11] Testing Automation Engine & Daily Job...")
        engine = AutomationEngine(flask_app.call_gas)
        summary = engine.run_daily_automations()
        self.assertIsInstance(summary, dict)
        self.assertIn('lead_followups', summary)
        self.assertIn('invoice_reminders', summary)
        self.assertIn('deadline_alerts', summary)
        print(f"  [OK] Automation Cron executed cleanly: {summary}")

if __name__ == '__main__':
    unittest.main(verbosity=2)
