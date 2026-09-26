const nodemailer = require('nodemailer');
const { GMAIL_USER, GMAIL_APP_PASSWORD, MAIL_FROM, OTP_TTL_SECONDS } = require('../config/constants');

const isMailerConfigured = Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);

let transporter = null;
if (isMailerConfigured) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
}

function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

async function sendOtpEmail({ to, code }) {
  if (!transporter) {
    throw new Error('Mailer is not configured');
  }

  const minutes = Math.round(OTP_TTL_SECONDS / 60);
  await transporter.sendMail({
    from: MAIL_FROM || GMAIL_USER,
    to,
    subject: 'Your Ride verification code',
    text: `Your verification code is ${code}. It expires in ${minutes} minutes.`,
    html: `<p>Your verification code is <strong style="font-size:20px;letter-spacing:2px;">${code}</strong>.</p><p>It expires in ${minutes} minutes.</p>`,
  });
}

module.exports = { sendOtpEmail, isMailerConfigured, maskEmail };
