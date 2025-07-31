import axiosInstance from './axiosInstance';

const getLang = () => localStorage.getItem("language") || "tr";

const BASE_URL = 'http://localhost:9000' + '/api/tickets';
const AUTH_BASE_URL = 'http://localhost:9000' + '/api/auth';


// Ticket oluştur (FormData ile dosya yükleme desteği)
export const createTicket = async (ticketData) => {
  console.log('createTicket çağrıldı, ticketData:', ticketData);
  console.log(BASE_URL);
  const formData = new FormData();
  
  // Zorunlu alanları her zaman ekle
  formData.append('title', ticketData.title || '');
  formData.append('description', ticketData.description || '');
  formData.append('categoryId', ticketData.categoryId || '');
  
  // Opsiyonel alanları her zaman ekle (boş string olarak)
  formData.append('productId', ticketData.productId || '');
  formData.append('customerId', ticketData.customerId || '');
  formData.append('chatId', ticketData.chatId || '');
  formData.append('assignedLeaderId', ticketData.assignedLeaderId || '');
  
  // Dosyaları ekle
  (ticketData.files || []).forEach(file => {
    formData.append('files', file);
  });

  // FormData içeriğini logla
  console.log('=== FORMDATA DEBUG ===');
  console.log('FormData entries:');
  for (let pair of formData.entries()) {
    console.log('FormData:', pair[0], '=', pair[1]);
  }
  
  // FormData'nın boş olup olmadığını kontrol et
  const formDataEntries = Array.from(formData.entries());
  console.log('FormData entries count:', formDataEntries.length);
  console.log('FormData has title:', formData.has('title'));
  console.log('FormData has description:', formData.has('description'));
  console.log('FormData has categoryId:', formData.has('categoryId'));
  
  // FormData değerlerini kontrol et
  console.log('FormData title value:', formData.get('title'));
  console.log('FormData description value:', formData.get('description'));
  console.log('FormData categoryId value:', formData.get('categoryId'));

  const response = await axiosInstance.post(BASE_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
      'accept-language': getLang(),
    },
  });
  return response.data;
};

// Ticket listesi
export const listTickets = async () => {
  const response = await axiosInstance.get(BASE_URL, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
};

// Ticket detay
export const getTicket = async (ticketId) => {
  const response = await axiosInstance.get(`${BASE_URL}/${ticketId}`, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
};

// Ticket güncelle
export const updateTicket = async (ticketId, updatedData) => {
  const response = await axiosInstance.put(`${BASE_URL}/${ticketId}`, updatedData, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
};

// Ticket sil (soft delete)
export const deleteTicket = async (ticketId) => {
  const response = await axiosInstance.delete(`${BASE_URL}/${ticketId}`, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
};

export const listTicketsForAdmin = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/admin/tickets`, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
}

export const listTicketsForUser = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/user/tickets`, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
}

export const listTicketsForAgent = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/agent/tickets`, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
}

export const getTicketForAdmin = async (ticketId) => {
  const response = await axiosInstance.get(`${BASE_URL}/admin/tickets/${ticketId}`, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
}

export const getTicketForUser = async (ticketId) => {
  const response = await axiosInstance.get(`${BASE_URL}/user/tickets/${ticketId}`, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
}

// Online customer supporter var mı?
export const checkOnlineSupporters = async () => {
  const response = await axiosInstance.get(AUTH_BASE_URL + '/online-users', {
    headers: {
      'accept-language': getLang(),
    },
  });
  // data array'i dönüyor, uzunluğunu döndür
  return Array.isArray(response.data?.data) && response.data.data.length > 0;
};

// Online customer supporter'ların ilk id'sini döndür
export const getFirstOnlineSupporterId = async () => {
  const response = await axiosInstance.get(AUTH_BASE_URL + '/online-users', {
    headers: {
      'accept-language': getLang(),
    },
  });
  if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
    return response.data.data[0].id || response.data.data[0]._id;
  }
  return null;
};

export const listTicketsForLeader = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/leader/tickets`, {
    headers: {
      'accept-language': getLang(),
    },
  });
  return response.data;
}

// Bu fonksiyon kaldırıldı - Leader'lar artık task oluşturarak ticket'ları alacak



