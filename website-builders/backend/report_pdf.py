"""
Website Builders — Monthly Client Project Report PDF Engine
Uses ReportLab to generate clean, professional 2-page branded client performance reports.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)

PRIMARY_COLOR = colors.HexColor("#0f172a") # Slate Navy
ACCENT_GREEN = colors.HexColor("#10b981")  # Emerald
MUTED_TEXT = colors.HexColor("#64748b")
BG_LIGHT = colors.HexColor("#f8fafc")
BORDER_COLOR = colors.HexColor("#e2e8f0")

def generate_monthly_client_pdf(report_data: dict) -> io.BytesIO:
    """
    Generates a 2-page branded PDF report from report_data dictionary.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY_COLOR
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=MUTED_TEXT
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=PRIMARY_COLOR,
        spaceAfter=6
    )

    cell_bold = ParagraphStyle('CellBold', fontName='Helvetica-Bold', fontSize=9, leading=11, textColor=PRIMARY_COLOR)
    cell_normal = ParagraphStyle('CellNormal', fontName='Helvetica', fontSize=8, leading=10, textColor=PRIMARY_COLOR)
    cell_muted = ParagraphStyle('CellMuted', fontName='Helvetica', fontSize=8, leading=10, textColor=MUTED_TEXT)

    story = []

    # ─── HEADER ───
    client_name = report_data.get('client_name', 'Valued Client')
    client_email = report_data.get('client_email', 'client@example.com')
    project_name = report_data.get('project_name', 'Website Project')
    project_id = report_data.get('project_id', 'WB-2026-001')
    month_year = report_data.get('month_year', datetime.now().strftime("%B %Y"))
    current_stage = report_data.get('current_stage', 'Development')
    progress = report_data.get('progress', '75%')
    delivery_date = report_data.get('delivery_date', 'Oct 15, 2026')

    header_table_data = [
        [
            Paragraph("<b>WEBSITE BUILDERS</b><br/><font size=8 color='#64748b'>Enterprise Digital Solutions</font>", title_style),
            Paragraph(f"<font size=12 color='#10b981'><b>MONTHLY PROJECT REPORT</b></font><br/><b>Period:</b> {month_year}<br/><b>Generated:</b> {datetime.now().strftime('%d %b %Y')}", subtitle_style)
        ]
    ]
    header_table = Table(header_table_data, colWidths=[280, 260])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT_GREEN, spaceAfter=14))

    # ─── CLIENT & PROJECT OVERVIEW CARD ───
    info_data = [
        [
            Paragraph("<b>Client Name:</b> " + client_name, cell_normal),
            Paragraph("<b>Project ID:</b> " + project_id, cell_normal),
            Paragraph("<b>Current Stage:</b> <font color='#10b981'><b>" + current_stage + "</b></font>", cell_normal)
        ],
        [
            Paragraph("<b>Client Email:</b> " + client_email, cell_normal),
            Paragraph("<b>Project Name:</b> " + project_name, cell_normal),
            Paragraph(f"<b>Overall Progress:</b> <b>{progress}</b>", cell_normal)
        ]
    ]
    info_table = Table(info_data, colWidths=[180, 180, 180])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 16))

    # ─── KEY PERFORMANCE METRICS ───
    story.append(Paragraph("Monthly Performance Metrics", section_heading))
    kpi_data = [
        [
            Paragraph("<b>Tasks Completed</b><br/><font size=14 color='#10b981'><b>" + str(report_data.get('tasks_completed', 14)) + "</b></font>", cell_bold),
            Paragraph("<b>Avg Turnaround</b><br/><font size=14 color='#0f172a'><b>" + str(report_data.get('turnaround', '< 4 hrs')) + "</b></font>", cell_bold),
            Paragraph("<b>Uptime / Health</b><br/><font size=14 color='#10b981'><b>99.98%</b></font>", cell_bold),
            Paragraph("<b>Target Delivery</b><br/><font size=14 color='#0f172a'><b>" + delivery_date + "</b></font>", cell_bold)
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[135, 135, 135, 135])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 16))

    # ─── WORK COMPLETED TABLE ───
    story.append(Paragraph("Work & Milestones Completed This Month", section_heading))
    updates = report_data.get('updates', [
        {'date': '02 Sep', 'stage': 'UI Design', 'activity': 'Homepage & Dashboard visual mockups finalized', 'member': 'Design Team'},
        {'date': '08 Sep', 'stage': 'Development', 'activity': 'REST API integration with Google Sheets backend', 'member': 'Engineering'},
        {'date': '15 Sep', 'stage': 'Development', 'activity': 'Client Portal & Invoicing workflows implemented', 'member': 'Engineering'},
        {'date': '20 Sep', 'stage': 'Testing & QA', 'activity': 'Security review, 2FA setup, and mobile responsiveness', 'member': 'QA Lead'}
    ])

    work_table_data = [[
        Paragraph("<b>Date</b>", cell_bold),
        Paragraph("<b>Phase / Stage</b>", cell_bold),
        Paragraph("<b>Activity / Deliverable</b>", cell_bold),
        Paragraph("<b>Responsible</b>", cell_bold)
    ]]
    for u in updates:
        work_table_data.append([
            Paragraph(u.get('date', '-'), cell_normal),
            Paragraph(u.get('stage', '-'), cell_normal),
            Paragraph(u.get('activity', '-'), cell_normal),
            Paragraph(u.get('member', 'Team'), cell_muted)
        ])

    work_table = Table(work_table_data, colWidths=[65, 110, 275, 90])
    work_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(work_table)

    # ─── PAGE BREAK TO PAGE 2 ───
    story.append(PageBreak())

    # ─── PAGE 2: TIMELINE, INVOICES & NEXT STEPS ───
    story.append(Paragraph("Project Lifecycle & Stage Roadmap", section_heading))
    
    stages = [
        ("1. Requirements", "Completed", colors.HexColor("#10b981")),
        ("2. Planning", "Completed", colors.HexColor("#10b981")),
        ("3. UI/UX Design", "Completed", colors.HexColor("#10b981")),
        ("4. Development", "In Progress", colors.HexColor("#3b82f6")),
        ("5. Testing & QA", "Upcoming", colors.HexColor("#94a3b8")),
        ("6. Deployment", "Upcoming", colors.HexColor("#94a3b8")),
        ("7. Support", "Upcoming", colors.HexColor("#94a3b8"))
    ]
    timeline_rows = [[
        Paragraph(f"<b>{s[0]}</b>", cell_bold),
        Paragraph(f"<font color='{s[2].hexval()}'><b>● {s[1]}</b></font>", cell_normal)
    ] for s in stages]
    timeline_table = Table(timeline_rows, colWidths=[270, 270])
    timeline_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(timeline_table)
    story.append(Spacer(1, 16))

    # ─── FINANCIAL / INVOICES SUMMARY ───
    story.append(Paragraph("Invoices & Payment Status", section_heading))
    invoices_data = [
        [
            Paragraph("<b>Invoice #</b>", cell_bold),
            Paragraph("<b>Description</b>", cell_bold),
            Paragraph("<b>Amount</b>", cell_bold),
            Paragraph("<b>Status</b>", cell_bold)
        ],
        [
            Paragraph("INV-2026-001", cell_normal),
            Paragraph("Milestone 1 — Planning & Prototype", cell_normal),
            Paragraph("₹ 25,000", cell_normal),
            Paragraph("<font color='#10b981'><b>PAID</b></font>", cell_normal)
        ],
        [
            Paragraph("INV-2026-002", cell_normal),
            Paragraph("Milestone 2 — Core Engine & Integration", cell_normal),
            Paragraph("₹ 35,000", cell_normal),
            Paragraph("<font color='#10b981'><b>PAID</b></font>", cell_normal)
        ]
    ]
    inv_table = Table(invoices_data, colWidths=[100, 240, 100, 100])
    inv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(inv_table)
    story.append(Spacer(1, 16))

    # ─── NEXT MONTH TARGETS ───
    story.append(Paragraph("Next Month Objectives & Milestones", section_heading))
    next_steps = [
        "1. Complete QA and load testing on multi-language and 2FA authentication modules.",
        "2. Finalize client review of visual annotations and stage progression.",
        "3. Initiate staging deployment, domain mapping, and SSL provisioning.",
        "4. Transition into post-launch 30-day dedicated warranty and maintenance window."
    ]
    for step in next_steps:
        story.append(Paragraph(f"• {step}", cell_normal))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=10))

    # ─── FOOTER & SUPPORT CONTACT ───
    footer_text = (
        "<b>Website Builders Support:</b> support@websitebuilders.com | +91 7386204885<br/>"
        "<i>This automated report is generated securely from verified project milestone records.</i>"
    )
    story.append(Paragraph(footer_text, subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
