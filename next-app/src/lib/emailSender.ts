import nodemailer from 'nodemailer';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || pass.includes('mock')) {
    console.log(`[EMAIL DISPATCH - SIMULATED] To: ${to} | Subject: ${subject}`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: `"Website Builders" <${user}>`,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL DISPATCH - SENT] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL DISPATCH - ERROR] Failed to send email to ${to}:`, err);
    return false;
  }
}
