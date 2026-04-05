import nodemailer from 'nodemailer';

const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

export async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(email, token) {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Подтвердите ваш email — Folio',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px;background:#0B0B0D;color:#f0f0f5;border-radius:16px;">
        <h1 style="font-size:24px;margin-bottom:16px;">Добро пожаловать на Folio</h1>
        <p style="color:#a0a0a5;margin-bottom:32px;">Нажмите на кнопку ниже, чтобы подтвердить email:</p>
        <a href="${url}" style="display:inline-block;padding:14px 32px;background:#c8ff00;color:#0B0B0D;border-radius:8px;text-decoration:none;font-weight:600;">Подтвердить email</a>
        <p style="color:#707075;margin-top:32px;font-size:12px;">Ссылка действительна 24 часа.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email, token) {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Сброс пароля — Folio',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px;background:#0B0B0D;color:#f0f0f5;border-radius:16px;">
        <h1 style="font-size:24px;margin-bottom:16px;">Сброс пароля</h1>
        <p style="color:#a0a0a5;margin-bottom:32px;">Нажмите на кнопку ниже для сброса пароля:</p>
        <a href="${url}" style="display:inline-block;padding:14px 32px;background:#c8ff00;color:#0B0B0D;border-radius:8px;text-decoration:none;font-weight:600;">Сбросить пароль</a>
        <p style="color:#707075;margin-top:32px;font-size:12px;">Ссылка действительна 1 час. Если вы не запрашивали сброс — проигнорируйте это письмо.</p>
      </div>
    `,
  });
}
