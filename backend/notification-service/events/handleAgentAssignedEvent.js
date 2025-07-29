import emailService from '../services/emailService.js';
import fs from 'fs/promises';

function fillTemplate(template, variables) {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => variables[key] ?? '');
}

const handleAgentAssignedEvent = async (data) => {
  try {
    console.log('Agent assigned event received:', data);

    // 1. Kullanıcıya mail gönder
    if (data.user && data.user.email && data.user_template_content) {
      let userHtml = '';
      try {
        userHtml = fillTemplate(data.user_template_content, {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          ticketTitle: data.ticket.title,
          ticketId: data.ticket.id,
          agentName: `${data.agent.firstName} ${data.agent.lastName}`
        });
      } catch (e) {
        console.warn(`User template processing failed: ${e}, using fallback`);
        userHtml = `<p>Destek talebinize müşteri temsilcisi atanmıştır.</p>`;
      }
      
      // Dil tercihini kontrol et ve varsayılan değer belirle
      const userLocale = data.user.languagePreference || data.user.locale || 'tr';
      const isTurkish = userLocale === 'tr';
      
      await emailService.send({
        to: data.user.email,
        subject: isTurkish ? 'Müşteri Temsilciniz Atandı' : 'Your Customer Representative Has Been Assigned',
        html: userHtml
      });
      console.log(`Agent assigned email sent to user: ${data.user.email} (${userLocale})`);
    }

    // 2. Agent'a mail gönder
    if (data.agent && data.agent.email && data.agent_template_content) {
      let agentHtml = '';
      try {
        agentHtml = fillTemplate(data.agent_template_content, {
          firstName: data.agent.firstName,
          lastName: data.agent.lastName,
          ticketTitle: data.ticket.title,
          ticketId: data.ticket.id,
          customerName: `${data.user.firstName} ${data.user.lastName}`,
          customerEmail: data.user.email
        });
      } catch (e) {
        console.warn(`Agent template processing failed: ${e}, using fallback`);
        agentHtml = `<p>Yeni bir destek talebi size atandı.</p>`;
      }
      
      // Dil tercihini kontrol et ve varsayılan değer belirle
      const agentLocale = data.agent.languagePreference || data.agent.locale || 'tr';
      const isTurkish = agentLocale === 'tr';
      
      console.log(`Agent language preference: ${agentLocale}, isTurkish: ${isTurkish}`);
      console.log(`Agent template content length: ${data.agent_template_content.length}`);
      
      await emailService.send({
        to: data.agent.email,
        subject: isTurkish ? 'Yeni Destek Talebi Size Atandı' : 'A New Support Ticket Has Been Assigned to You',
        html: agentHtml
      });
      console.log(`Agent assigned email sent to agent: ${data.agent.email} (${agentLocale})`);
    }

  } catch (error) {
    console.error('Error handling agent assigned event:', error);
  }
};

export default handleAgentAssignedEvent; 