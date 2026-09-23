"""
Website Builders — Centralized Automation Engine
Handles scheduled jobs, reminders, lead follow-ups, deadline alerts, and monthly report distribution.
All operations are fully idempotent to prevent duplicate messages or notifications.
"""

import logging
from datetime import datetime, timedelta
import pytz

logger = logging.getLogger(__name__)
IST = pytz.timezone('Asia/Kolkata')

class AutomationEngine:
    def __init__(self, gas_caller):
        self.call_gas = gas_caller

    def get_current_time(self):
        return datetime.now(IST)

    def run_daily_automations(self) -> dict:
        """
        Executes all daily automated workflows idempotently.
        """
        results = {
            "lead_followups": 0,
            "invoice_reminders": 0,
            "deadline_alerts": 0,
            "abandoned_contacts": 0,
            "errors": []
        }

        try:
            results["lead_followups"] = self.process_lead_followups()
        except Exception as e:
            logger.error("Error processing lead followups: %s", str(e))
            results["errors"].append(f"Leads: {str(e)}")

        try:
            results["invoice_reminders"] = self.process_invoice_reminders()
        except Exception as e:
            logger.error("Error processing invoice reminders: %s", str(e))
            results["errors"].append(f"Invoices: {str(e)}")

        try:
            results["deadline_alerts"] = self.process_project_deadline_alerts()
        except Exception as e:
            logger.error("Error processing deadline alerts: %s", str(e))
            results["errors"].append(f"Deadlines: {str(e)}")

        try:
            results["abandoned_contacts"] = self.process_abandoned_contacts()
        except Exception as e:
            logger.error("Error processing abandoned contacts: %s", str(e))
            results["errors"].append(f"Abandoned: {str(e)}")

        return results

    def process_lead_followups(self) -> int:
        """Remind admin if a lead hasn't been contacted for >= 2 days."""
        count = 0
        now = self.get_current_time()
        two_days_ago = now - timedelta(days=2)
        
        # Get active leads from backend/GAS
        leads_res = self.call_gas('getLeads', {})
        if leads_res.get('status') != 'success':
            return 0

        leads = leads_res.get('data', [])
        for lead in leads:
            status = lead.get('status', '').lower()
            if status in ['closed', 'converted', 'contacted']:
                continue
            
            created_str = lead.get('created_at', '')
            if not created_str:
                continue
            
            try:
                created_dt = datetime.fromisoformat(created_str.replace('Z', '+00:00')).astimezone(IST)
                if created_dt <= two_days_ago:
                    # Check idempotency log
                    log_check = self.call_gas('checkLeadFollowupLog', {'lead_id': lead.get('id')})
                    if not log_check.get('already_sent'):
                        self.call_gas('sendLeadFollowupReminder', {
                            'lead_id': lead.get('id'),
                            'name': lead.get('name'),
                            'email': lead.get('email'),
                            'phone': lead.get('phone')
                        })
                        count += 1
            except Exception as ex:
                logger.debug("Lead date parse error: %s", ex)

        return count

    def process_invoice_reminders(self) -> int:
        """Send automated invoice reminders 3 days before due, on due date, and 3 days overdue."""
        count = 0
        now = self.get_current_time().date()

        invoices_res = self.call_gas('getInvoices', {})
        if invoices_res.get('status') != 'success':
            return 0

        invoices = invoices_res.get('data', [])
        for inv in invoices:
            if inv.get('status', '').lower() == 'paid':
                continue

            due_date_str = inv.get('due_date', '')
            if not due_date_str:
                continue

            try:
                due_date = datetime.strptime(due_date_str[:10], '%Y-%m-%d').date()
                diff_days = (due_date - now).days

                reminder_type = None
                if diff_days == 3:
                    reminder_type = 'before_due'
                elif diff_days == 0:
                    reminder_type = 'due_today'
                elif diff_days == -3:
                    reminder_type = 'overdue'

                if reminder_type:
                    # Idempotency check
                    log_check = self.call_gas('checkInvoiceReminderLog', {
                        'invoice_id': inv.get('id'),
                        'type': reminder_type
                    })
                    if not log_check.get('already_sent'):
                        self.call_gas('sendInvoiceReminder', {
                            'invoice_id': inv.get('id'),
                            'client_email': inv.get('client_email'),
                            'client_name': inv.get('client_name'),
                            'amount': inv.get('total_amount') or inv.get('amount'),
                            'due_date': due_date_str,
                            'type': reminder_type
                        })
                        count += 1
            except Exception as ex:
                logger.debug("Invoice date parse error: %s", ex)

        return count

    def process_project_deadline_alerts(self) -> int:
        """Alert admin and staff 7 days before project delivery date."""
        count = 0
        now = self.get_current_time().date()

        projects_res = self.call_gas('getProjects', {})
        if projects_res.get('status') != 'success':
            return 0

        projects = projects_res.get('data', [])
        for proj in projects:
            if proj.get('status', '').lower() in ['completed', 'cancelled']:
                continue

            delivery_str = proj.get('delivery_date') or proj.get('delivery', '')
            if not delivery_str:
                continue

            try:
                delivery_date = datetime.strptime(delivery_str[:10], '%Y-%m-%d').date()
                if (delivery_date - now).days == 7:
                    log_check = self.call_gas('checkDeadlineAlertLog', {
                        'project_id': proj.get('id')
                    })
                    if not log_check.get('already_sent'):
                        self.call_gas('sendDeadlineAlert', {
                            'project_id': proj.get('id'),
                            'project_name': proj.get('name'),
                            'delivery_date': delivery_str,
                            'client_name': proj.get('client_name')
                        })
                        count += 1
            except Exception as ex:
                logger.debug("Project deadline date parse error: %s", ex)

        return count

    def process_abandoned_contacts(self) -> int:
        """Send a polite follow up for contacts abandoned > 24 hours ago without duplicate."""
        count = 0
        now = self.get_current_time()
        one_day_ago = now - timedelta(hours=24)

        abandoned_res = self.call_gas('getAbandonedContacts', {})
        if abandoned_res.get('status') != 'success':
            return 0

        contacts = abandoned_res.get('data', [])
        for contact in contacts:
            if contact.get('follow_up_sent') or contact.get('status') == 'converted':
                continue

            started_str = contact.get('started_at', '')
            if not started_str:
                continue

            try:
                started_dt = datetime.fromisoformat(started_str.replace('Z', '+00:00')).astimezone(IST)
                if started_dt <= one_day_ago:
                    self.call_gas('sendAbandonedContactFollowup', {
                        'contact_id': contact.get('id'),
                        'email': contact.get('email'),
                        'name': contact.get('name', 'Valued Visitor')
                    })
                    count += 1
            except Exception as ex:
                logger.debug("Abandoned contact date error: %s", ex)

        return count
