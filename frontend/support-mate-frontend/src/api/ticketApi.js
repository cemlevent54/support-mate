import axiosInstance from './axiosInstance';

const BASE_URL = 'http://localhost:9000' + '/api/tickets';

// Ticket oluştur (FormData ile dosya yükleme desteği)
export const createTicket = async (ticketData) => {
  console.log(BASE_URL);
  const formData = new FormData();
  formData.append('title', ticketData.title);
  formData.append('description', ticketData.description);
  formData.append('category', ticketData.category);
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
