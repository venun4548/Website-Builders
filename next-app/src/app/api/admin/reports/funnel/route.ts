import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getActiveRows } from '@/lib/sheets';
import { Lead, ContactSubmission, Project, Invoice, User } from '@/types/schema';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const [leads, contacts, projects, invoices] = await Promise.all([
      getActiveRows<Lead>('Leads'),
      getActiveRows<ContactSubmission>('ContactSubmissions'),
      getActiveRows<Project>('Projects'),
      getActiveRows<Invoice>('Invoices'),
    ]);

    // Optional date filtering
    const filterDate = (itemDate?: string) => {
      if (!itemDate) return true;
      const t = new Date(itemDate).getTime();
      if (startDate && t < new Date(startDate).getTime()) return false;
      if (endDate && t > new Date(endDate).getTime()) return false;
      return true;
    };

    const filteredLeads = leads.filter((l) => filterDate(l.createdAt));
    const filteredContacts = contacts.filter((c) => filterDate(c.submittedAt));
    const filteredProjects = projects.filter((p) => filterDate(p.createdAt));
    const filteredInvoices = invoices.filter((i) => filterDate(i.createdAt));

    // Funnel Steps:
    // 1. Total Leads: Unique from Leads + Contacts
    const totalLeadsCount = filteredLeads.length + filteredContacts.length;

    // 2. Contacted: Leads status not 'New'
    const contactedCount = filteredLeads.filter(
      (l) => l.status && l.status !== 'New'
    ).length;

    // 3. Qualified
    const qualifiedCount = filteredLeads.filter(
      (l) => ['Qualified', 'Proposal', 'Negotiation', 'Won'].includes(l.status)
    ).length;

    // 4. Proposals Created
    const proposalsCount = filteredLeads.filter(
      (l) => ['Proposal', 'Negotiation', 'Won'].includes(l.status)
    ).length;

    // 5. Accepted Proposals
    const acceptedCount = filteredProjects.length;

    // 6. Paid Clients
    const paidCount = filteredInvoices.filter(
      (inv) => String(inv.status).toLowerCase() === 'paid'
    ).length;

    const baseCount = Math.max(1, totalLeadsCount);

    const funnelSteps = [
      {
        stage: 'Lead',
        label: 'Total Leads Generated',
        count: totalLeadsCount,
        percentageOfTotal: 100,
        dropoffRate: totalLeadsCount > 0 ? Math.round(((totalLeadsCount - contactedCount) / totalLeadsCount) * 100) : 0,
      },
      {
        stage: 'Contacted',
        label: 'Initial Contact Established',
        count: contactedCount,
        percentageOfTotal: Math.round((contactedCount / baseCount) * 100),
        dropoffRate: contactedCount > 0 ? Math.round(((contactedCount - qualifiedCount) / contactedCount) * 100) : 0,
      },
      {
        stage: 'Qualified',
        label: 'Qualified Business Opportunities',
        count: qualifiedCount,
        percentageOfTotal: Math.round((qualifiedCount / baseCount) * 100),
        dropoffRate: qualifiedCount > 0 ? Math.round(((qualifiedCount - proposalsCount) / qualifiedCount) * 100) : 0,
      },
      {
        stage: 'Proposal',
        label: 'Proposals & Estimates Submitted',
        count: proposalsCount,
        percentageOfTotal: Math.round((proposalsCount / baseCount) * 100),
        dropoffRate: proposalsCount > 0 ? Math.round(((proposalsCount - acceptedCount) / proposalsCount) * 100) : 0,
      },
      {
        stage: 'Accepted',
        label: 'Proposals Accepted / Projects Created',
        count: acceptedCount,
        percentageOfTotal: Math.round((acceptedCount / baseCount) * 100),
        dropoffRate: acceptedCount > 0 ? Math.round(((acceptedCount - paidCount) / Math.max(1, acceptedCount)) * 100) : 0,
      },
      {
        stage: 'Paid Client',
        label: 'Paid Clients & Invoices Closed',
        count: paidCount,
        percentageOfTotal: Math.round((paidCount / baseCount) * 100),
        dropoffRate: 0,
      },
    ];

    const overallConversionRate = Math.round((paidCount / baseCount) * 100);

    return NextResponse.json({
      success: true,
      summary: {
        totalLeads: totalLeadsCount,
        contacted: contactedCount,
        qualified: qualifiedCount,
        proposals: proposalsCount,
        accepted: acceptedCount,
        paid: paidCount,
        overallConversionRate,
      },
      funnelSteps,
    });
  } catch (err: any) {
    console.error('Error generating conversion funnel report:', err);
    return NextResponse.json({ error: 'Failed to calculate conversion funnel.' }, { status: 500 });
  }
}
