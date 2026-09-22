import { NextResponse } from 'next/server';
import { withRole } from '@/lib/auth';
import { getActiveRows } from '@/lib/sheets';
import { Invoice, Project, Lead, Ticket, AuditLogEntry, ProjectStage, LeadStatus } from '@/types/schema';

export const GET = withRole(['admin', 'superadmin', 'staff'])(async () => {
  try {
    const invoices = await getActiveRows<Invoice>('Invoices');
    const projects = await getActiveRows<Project>('Projects');
    const leads = await getActiveRows<Lead>('Leads');
    const tickets = await getActiveRows<Ticket>('Tickets');
    const auditLogs = await getActiveRows<AuditLogEntry>('AuditLog');

    // 1. Revenue metrics
    const paidInvoices = invoices.filter((i) => i.status === 'Paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRevenue = paidInvoices
      .filter((i) => {
        if (!i.paidAt) return false;
        const d = new Date(i.paidAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

    const pendingRevenue = invoices
      .filter((i) => i.status === 'Sent' || i.status === 'Draft')
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

    // 2. Project stage metrics
    const stageCounts: Record<ProjectStage, number> = {
      Discovery: 0,
      Design: 0,
      Development: 0,
      Testing: 0,
      Review: 0,
      Launched: 0,
    };
    projects.forEach((p) => {
      if (p.stage && stageCounts[p.stage] !== undefined) {
        stageCounts[p.stage]++;
      }
    });

    const projectDistribution = Object.entries(stageCounts).map(([stage, count]) => ({
      name: stage,
      value: count,
    }));

    // 3. Leads metrics & pipeline breakdown
    const leadStages: Record<LeadStatus, number> = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Proposal: 0,
      Negotiation: 0,
      Won: 0,
      Lost: 0,
    };
    leads.forEach((l) => {
      if (l.status && leadStages[l.status] !== undefined) {
        leadStages[l.status]++;
      }
    });

    const wonLeads = leadStages.Won || 0;
    const totalLeads = leads.length;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    const leadPipelineData = Object.entries(leadStages).map(([status, count]) => ({
      stage: status,
      count,
    }));

    // 4. Ticket metrics
    const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
    const resolvedTickets = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

    // 5. Revenue by month for chart (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueTimeline: { month: string; revenue: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const mName = `${monthNames[m]} ${y === currentYear ? '' : y}`.trim();

      const rev = paidInvoices
        .filter((inv) => {
          if (!inv.paidAt) return false;
          const invDate = new Date(inv.paidAt);
          return invDate.getMonth() === m && invDate.getFullYear() === y;
        })
        .reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

      revenueTimeline.push({ month: mName, revenue: rev });
    }

    // 6. Recent audit activity
    const recentActivity = [...auditLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    // 7. Recent projects with client name & email
    const recentProjects = [...projects]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        name: p.name,
        clientName: p.clientName || 'Valued Client',
        clientEmail: p.clientEmail || '',
        stage: p.stage,
        progress: p.progress,
        tier: p.tier,
      }));

    // 8. Recent invoices with client name & email
    const recentInvoices = [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((inv) => ({
        id: inv.id,
        projectName: inv.projectName,
        clientName: inv.clientName || 'Valued Client',
        clientEmail: inv.clientEmail || '',
        totalAmount: inv.totalAmount,
        status: inv.status,
        dueDate: inv.dueDate,
      }));

    return NextResponse.json({
      metrics: {
        totalRevenue,
        monthlyRevenue,
        pendingRevenue,
        totalProjects: projects.length,
        activeProjects: projects.filter((p) => p.stage !== 'Launched').length,
        launchedProjects: stageCounts.Launched,
        totalLeads,
        wonLeads,
        conversionRate,
        openTickets,
        resolvedTickets,
      },
      charts: {
        revenueTimeline,
        projectDistribution,
        leadPipelineData,
      },
      recentActivity,
      recentProjects,
      recentInvoices,
    });
  } catch (err) {
    console.error('GET /api/admin/analytics error:', err);
    return NextResponse.json({ error: 'Failed to aggregate analytics' }, { status: 500 });
  }
});
