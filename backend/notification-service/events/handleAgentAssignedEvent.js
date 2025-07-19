import emailService from '../services/emailService.js';

const handleAgentAssignedEvent = async (data) => {
  try {
    console.log('Agent assigned event received:', data);
    
    const {
      email,
      firstName,
      language = 'tr',
      ticketId,
      ticketTitle,
      agentName,
      agentId,
      html
    } = data;

    if (!email) {
      console.error('Email address is required for agent assigned notification');
      return;
    }

    const subject = language === 'tr' 
      ? 'Müşteri Temsilciniz Atandı' 
      : 'Your Customer Representative Has Been Assigned';

    const emailContent = html || `
      <h2>${language === 'tr' ? 'Müşteri Temsilciniz Atandı' : 'Your Customer Representative Has Been Assigned'}</h2>
      <p>${language === 'tr' ? 'Sayın' : 'Dear'} ${firstName},</p>
      <p>${language === 'tr' ? 'Destek talebiniz için müşteri temsilciniz atanmıştır.' : 'A customer representative has been assigned to your support ticket.'}</p>
      <p><strong>${language === 'tr' ? 'Talep Numarası' : 'Ticket ID'}:</strong> ${ticketId}</p>
      <p><strong>${language === 'tr' ? 'Talep Başlığı' : 'Ticket Title'}:</strong> ${ticketTitle}</p>
      <p><strong>${language === 'tr' ? 'Müşteri Temsilcisi' : 'Customer Representative'}:</strong> ${agentName}</p>
    `;

    await emailService.send({
      to: email,
      subject: subject,
      html: emailContent
    });

    console.log(`Agent assigned email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error handling agent assigned event:', error);
  }
};

export default handleAgentAssignedEvent; 