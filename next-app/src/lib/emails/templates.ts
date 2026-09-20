const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://website-builders-wine.vercel.app';

function baseTemplate(title: string, content: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #f8fafc; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
      .header { padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #334155; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); }
      .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .tagline { color: #94a3b8; font-size: 13px; margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
      .body { padding: 32px; font-size: 15px; line-height: 1.6; color: #cbd5e1; }
      .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff !important; text-decoration: none; font-weight: 600; border-radius: 8px; margin: 20px 0; text-align: center; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39); }
      .footer { padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      .footer a { color: #94a3b8; text-decoration: underline; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
      .highlight-box { background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header">
          <div class="logo">WEBSITE BUILDERS</div>
          <div class="tagline">Enterprise Web Engineering</div>
        </div>
        <div class="body">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Website Builders Co. All rights reserved.</p>
          <p>Questions? Reach our team at <a href="mailto:websitebuilders@gmail.com">websitebuilders@gmail.com</a></p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

export function templateEmailVerification(name: string, token: string): { subject: string; html: string } {
  const link = `${APP_URL}/api/auth/verify-email?token=${token}`;
  return {
    subject: 'Verify your Website Builders account',
    html: baseTemplate(
      'Verify Your Account',
      `
      <h2 style="color: #ffffff; margin-top: 0;">Welcome aboard, ${name}!</h2>
      <p>Thank you for registering with Website Builders. To activate your account and access your client portal, please verify your email address:</p>
      <div style="text-align: center;">
        <a href="${link}" class="btn">Verify My Email</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8;">This verification link will expire in 24 hours. If you did not sign up for an account, please ignore this email.</p>
      <div class="highlight-box">
        <span style="color: #64748b; font-size: 12px;">Direct link:</span><br>
        <span style="word-break: break-all; font-size: 12px; color: #38bdf8;">${link}</span>
      </div>
      `
    ),
  };
}

export function templatePasswordReset(name: string, token: string): { subject: string; html: string } {
  const link = `${APP_URL}/reset-password?token=${token}`;
  return {
    subject: 'Reset your Website Builders password',
    html: baseTemplate(
      'Reset Password',
      `
      <h2 style="color: #ffffff; margin-top: 0;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for your Website Builders portal account. Click the button below to choose a new password:</p>
      <div style="text-align: center;">
        <a href="${link}" class="btn">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8;">This link is valid for 1 hour. If you did not request a password reset, your account is safe and you can safely ignore this email.</p>
      <div class="highlight-box">
        <span style="color: #64748b; font-size: 12px;">Direct link:</span><br>
        <span style="word-break: break-all; font-size: 12px; color: #38bdf8;">${link}</span>
      </div>
      `
    ),
  };
}

export function templateStageChange(name: string, projectName: string, newStage: string, notes?: string): { subject: string; html: string } {
  const link = `${APP_URL}/user/projects`;
  return {
    subject: `Project Update: ${projectName} moved to ${newStage}`,
    html: baseTemplate(
      'Project Stage Update',
      `
      <h2 style="color: #ffffff; margin-top: 0;">Project Progress Update</h2>
      <p>Hello ${name},</p>
      <p>Great news! Your project <strong>${projectName}</strong> has progressed to the next development phase:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span class="badge" style="font-size: 16px; padding: 8px 20px;">Current Stage: ${newStage}</span>
      </div>
      ${notes ? `<div class="highlight-box"><strong>Engineering Notes:</strong><br>${notes}</div>` : ''}
      <div style="text-align: center;">
        <a href="${link}" class="btn">View Project Tracker</a>
      </div>
      `
    ),
  };
}

export function templateInvoiceCreated(name: string, invoiceId: string, amount: string | number, dueDate: string): { subject: string; html: string } {
  const link = `${APP_URL}/user/invoices`;
  return {
    subject: `New Invoice Issued: ${invoiceId} from Website Builders`,
    html: baseTemplate(
      'New Invoice',
      `
      <h2 style="color: #ffffff; margin-top: 0;">New Invoice Issued</h2>
      <p>Hello ${name},</p>
      <p>An invoice <strong>${invoiceId}</strong> has been generated for your account.</p>
      <div class="highlight-box">
        <p style="margin: 4px 0;"><strong>Invoice ID:</strong> ${invoiceId}</p>
        <p style="margin: 4px 0;"><strong>Total Amount:</strong> ₹${Number(amount).toLocaleString('en-IN')}</p>
        <p style="margin: 4px 0;"><strong>Due Date:</strong> ${dueDate}</p>
      </div>
      <div style="text-align: center;">
        <a href="${link}" class="btn">Pay Now via Razorpay</a>
      </div>
      `
    ),
  };
}

export function templatePaymentConfirmation(name: string, invoiceId: string, amount: string | number, paymentId: string): { subject: string; html: string } {
  const link = `${APP_URL}/user/invoices`;
  return {
    subject: `Payment Receipt: ${invoiceId} Confirmed`,
    html: baseTemplate(
      'Payment Received',
      `
      <h2 style="color: #ffffff; margin-top: 0;">Payment Received!</h2>
      <p>Hello ${name},</p>
      <p>Thank you! We have successfully received your payment for invoice <strong>${invoiceId}</strong>.</p>
      <div class="highlight-box">
        <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${Number(amount).toLocaleString('en-IN')}</p>
        <p style="margin: 4px 0;"><strong>Transaction ID:</strong> ${paymentId}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #10b981; font-weight: 600;">PAID</span></p>
      </div>
      <div style="text-align: center;">
        <a href="${link}" class="btn">Download Tax Invoice</a>
      </div>
      `
    ),
  };
}

export function templateNewFileUploaded(name: string, projectName: string, fileName: string, category: string): { subject: string; html: string } {
  const link = `${APP_URL}/user/projects`;
  return {
    subject: `New File Available: ${fileName} (${projectName})`,
    html: baseTemplate(
      'New File Uploaded',
      `
      <h2 style="color: #ffffff; margin-top: 0;">New File Shared</h2>
      <p>Hello ${name},</p>
      <p>A new ${category.toLowerCase()} has been uploaded for your project <strong>${projectName}</strong>:</p>
      <div class="highlight-box">
        <p style="margin: 4px 0;"><strong>File:</strong> ${fileName}</p>
        <p style="margin: 4px 0;"><strong>Category:</strong> ${category}</p>
      </div>
      <div style="text-align: center;">
        <a href="${link}" class="btn">View & Download Files</a>
      </div>
      `
    ),
  };
}

export function templateTicketCreated(name: string, ticketId: string, subject: string): { subject: string; html: string } {
  const link = `${APP_URL}/user/tickets`;
  return {
    subject: `Support Ticket Received: [${ticketId}] ${subject}`,
    html: baseTemplate(
      'Support Ticket Created',
      `
      <h2 style="color: #ffffff; margin-top: 0;">Ticket Created</h2>
      <p>Hello ${name},</p>
      <p>Your support ticket <strong>${ticketId}</strong> has been logged. Our engineering support team will review and respond shortly.</p>
      <div class="highlight-box">
        <p style="margin: 4px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
        <p style="margin: 4px 0;"><strong>Subject:</strong> ${subject}</p>
      </div>
      <div style="text-align: center;">
        <a href="${link}" class="btn">View Support Thread</a>
      </div>
      `
    ),
  };
}

export function templateTicketReply(name: string, ticketId: string, senderName: string, messagePreview: string): { subject: string; html: string } {
  const link = `${APP_URL}/user/tickets`;
  return {
    subject: `New Reply on Ticket: [${ticketId}]`,
    html: baseTemplate(
      'Ticket Reply',
      `
      <h2 style="color: #ffffff; margin-top: 0;">New Response on Ticket ${ticketId}</h2>
      <p>Hello ${name},</p>
      <p><strong>${senderName}</strong> has posted a new reply:</p>
      <div class="highlight-box">
        <p style="margin: 4px 0; font-style: italic;">"${messagePreview}"</p>
      </div>
      <div style="text-align: center;">
        <a href="${link}" class="btn">Reply to Ticket</a>
      </div>
      `
    ),
  };
}

export function templateContactAcknowledgment(name: string): { subject: string; html: string } {
  return {
    subject: 'We received your inquiry - Website Builders',
    html: baseTemplate(
      'Inquiry Received',
      `
      <h2 style="color: #ffffff; margin-top: 0;">Thank you for contacting us, ${name}!</h2>
      <p>We have received your project details and requirements. Our engineering consultants are reviewing your brief and will get back to you within 24 business hours with an architectural outline and estimate.</p>
      <p>In the meantime, feel free to explore our portfolio or reply directly to this email if you have additional assets or questions.</p>
      `
    ),
  };
}

export function templateLeadAdminAlert(lead: { name: string; email: string; phone?: string; service?: string; budget?: string; message?: string }): { subject: string; html: string } {
  const link = `${APP_URL}/admin/leads`;
  return {
    subject: `[New Lead Alert] ${lead.name} (${lead.service || 'Inquiry'})`,
    html: baseTemplate(
      'New Lead Received',
      `
      <h2 style="color: #ffffff; margin-top: 0;">New Inbound Lead!</h2>
      <div class="highlight-box">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${lead.name}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${lead.email}</p>
        <p style="margin: 4px 0;"><strong>Phone:</strong> ${lead.phone || 'N/A'}</p>
        <p style="margin: 4px 0;"><strong>Service:</strong> ${lead.service || 'General'}</p>
        <p style="margin: 4px 0;"><strong>Budget:</strong> ${lead.budget || 'Not specified'}</p>
        <p style="margin: 4px 0;"><strong>Message:</strong> ${lead.message || 'N/A'}</p>
      </div>
      <div style="text-align: center;">
        <a href="${link}" class="btn">Open CRM Pipeline</a>
      </div>
      `
    ),
  };
}
