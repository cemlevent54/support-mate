import axiosInstance from './axiosInstance';

const BASE_AUTH_URL = "http://localhost:9000" + "/api/auth/reports";

const BASE_TICKET_URL = "http://localhost:9000" + "/api/tickets/reports";

export const getDashboardStatistics = async () => {
    const res = await axiosInstance.get(BASE_AUTH_URL + "/dashboard-statistics");
    return res.data;
}

export const getTicketDashboardStatistics = async () => {
    const res = await axiosInstance.get(BASE_TICKET_URL + "/dashboard-statistics");
    return res.data;
}
