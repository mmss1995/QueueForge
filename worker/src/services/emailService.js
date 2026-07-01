import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail({ to, template, data }) {
  const transport = getTransporter();

  const subject = `Notification: ${template}`;
  const text = `Template: ${template}\nData: ${JSON.stringify(data, null, 2)}`;

  const info = await transport.sendMail({
    from: '"QueueForge" <no-reply@queueforge.dev>',
    to,
    subject,
    text,
  });

  return info;
}