// Optionaler Mailversand über Resend (https://resend.com/docs/api-reference/emails/send-email).
// Ohne RESEND_API_KEY/MAIL_FROM wird nichts verschickt – die Formulare funktionieren trotzdem.

export interface MailConfig {
  apiKey?: string;
  from?: string;
}

export function mailEnabled(config: MailConfig): config is Required<MailConfig> {
  return Boolean(config.apiKey && config.from);
}

export async function sendMail(config: MailConfig, mail: { to: string; subject: string; text: string; replyTo?: string }): Promise<boolean> {
  if (!mailEnabled(config)) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: config.from, to: [mail.to], subject: mail.subject, text: mail.text, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) }),
  });
  return res.ok;
}
