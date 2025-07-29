import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';

// Örnek kullanım bileşeni
const AdminDashboardExample = () => {
  const [dashboardData, setDashboardData] = useState({
    users: {
      Admin: 4,
      Leader: 12,
      Employee: 34,
      Supporter: 8,
    },
    activeAgents24h: 9,
    ticketTrend: [
      { date: '2025-01-23', count: 12 },
      { date: '2025-01-24', count: 15 },
      { date: '2025-01-25', count: 22 },
      { date: '2025-01-26', count: 19 },
      { date: '2025-01-27', count: 27 },
      { date: '2025-01-28', count: 31 },
      { date: '2025-01-29', count: 40 },
    ],
    tasksByStatus: [
      { name: 'Pending', value: 10, color: '#FF9800' },
      { name: 'In Progress', value: 25, color: '#2196F3' },
      { name: 'Done', value: 65, color: '#4CAF50' },
    ],
    closedTickets: {
      today: 5,
      weekly: [3, 7, 10, 5, 6, 12, 9],
      monthly: 96,
    },
    todayTickets: 11,
    totalTickets: 156,
  });

  const handleTimeRangeChange = (newTimeRange) => {
    console.log('Time range changed:', newTimeRange);
    // Burada API çağrısı yapılabilir
  };

  const handleDataUpdate = (newData) => {
    console.log('Data updated:', newData);
    setDashboardData(newData);
  };

  // Farklı veri setleri ile test etmek için
  const updateData = () => {
    setDashboardData({
      ...dashboardData,
      todayTickets: Math.floor(Math.random() * 50) + 10,
      activeAgents24h: Math.floor(Math.random() * 20) + 5,
    });
  };

  return (
    <div>
      {/* Temel kullanım */}
      <AdminDashboard 
        data={dashboardData}
        title="Admin Dashboard"
        subtitle="Sistem Metrikleri"
        onTimeRangeChange={handleTimeRangeChange}
        onDataUpdate={handleDataUpdate}
      />

      {/* Özel başlık olmadan */}
      <AdminDashboard 
        data={dashboardData}
        showTitle={false}
        className="mt-8"
      />

      {/* Farklı veri ile */}
      <button onClick={updateData} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Veriyi Güncelle
      </button>
    </div>
  );
};

export default AdminDashboardExample; 