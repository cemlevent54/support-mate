import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    logger.info('Email transporter created');
    logger.info('Email info', {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_SECURE === 'true',
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    });
  }
  

  async send({ to, subject, text, html }) {
    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to,
      subject,
      text,
      html,
    };
    return this.transporter.sendMail(mailOptions);
  }
}

const emailService = new EmailService();
export default emailService;
