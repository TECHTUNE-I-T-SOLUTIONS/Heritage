import nodemailer from 'nodemailer'

interface MailData {
  name?: string
  title?: string
  body?: string
  linkText?: string
  linkUrl?: string
  amount?: string
  invoiceNumber?: string
  date?: string
  meetingLink?: string
  className?: string
  cohortName?: string
  feedback?: string
  score?: number
  maxScore?: number
}

interface MailOptions {
  to: string | string[]
  subject: string
  type: 'welcome' | 'newsletter' | 'notification' | 'class_schedule' | 'reminder' | 'payment' | 'marketing' | 'waitlist'
  data: MailData
  fromAlias?: 'support' | 'finance' | 'admin' | 'hello' | 'no-reply'
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>
}

const ZOHO_EMAILS = {
  admin: 'admin@damzynextgen.app',
  finance: 'finance@damzynextgen.app',
  'no-reply': 'no-reply@damzynextgen.app',
  support: 'support@damzynextgen.app',
  hello: 'hello@damzynextgen.app',
} as const

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.zoho.com'
  const port = Number(process.env.SMTP_PORT || '465')
  const secure = process.env.SMTP_SECURE !== 'false' // default true for 465
  const user = process.env.SMTP_USER || 'no-reply@damzynextgen.app'
  const pass = process.env.SMTP_PASS || ''

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

