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

  async sendMailWithAttachment({ to, subject, text, html, attachments }) {
    try {
      logger.info('[EMAIL-SERVICE] Starting sendMailWithAttachment...');
      logger.info('[EMAIL-SERVICE] Mail options:', {
        to,
        subject,
        hasText: !!text,
        hasHtml: !!html,
        htmlLength: html ? html.length : 0,
        attachmentsCount: attachments ? attachments.length : 0
      });

      if (attachments && attachments.length > 0) {
        logger.info('[EMAIL-SERVICE] Attachment details:', attachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.content ? att.content.length : 0
        })));
      }

      const mailOptions = {
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to,
        subject,
        text,
        html,
        attachments: attachments || []
      };

      logger.info('[EMAIL-SERVICE] Sending mail with transporter...');
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('[EMAIL-SERVICE] Mail sent successfully:', {
        messageId: result.messageId,
        response: result.response
      });
      return result;
    } catch (error) {
      logger.error('[EMAIL-SERVICE] Error sending mail:', error);
      logger.error('[EMAIL-SERVICE] Error details:', {
        message: error.message,
        code: error.code,
        command: error.command
      });
      throw error;
    }
  }
}

const emailService = new EmailService();
export default emailService;
