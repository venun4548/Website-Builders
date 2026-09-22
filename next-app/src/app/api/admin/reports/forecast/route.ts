import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getActiveRows } from '@/lib/sheets';
import { Invoice, Lead, Project, WebsiteSetting } from '@/types/schema';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const [invoices, leads, settings] = await Promise.all([
      getActiveRows<Invoice>('Invoices'),
      getActiveRows<Lead>('Leads'),
      getActiveRows<WebsiteSetting>('WebsiteSettings'),
    ]);

    // Load or default stage probabilities
    const probSetting = settings.find((s) => s.key === 'forecast_probabilities');
    let probabilities: Record<string, number> = {
      New: 0.1,
      Contacted: 0.25,
      Qualified: 0.4,
      Proposal: 0.6,
      Negotiation: 0.8,
      Won: 1.0,
      Accepted: 1.0,
    };

    if (probSetting && probSetting.value) {
      try {
        probabilities = { ...probabilities, ...JSON.parse(probSetting.value) };
      } catch (e) {
        console.warn('Could not parse custom forecast probabilities, using defaults.');
      }
    }

    // 1. Confirmed Revenue (Paid invoices)
    const paidInvoices = invoices.filter(
      (i) => String(i.status).toLowerCase() === 'paid'
    );
    const confirmedRevenue = paidInvoices.reduce(
      (sum, i) => sum + (Number(i.totalAmount) || Number(i.amount) || 0),
      0
    );

    // Pending Invoices (Sent/Overdue)
    const pendingInvoices = invoices.filter(
      (i) => ['sent', 'overdue'].includes(String(i.status).toLowerCase())
    );
    const pendingInvoiceRevenue = pendingInvoices.reduce(
      (sum, i) => sum + (Number(i.totalAmount) || Number(i.amount) || 0),
      0
    );

    // 2. Pipeline Revenue & Weighted Forecast from Leads with Budgets
    let pipelineRevenue = 0;
    let weightedPipeline = 0;
    let activeProposalCount = 0;
    const proposalValues: number[] = [];

    leads.forEach((l) => {
      // Parse budget string or numeric estimate
      const rawBudget = l.budget ? String(l.budget).replace(/[^\d.]/g, '') : '';
      const amount = Number(rawBudget) || 25000; // default estimated deal size

      if (['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation'].includes(l.status)) {
        pipelineRevenue += amount;
        const prob = probabilities[l.status] !== undefined ? probabilities[l.status] : 0.2;
        weightedPipeline += amount * prob;
        activeProposalCount++;
        proposalValues.push(amount);
      }
    });

    const averageProposalValue =
      proposalValues.length > 0
        ? Math.round(proposalValues.reduce((a, b) => a + b, 0) / proposalValues.length)
        : 0;

    const totalEstimatedForecast = Math.round(confirmedRevenue + pendingInvoiceRevenue + weightedPipeline);
    const nextMonthForecast = Math.round(pendingInvoiceRevenue + weightedPipeline * 0.5);

    return NextResponse.json({
      success: true,
      disclaimer: 'Estimated forecast only. Not guaranteed revenue.',
      confirmedRevenue: Math.round(confirmedRevenue),
      pendingInvoiceRevenue: Math.round(pendingInvoiceRevenue),
      pipelineRevenue: Math.round(pipelineRevenue),
      weightedPipeline: Math.round(weightedPipeline),
      totalEstimatedForecast,
      nextMonthForecast,
      activeProposalsCount: activeProposalCount,
      averageProposalValue,
      probabilities,
    });
  } catch (err: any) {
    console.error('Error calculating revenue forecast:', err);
    return NextResponse.json({ error: 'Failed to calculate revenue forecast.' }, { status: 500 });
  }
}
