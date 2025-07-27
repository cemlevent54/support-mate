import emailService from '../services/emailService.js';
import fs from 'fs/promises';

function fillTemplate(template, variables) {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => variables[key] ?? '');
}

const handleAgentAssignedEvent = async (data) => {
  try {
    console.log('Agent assigned event received:', data);

    // 1. Kullanıcıya mail gönder
    if (data.user && data.user.email && data.user_template) {
      let userHtml = '';
      try {
        const templateStr = await fs.readFile(data.user_template, 'utf-8');
        userHtml = fillTemplate(templateStr, {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          ticketTitle: data.ticket.title,
          ticketId: data.ticket.id,
          agentName: `${data.agent.firstName} ${data.agent.lastName}`
        });
      } catch (e) {
        userHtml = `<p>Destek talebinize müşteri temsilcisi atanmıştır.</p>`;
      }
      // Accept-Language header'ından gelen dil bilgisini kullan
      const userLocale = data.user.locale;
      
      await emailService.send({
        to: data.user.email,
        subject: userLocale === 'tr' ? 'Müşteri Temsilciniz Atandı' : 'Your Customer Representative Has Been Assigned',
        html: userHtml
      });
      console.log(`Agent assigned email sent to user: ${data.user.email}`);
    }

    // 2. Agent'a mail gönder
    if (data.agent && data.agent.email && data.agent_template) {
      let agentHtml = '';
      try {
        const templateStr = await fs.readFile(data.agent_template, 'utf-8');
        agentHtml = fillTemplate(templateStr, {
          firstName: data.agent.firstName,
          lastName: data.agent.lastName,
          ticketTitle: data.ticket.title,
          ticketId: data.ticket.id,
          customerName: data.customerName,
          customerEmail: data.customerEmail
        });
      } catch (e) {
        agentHtml = `<p>Yeni bir destek talebi size atandı.</p>`;
      }
      // Accept-Language header'ından gelen dil bilgisini kullan
      const agentLocale = data.agent.locale;
      
      await emailService.send({
        to: data.agent.email,
        subject: agentLocale === 'tr' ? 'Yeni Destek Talebi Size Atandı' : 'A New Support Ticket Has Been Assigned to You',
        html: agentHtml
      });
      console.log(`Agent assigned email sent to agent: ${data.agent.email}`);
    }

  } catch (error) {
    console.error('Error handling agent assigned event:', error);
  }
};

export default handleAgentAssignedEvent; 