export async function sendEmail({ to, subject, type, data, fromAlias = 'no-reply', attachments }: MailOptions) {
  // If password is not configured yet, skip sending but log it
  if (!process.env.SMTP_PASS) {
    console.log(`[SMTP Mailer Simulated] To: ${to} | Subject: ${subject} | Type: ${type} | Attachments: ${attachments?.length || 0}`, data)
    return
  }

  const transporter = getTransporter()
  const fromEmail = ZOHO_EMAILS[fromAlias] || 'no-reply@damzynextgen.app'
  const html = getHtmlTemplate(type, data)

  try {
    await transporter.sendMail({
      from: `"Heritage Club" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      attachments,
    })
    console.log(`[SMTP Mailer Success] Sent to ${to} for type ${type}`)
  } catch (err) {
    console.error('[SMTP Mailer Error] Failed to send email:', err)
  }
}


function getHtmlTemplate(type: MailOptions['type'], data: MailData): string {
  const websiteUrl = 'https://heritage.damzynextgen.app'
  const logoUrl = 'https://heritage.damzynextgen.app/heritage.png'
  const formattedBody = data.body ? data.body.replace(/\n/g, '<br />') : ''

  let contentHtml = ''

  switch (type) {
    case 'welcome':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Welcome to Heritage Club! 🎉</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          Hello ${data.name || 'there'},<br><br>
          We are thrilled to welcome you to Heritage Club. Your account has been successfully created. We are dedicated to providing the absolute best cultural learning and educational experiences for you and your family.
        </p>
        ${data.linkUrl ? `
          <a href="${data.linkUrl}" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 24px;">
            ${data.linkText || 'Verify & Complete Setup'}
          </a>
        ` : ''}
        <p style="color: #718096; font-size: 14px; line-height: 20px;">
          If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:support@damzynextgen.app" style="color: #2b6cb0;">support@damzynextgen.app</a>.
        </p>
      `
      break

    case 'class_schedule':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">New Live Class Scheduled! 📅</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin-bottom: 16px;">
          Hello ${data.name || 'Learner'},<br><br>
          A new live class has been scheduled for your cohort: <strong>${data.cohortName || 'General'}</strong>.
        </p>
        <div style="background-color: #f7fafc; border-left: 4px solid #2b6cb0; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Class:</strong> ${data.className || 'Live Session'}</p>
          <p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Schedule:</strong> ${data.date || 'To be announced'}</p>
        </div>
        ${data.meetingLink ? `
          <p style="margin-bottom: 24px;">
            <a href="${data.meetingLink}" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">
              Join Live Class (Google Meet/Zoom)
            </a>
          </p>
        ` : ''}
      `
      break

    case 'payment':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Payment Invoice Update 💳</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin-bottom: 16px;">
          Hello ${data.name || 'Member'},<br><br>
          We want to notify you regarding your subscription payment transaction.
        </p>
        <div style="background-color: #f7fafc; border-left: 4px solid #48bb78; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Amount:</strong> ${data.amount || 'N/A'}</p>
          <p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Invoice:</strong> ${data.invoiceNumber || 'N/A'}</p>
          <p style="margin: 0; color: #2d3748;"><strong>Status:</strong> Successful</p>
        </div>
        <p style="color: #718096; font-size: 14px; line-height: 20px;">
          Billing queries? Email us at <a href="mailto:finance@damzynextgen.app" style="color: #2b6cb0;">finance@damzynextgen.app</a>.
        </p>
      `
      break

    case 'reminder':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Friendly Reminder 🔔</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          Hello ${data.name || 'Member'},<br><br>
          This is a friendly reminder from Heritage Club:<br><br>
          ${formattedBody || 'You have upcoming pending tasks or live class schedule.'}
        </p>
        ${data.linkUrl ? `
          <a href="${data.linkUrl}" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 24px;">
            ${data.linkText || 'View Dashboard'}
          </a>
        ` : ''}
      `
      break

    case 'newsletter':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Heritage Club News & Updates 📰</h1>
        <div style="color: #4a4a4a; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
          ${formattedBody || 'Stay tuned for cultural updates and learning news.'}
        </div>
      `
      break

    case 'marketing':
      contentHtml = `
        <div style="color: #2d3748; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
          ${formattedBody || ''}
        </div>
      `
      break

    case 'waitlist':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px; font-family: 'Playfair Display', Georgia, serif;">Welcome to the Waitlist! 🚀</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
          Hello ${data.name || 'there'},<br><br>
          Thank you for joining the exclusive pre-launch waitlist for Heritage Club. We are excited to have you with us as we count down to our official launch!<br><br>
          <strong>Here is what you can anticipate:</strong><br>
          • <strong>Live Interactive Classes:</strong> Engaging weekend small-group sessions with dedicated educators.<br>
          • <strong>Cultural Learning Journey:</strong> A premium, custom-designed curriculum celebrating heritage and history.<br>
          • <strong>Interactive Assignments & Quizzes:</strong> Fun challenges, homework tasks, and quizzes to cement learning.<br>
          • <strong>Gamified Progress:</strong> Earn XP, level up, and build streaks to track learning growth.<br><br>
          We will notify you at this email address the exact second we go live so you can secure your class slots and family dashboards before public release.
        </p>
      `
      break

    default: // notification
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">New Notification 🔔</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin-bottom: 16px;">
          Hello ${data.name || 'Member'},
        </p>
        <p style="color: #2d3748; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          ${formattedBody || 'You have received a new update on your dashboard.'}
        </p>
        ${data.feedback ? `
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 24px; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; color: #4a5568;"><strong>Grade:</strong> ${data.score} / ${data.maxScore}</p>
            <p style="margin: 0; color: #4a5568;"><strong>Feedback:</strong> ${data.feedback}</p>
          </div>
        ` : ''}
        ${data.linkUrl ? `
          <a href="${data.linkUrl}" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 24px;">
            ${data.linkText || 'View Details'}
          </a>
        ` : ''}
      `
      break
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Heritage Club</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; margin: 20px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a202c; padding: 24px; text-align: center;">
              <a href="${websiteUrl}" target="_blank">
                <img src="${logoUrl}" alt="Heritage Club Logo" style="height: 48px; border: 0; display: block; margin: 0 auto;">
              </a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 32px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <div style="margin-bottom: 16px;">
                <a href="${websiteUrl}/about" style="color: #718096; font-size: 14px; text-decoration: none; margin: 0 12px; font-weight: 500;">About Us</a>
                <a href="${websiteUrl}/contact" style="color: #718096; font-size: 14px; text-decoration: none; margin: 0 12px; font-weight: 500;">Contact</a>
                <a href="${websiteUrl}/privacy" style="color: #718096; font-size: 14px; text-decoration: none; margin: 0 12px; font-weight: 500;">Privacy</a>
              </div>
              <p style="color: #a0aec0; font-size: 12px; margin: 0 0 12px 0;">
                &copy; ${new Date().getFullYear()} Heritage Club. All rights reserved.
              </p>
              <div style="font-size: 11px; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 12px; line-height: 16px;">
                <strong>Contact Directory:</strong><br>
                Support: <a href="mailto:support@damzynextgen.app" style="color: #718096; text-decoration: none;">support@damzynextgen.app</a> | 
                General: <a href="mailto:hello@damzynextgen.app" style="color: #718096; text-decoration: none;">hello@damzynextgen.app</a> |
                Finance: <a href="mailto:finance@damzynextgen.app" style="color: #718096; text-decoration: none;">finance@damzynextgen.app</a>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}
