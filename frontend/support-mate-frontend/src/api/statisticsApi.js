import axiosInstance from './axiosInstance';

const BASE_AUTH_URL = "http://localhost:9000" + "/api/auth/reports";

const BASE_TICKET_URL = "http://localhost:9000" + "/api/tickets/reports";

const getLanguage = () => {
    const language = localStorage.getItem('language');
    return language || 'tr-TR';
}

export const getDashboardStatistics = async () => {
    const res = await axiosInstance.get(BASE_AUTH_URL + "/dashboard-statistics", {
        headers: {
            'Accept-Language': getLanguage()
        }
    });
    return res.data;
}

export const getTicketDashboardStatistics = async () => {
    const res = await axiosInstance.get(BASE_TICKET_URL + "/dashboard-statistics", {
        headers: {
            'Accept-Language': getLanguage()
        }
    });
    return res.data;
}

export const exportDashboardStatistics = async (data) => {
    const res = await axiosInstance.post(BASE_TICKET_URL + "/export-dashboard-statistics", data, {
        headers: {
            'Accept-Language': getLanguage()
        }
    });
    return res.data;
}