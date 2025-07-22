import axiosInstance from './axiosInstance';

const BASE_URL = 'http://localhost:9000' + '/api/tickets';

// Ticket oluştur (FormData ile dosya yükleme desteği)
export const createTicket = async (ticketData) => {
  console.log(BASE_URL);
  const formData = new FormData();
  formData.append('title', ticketData.title);
  formData.append('description', ticketData.description);
  formData.append('categoryId', ticketData.categoryId);
  (ticketData.files || []).forEach(file => {
    formData.append('files', file);
  });
  const response = await axiosInstance.post(BASE_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
    },
  });
  return response.data;
};

// Ticket listesi
export const listTickets = async () => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data;
};

// Ticket detay
export const getTicket = async (ticketId) => {
  const response = await axiosInstance.get(`${BASE_URL}/${ticketId}`);
  return response.data;
};

// Ticket güncelle
export const updateTicket = async (ticketId, updatedData) => {
  const response = await axiosInstance.put(`${BASE_URL}/${ticketId}`, updatedData);
  return response.data;
};

// Ticket sil (soft delete)
export const deleteTicket = async (ticketId) => {
  const response = await axiosInstance.delete(`${BASE_URL}/${ticketId}`);
  return response.data;
};

export const listTicketsForAdmin = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/admin/tickets`);
  return response.data;
}

export const listTicketsForUser = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/user/tickets`);
  return response.data;
}

export const listTicketsForAgent = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/agent/tickets`);
  return response.data;
}

export const getTicketForAdmin = async (ticketId) => {
  const response = await axiosInstance.get(`${BASE_URL}/admin/tickets/${ticketId}`);
  return response.data;
}

export const getTicketForUser = async (ticketId) => {
  const response = await axiosInstance.get(`${BASE_URL}/user/tickets/${ticketId}`);
  return response.data;
}

// Online customer supporter var mı?
export const checkOnlineSupporters = async () => {
  const response = await axiosInstance.get('http://localhost:9000/api/auth/online-users');
  // data array'i dönüyor, uzunluğunu döndür
  return Array.isArray(response.data?.data) && response.data.data.length > 0;
};

// Online customer supporter'ların ilk id'sini döndür
export const getFirstOnlineSupporterId = async () => {
  const response = await axiosInstance.get('http://localhost:9000/api/auth/online-users');
  if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
    return response.data.data[0].id || response.data.data[0]._id;
  }
  return null;
};



