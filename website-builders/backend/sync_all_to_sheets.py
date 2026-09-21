"""
Sync and Database Reset Utility for Google Sheets CRM
Allows Super Admins and developers to:
1. Clear all sheets and restore standardized headers (--clear)
2. Seed initial baseline demo data (--seed)
3. Sync test records adhering to standardized headers (Col 1: ID, Col 2: Name, Col 3: Email)
"""

import sys
import os
import argparse
import time
import logging

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import call_gas, sync_to_google_sheets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sheet_sync")


def clear_all_sheets():
    """Trigger GAS clearAllData to wipe all data rows, re-format headers, and seed baseline accounts."""
    logger.info("Requesting full Google Sheets wipe and header reset...")
    res = call_gas('clearAllData', timeout=40)
    if res.get('status') == 'success':
        logger.info("Successfully cleared sheets and reset headers: %s", res.get('message'))
        logger.info("Details: %s", res.get('data'))
        return True
    else:
        logger.error("Failed to clear sheets: %s", res.get('message'))
        return False


def seed_standard_data():
    """Seed sample projects, tasks, meetings, invoices, and enquiries conforming to new standardized headers."""
    logger.info("Seeding sample data conforming to standardized headers...")

    # 1. Sample Projects
    sample_projects = [
        {
            'project_id': 'PRJ-101',
            'client_name': 'Acme Corporation',
            'client_email': 'client@websitebuilders.com',
            'client_id': 'USR-CLIENT-001',
            'project_name': 'E-Commerce Platform Redesign',
            'service_type': 'Full Stack Web App',
            'domain_name': 'acmewebsite.com',
            'budget': 5000,
            'amount_paid': 2500,
            'status': 'In Progress',
            'start_date': '2026-09-01',
            'deadline': '2026-10-31',
            'assigned_staff': 'Dev Team Alpha',
            'drive_folder_url': 'https://drive.google.com',
            'notes': 'Migrated to standardized headers',
        },
        {
            'project_id': 'PRJ-102',
            'client_name': 'Starlight Tech Solutions',
            'client_email': 'info@starlighttech.com',
            'client_id': 'USR-CLIENT-002',
            'project_name': 'Corporate Portfolio & Portal',
            'service_type': 'Next.js Web Portal',
            'domain_name': 'starlighttech.io',
            'budget': 3200,
            'amount_paid': 3200,
            'status': 'Completed',
            'start_date': '2026-08-15',
            'deadline': '2026-09-15',
            'assigned_staff': 'UI/UX Studio',
            'drive_folder_url': 'https://drive.google.com',
            'notes': 'Completed on schedule',
        }
    ]

    for p in sample_projects:
        logger.info("Syncing Project: %s (Client: %s <%s>)", p['project_id'], p['client_name'], p['client_email'])
        res = sync_to_google_sheets('sync_project', p)
        logger.info("Project sync response: %s", res.get('status'))
        time.sleep(0.5)

    # 2. Sample Tasks
    sample_tasks = [
        {
            'task_id': 'TSK-101',
            'client_name': 'Acme Corporation',
            'client_email': 'client@websitebuilders.com',
            'project_id': 'PRJ-101',
            'title': 'Design System and UI Mockups',
            'description': 'Create comprehensive Figma components and design tokens',
            'assigned_to': 'Design Lead',
            'priority': 'High',
            'status': 'Completed',
            'due_date': '2026-09-10',
            'completed_at': '2026-09-09'
        },
        {
            'task_id': 'TSK-102',
            'client_name': 'Acme Corporation',
            'client_email': 'client@websitebuilders.com',
            'project_id': 'PRJ-101',
            'title': 'Payment Gateway Integration',
            'description': 'Integrate Razorpay and Stripe with webhook verification',
            'assigned_to': 'Staff Engineer',
            'priority': 'Critical',
            'status': 'In Progress',
            'due_date': '2026-09-30'
        }
    ]

    for t in sample_tasks:
        logger.info("Syncing Task: %s (Client: %s <%s>)", t['task_id'], t['client_name'], t['client_email'])
        res = sync_to_google_sheets('sync_task', t)
        logger.info("Task sync response: %s", res.get('status'))
        time.sleep(0.5)

    # 3. Sample Meetings
    sample_meetings = [
        {
            'meeting_id': 'MTG-101',
            'client_name': 'Acme Corporation',
            'client_email': 'client@websitebuilders.com',
            'title': 'Sprint Review & Demo',
            'scheduled_time': '2026-09-25 15:00',
            'status': 'Scheduled',
            'project_id': 'PRJ-101',
            'meeting_link': 'https://meet.google.com/abc-defg-hij',
            'host_user_id': 'USR-SUPERADMIN-001',
            'notes': 'Review sprint deliverables with client stakeholders'
        }
    ]

    for m in sample_meetings:
        logger.info("Syncing Meeting: %s (Client: %s <%s>)", m['meeting_id'], m['client_name'], m['client_email'])
        res = sync_to_google_sheets('sync_meeting', m)
        logger.info("Meeting sync response: %s", res.get('status'))
        time.sleep(0.5)

    # 4. Sample Invoices
    sample_invoices = [
        {
            'invoice_id': 'INV-101',
            'client_name': 'Acme Corporation',
            'client_email': 'client@websitebuilders.com',
            'project_id': 'PRJ-101',
            'amount': 2500,
            'tax': 450,
            'total_amount': 2950,
            'currency': 'USD',
            'status': 'Paid',
            'due_date': '2026-09-15',
            'issued_date': '2026-09-01'
        }
    ]

    for inv in sample_invoices:
        logger.info("Syncing Invoice: %s (Client: %s <%s>)", inv['invoice_id'], inv['client_name'], inv['client_email'])
        res = sync_to_google_sheets('sync_invoice', inv)
        logger.info("Invoice sync response: %s", res.get('status'))
        time.sleep(0.5)

    logger.info("[SUCCESS] Sample data seeded conforming to standardized headers.")
    return True


def main():
    parser = argparse.ArgumentParser(description="Google Sheets CRM Sync & Management Tool")
    parser.add_argument('--clear', action='store_true', help="Clear all sheets, reset headers, and reseed baseline users")
    parser.add_argument('--seed', action='store_true', help="Seed standard demo projects, tasks, meetings, and invoices")
    args = parser.parse_args()

    if not args.clear and not args.seed:
        parser.print_help()
        sys.exit(0)

    if args.clear:
        ok = clear_all_sheets()
        if not ok:
            sys.exit(1)

    if args.seed:
        ok = seed_standard_data()
        if not ok:
            sys.exit(1)


if __name__ == '__main__':
    main()
