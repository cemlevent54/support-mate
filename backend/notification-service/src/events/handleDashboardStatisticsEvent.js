import emailService from '../services/emailService.js';

const handleDashboardStatisticsEvent = async (event) => {
  try {
    console.log('Dashboard statistics event received:', event);

    const { email, language, fileName, fileType, exportData, html, fileBase64 } = event;
    let fileBuffer, mimeType;

    console.log('Processing file type:', fileType);

    // Dosya türüne göre MIME type belirle
    switch (fileType) {
      case 'json':
        mimeType = 'application/json';
        break;
      case 'csv':
        mimeType = 'text/csv';
        break;
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'excel':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      default:
        mimeType = 'application/octet-stream';
    }

    console.log('MIME type determined:', mimeType);

    // Base64'ten buffer'a çevir
    if (fileBase64) {
      console.log('Converting base64 to buffer...');
      fileBuffer = Buffer.from(fileBase64, 'base64');
      console.log('Buffer created, size:', fileBuffer.length);
    } else {
      console.warn('No fileBase64 found, using fallback JSON');
      // Fallback: JSON olarak gönder
      fileBuffer = Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');
      mimeType = 'application/json';
      console.log('Fallback buffer created, size:', fileBuffer.length);
    }

    const mailOptions = {
      to: email,
      subject: language === 'tr' ? 'Panel İstatistikleri Dışa Aktarımı' : 'Dashboard Statistics Export',
      html: html, // Event'ten gelen HTML template'ini kullan
      attachments: [{
        filename: fileName,
        content: fileBuffer,
        contentType: mimeType
      }]
    };

    console.log('Mail options prepared:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: mailOptions.html ? mailOptions.html.length : 0,
      attachmentFilename: mailOptions.attachments[0].filename,
      attachmentContentType: mailOptions.attachments[0].contentType,
      attachmentSize: mailOptions.attachments[0].content.length
    });

    console.log('Sending email...');
    const result = await emailService.sendMailWithAttachment(mailOptions);
    console.log('Email sent successfully:', result);
    
  } catch (error) {
    console.error('Error handling dashboard statistics event:', error);
    console.error('Error stack:', error.stack);
  }
};

export default handleDashboardStatisticsEvent;
