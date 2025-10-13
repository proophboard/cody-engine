import nodemailer from 'nodemailer';
import { env } from '@server/environments/environment.current';

export interface MailData {
  from: string;
  to: string;
  subject: string;
  name: string;
  message: string;
}

export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      requireTLS: env.smtp.starttls,
      auth: {
        user: env.smtp.auth.user,
        pass: env.smtp.auth.pass,
      }
    });
  }

  async sendContactFormMail(data: MailData): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: env.smtp.sender,
        to: env.smtp.recipient,
        replyTo: data.from,
        subject: data.subject,
        text: data.message,
      });
      return true;
    } catch (error) {
      console.error('Mail sending failed:', error);
      return false;
    }
  }
}
