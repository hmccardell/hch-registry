import nodemailer from 'nodemailer';
import { config } from './config.js';

// One transport, built lazily. With SMTP_URL set we send for real; without it
// (local dev) getTransport() returns null and sendLoginLink() prints the link
// to the console so you can click it from the terminal.
let transport;
function getTransport() {
  if (transport === undefined) {
    transport = config.smtpUrl ? nodemailer.createTransport(config.smtpUrl) : null;
  }
  return transport;
}

export async function sendLoginLink(email, url) {
  const minutes = Math.round(config.magicLinkTtlMs / 60000);
  const subject = 'Your Hub City Hackers Registry sign-in link';
  const text = [
    'Click to sign in to the Hub City Hackers Registry:',
    '',
    url,
    '',
    `This link works once and expires in ${minutes} minutes.`,
    "If you didn't ask to sign in, you can ignore this email.",
  ].join('\n');

  const t = getTransport();
  if (!t) {
    if (config.isProd) {
      throw new Error('SMTP_URL is not set — cannot send sign-in emails in production.');
    }
    console.log(`\n[mailer] dev mode — sign-in link for ${email}:\n${url}\n`);
    return;
  }
  await t.sendMail({ from: config.mailFrom, to: email, subject, text });
}
