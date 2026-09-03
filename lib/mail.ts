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
  time?: string
  canadaTime?: string
  timezone?: string
  meetingLink?: string
  className?: string
  cohortName?: string
  feedback?: string
  score?: number
  maxScore?: number
  code?: string
  email?: string
  resetToken?: string
  portal?: string
  week?: number
  session?: string
}

interface MailOptions {
  to: string | string[]
  subject: string
  type: 'welcome' | 'newsletter' | 'notification' | 'class_schedule' | 'reminder' | 'payment' | 'marketing' | 'waitlist' | 'cohort_assignment' | 'admin_invite' | 'password_reset' | 'child_welcome' | 'educator_invite' | 'class_scheduled'
  data: MailData
  body?: string
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

  // Determine email category for proper classification
  const getCategory = () => {
    switch (type) {
      case 'payment':
      case 'admin_invite':
      case 'educator_invite':
      case 'password_reset':
        return 'important'
      case 'marketing':
      case 'newsletter':
        return 'promotions'
      case 'welcome':
      case 'child_welcome':
      case 'cohort_assignment':
        return 'updates'
      default:
        return 'primary'
    }
  }

  try {
    await transporter.sendMail({
      from: `"Heritage Club" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      attachments,
      // Add headers for better deliverability
      headers: {
        'X-Priority': type === 'payment' || type === 'password_reset' ? '1' : '3',
        'X-MSMail-Priority': type === 'payment' || type === 'password_reset' ? 'High' : 'Normal',
        'X-Mailer': 'Heritage Club Mailer',
        'List-ID': 'Heritage Club <heritage-club.damzynextgen.app>',
        'Precedence': 'bulk',
        'X-Google-App': 'Heritage Club',
        // Gmail-specific headers
        'X-Google-Smtp-Source': process.env.GOOGLE_SMTP_SOURCE || '',
      },
      // Add priority and category options
      priority: type === 'payment' || type === 'password_reset' ? 'high' : 'normal',
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
          We will notify you at this email address the exact second we go live so you can secure your class slots and family dashboards before public release.<br><br>
          When we officially launch, you will be able to enroll and secure your spot directly at:<br>
          <a href="https://heritage.damzynextgen.app/" style="color: #2b6cb0; text-decoration: underline;">https://heritage.damzynextgen.app/</a>
        </p>
      `
      break

    case 'cohort_assignment':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px; font-family: 'Playfair Display', Georgia, serif;">You've been assigned to a Cohort! 🎉</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
          Hello ${data.name || 'Student'},<br><br>
          We are thrilled to let you know that you have been officially assigned to a learning cohort in Heritage Club!<br><br>
          ${formattedBody || ''}<br><br>
          Your cohort represents your core learning group. You will attend weekend live sessions and participate in community events with your peers in this cohort.<br><br>
          Log in to your student dashboard to meet your educator, view your upcoming class schedule, and start your cultural learning journey.
        </p>
        <a href="${websiteUrl}/login" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 24px;">
          Go to Dashboard
        </a>
      `
      break

    case 'admin_invite':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px; font-family: 'Playfair Display', Georgia, serif;">You're Invited to Manage Heritage Club</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 26px; margin-bottom: 24px;">
          Hello,<br><br>
          You have been invited by a Super Admin to join the Heritage Club administrative team.<br><br>
          ${formattedBody || ''}<br><br>
          Please click the button below to accept your invitation and set up your admin account. You will need your invite code to complete the registration.
        </p>
        <a href="${websiteUrl}/admin/signup${data.code ? `?code=${data.code}&email=${encodeURIComponent(data.email || '')}` : ''}" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 24px;">
          Accept Invitation
        </a>
      `
      break

    case 'password_reset':
      const resetUrl = data.portal 
        ? `${websiteUrl}/staff/reset-password?portal=${data.portal}&email=${encodeURIComponent(data.email || '')}&token=${data.resetToken}`
        : `${websiteUrl}/reset-password?email=${encodeURIComponent(data.email || '')}&token=${data.resetToken}`
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 16px; font-family: 'Playfair Display', Georgia, serif;">Reset Your Password</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          Hello ${data.name || 'there'},<br><br>
          We received a request to reset your password for your Heritage Club account. If you didn't make this request, you can safely ignore this email.<br><br>
          To reset your password, click the button below. This link will expire in 1 hour for your security.
        </p>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center" style="border-radius: 8px; background-color: #2b6cb0;">
              <a href="${resetUrl}" target="_blank" style="font-size: 16px; font-family: sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; padding: 14px 32px; border: 1px solid #2b6cb0; border-radius: 8px; display: inline-block;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        <p style="color: #718096; font-size: 14px; line-height: 20px; margin-bottom: 16px;">
          If the button doesn't work, you can copy and paste this link into your browser:
        </p>
        <p style="color: #718096; font-size: 13px; line-height: 18px; word-break: break-all; background-color: #f7fafc; padding: 12px; border-radius: 4px; border: 1px solid #e2e8f0;">
          <a href="${resetUrl}" style="color: #2b6cb0; text-decoration: none;">${resetUrl}</a>
        </p>
        <p style="color: #718096; font-size: 13px; line-height: 20px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          For security reasons, this link will expire in 1 hour. After that, you'll need to request a new password reset.
        </p>
      `
      break

    case 'child_welcome':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Welcome to Heritage Club! 🎉</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          Hello ${data.name || 'there'},<br><br>
          Your parent has added you to Heritage Club! We are excited to have you join our cultural learning community. Your account has been successfully created and you're ready to start your learning journey.
        </p>
        <div style="background-color: #f7fafc; border-left: 4px solid #2b6cb0; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Your Login:</strong> ${data.email || 'your email'}</p>
          <p style="margin: 0; color: #2d3748;"><strong>Password:</strong> The password your parent set for you</p>
        </div>
        <a href="${websiteUrl}/login" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 24px;">
          Log In to Your Student Dashboard
        </a>
        <p style="color: #718096; font-size: 14px; line-height: 20px;">
          Once you log in, you'll be able to see your classes, assignments, quizzes, and track your progress through our gamified learning system. If you need help logging in, ask your parent or contact our support team at <a href="mailto:support@damzynextgen.app" style="color: #2b6cb0;">support@damzynextgen.app</a>.
        </p>
      `
      break

    case 'class_scheduled':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">New Class Scheduled! 📚</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          Hello ${data.name || 'there'},<br><br>
          A new live class has been scheduled for your cohort. Mark your calendar and join us for an engaging learning session!
        </p>
        <div style="background-color: #f7fafc; border-left: 4px solid #2b6cb0; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Class Title:</strong> ${data.classTitle || 'Live Class Session'}</p>
          <p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Date:</strong> ${data.date || 'TBD'}</p>
          <p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Time (Nigeria):</strong> ${data.time || 'TBD'}</p>
          ${data.canadaTime ? `<p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Time (Canada):</strong> ${data.canadaTime}</p>` : ''}
          <p style="margin: 0 0 8px 0; color: #2d3748;"><strong>Session:</strong> ${data.session || 'N/A'}</p>
          <p style="margin: 0; color: #2d3748;"><strong>Week:</strong> ${data.week || 'N/A'}</p>
        </div>
        ${data.meetingLink ? `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center" style="border-radius: 8px; background-color: #2b6cb0;">
              <a href="${data.meetingLink}" target="_blank" style="font-size: 16px; font-family: sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; padding: 14px 32px; border: 1px solid #2b6cb0; border-radius: 8px; display: inline-block;">
                Join Live Class (Zoom/Meet)
              </a>
            </td>
          </tr>
        </table>
        ` : ''}
        <p style="color: #718096; font-size: 14px; line-height: 20px;">
          Make sure to join a few minutes early to test your connection. The time shown above will be automatically converted to your local timezone when you view the class in your dashboard. If you have any issues, contact your educator or support at <a href="mailto:support@damzynextgen.app" style="color: #2b6cb0;">support@damzynextgen.app</a>.
        </p>
      `
      break

    case 'educator_invite':
      contentHtml = `
        <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 16px; font-family: 'Playfair Display', Georgia, serif;">You're Invited to Teach at Heritage Club! 🎓</h1>
        <p style="color: #4a4a4a; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
          Hello ${data.name || 'there'},<br><br>
          ${data.invitedBy ? `<strong>${data.invitedBy}</strong> has` : 'We have'} invited you to join Heritage Club as an Educator. We're building a modern learning community to help young people connect with their culture, and we'd love your expertise in making this happen.
        </p>
        
        <div style="background-color: #f7fafc; border-left: 4px solid #2b6cb0; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
          <h2 style="color: #2d3748; font-size: 18px; margin: 0 0 12px 0;">About Heritage Club</h2>
          <p style="color: #4a5568; font-size: 14px; line-height: 20px; margin: 0 0 12px 0;">
            Heritage Club is a cultural learning platform helping students aged 8-16 connect with their heritage through:
          </p>
          <ul style="color: #4a5568; font-size: 14px; line-height: 20px; margin: 0 0 12px 0; padding-left: 20px;">
            <li>Live weekend classes (Saturday & Sunday)</li>
            <li>Interactive curriculum across 4 pillars: Identity, Language, History, and Community</li>
            <li>Gamified learning with XP, streaks, and leaderboards</li>
            <li>Engaging quizzes, assignments, and projects</li>
          </ul>
        </div>

        <div style="background-color: #ebf8ff; border: 2px solid #2b6cb0; padding: 20px; margin-bottom: 24px; border-radius: 8px; text-align: center;">
          <p style="color: #2d3748; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Your Invite Code</p>
          <p style="color: #2b6cb0; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 0;">${data.code}</p>
          <p style="color: #718096; font-size: 12px; margin: 12px 0 0 0;">This code expires in 7 days</p>
        </div>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center" style="border-radius: 8px; background-color: #2b6cb0;">
              <a href="${websiteUrl}/educator/signup?code=${data.code}&email=${encodeURIComponent(data.email)}" target="_blank" style="font-size: 16px; font-family: sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; padding: 14px 32px; border: 1px solid #2b6cb0; border-radius: 8px; display: inline-block;">
                Create Your Educator Account
              </a>
            </td>
          </tr>
        </table>

        <div style="background-color: #fffaf0; border-left: 4px solid #ed8936; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <h3 style="color: #2d3748; font-size: 16px; margin: 0 0 8px 0;">What You'll Do as an Educator:</h3>
          <ul style="color: #4a5568; font-size: 14px; line-height: 20px; margin: 0; padding-left: 20px;">
            <li>Create and schedule live class sessions</li>
            <li>Add Zoom/Google Meet links for classes</li>
            <li>Mark student attendance and award XP</li>
            <li>Create and grade quizzes and assignments</li>
            <li>Track student progress and engagement</li>
            <li>Access educator analytics and insights</li>
          </ul>
        </div>

        <p style="color: #718096; font-size: 14px; line-height: 20px; margin-bottom: 16px;">
          If you have any questions about the role or need assistance with signup, please don't hesitate to reach out to us at <a href="mailto:support@damzynextgen.app" style="color: #2b6cb0;">support@damzynextgen.app</a>.
        </p>
        <p style="color: #718096; font-size: 13px; line-height: 18px; margin-bottom: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          This invitation was sent to ${data.email}. If you didn't expect this invitation, you can safely ignore this email.
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
