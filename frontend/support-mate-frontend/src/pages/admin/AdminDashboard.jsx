import React, { useState, useEffect } from 'react';
import {
  People as PeopleIcon,
  Support as SupportIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
  Block as BlockIcon,
  VerifiedUser as VerifiedUserIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { getDashboardStatistics, getTicketDashboardStatistics } from '../../api/statisticsApi';

// Default mock veriler
const defaultMockData = {
  users: {
    total: 12,
    roles: [
      { roleName: "User", numberOfUsers: 5 },
      { roleName: "Customer Supporter", numberOfUsers: 2 },
      { roleName: "Leader", numberOfUsers: 2 },
      { roleName: "Employee", numberOfUsers: 2 },
      { roleName: "Admin", numberOfUsers: 1 }
    ],
    blockedUsers: 1,
    verifiedUsers: 11
  },
  onlineAgents: 0,
  // Frontend'de oluşturulacak ek veriler
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
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = ({ 
  data = defaultMockData,
  title = 'Dashboard',
  subtitle = 'System Metrics',
  showTitle = true,
  className = '',
  onTimeRangeChange,
  onDataUpdate
}) => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('weekly');
  const [localData, setLocalData] = useState(data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API'den veri çekme
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Auth service'den kullanıcı verilerini çek
        const authResponse = await getDashboardStatistics();
        // Ticket service'den ticket verilerini çek
        const ticketResponse = await getTicketDashboardStatistics();
        
        if (authResponse.success && ticketResponse.success) {
          // API verilerini local data ile birleştir
          const authData = authResponse.data;
          const ticketData = ticketResponse.data;
          
          // Ticket verilerini grafik formatına çevir
          const ticketStats = {
            categories: ticketData.categories || [],
            tickets: ticketData.tickets || {},
            tasks: ticketData.tasks || {},
            products: ticketData.products || [],
            chats: ticketData.chats || {}
          };
          
          const combinedData = {
            ...localData,
            users: authData.users,
            onlineAgents: authData.onlineAgents,
            ticketStats: ticketStats
          };
          setLocalData(combinedData);
        } else {
          setError('Veri çekilemedi');
        }
      } catch (err) {
        setError('API bağlantı hatası');
        console.error('Dashboard veri çekme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Props'tan gelen data değiştiğinde local state'i güncelle
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleTimeRangeChange = (event, newTimeRange) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
      if (onTimeRangeChange) {
        onTimeRangeChange(newTimeRange);
      }
    }
  };

  const getTotalUsers = () => {
    return localData.users?.total || 0;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <AdminIcon />;
      case 'Leader':
        return <GroupIcon />;
      case 'Employee':
        return <WorkIcon />;
      case 'Customer Supporter':
        return <SupportIcon />;
      case 'User':
        return <PersonIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return '#f44336';
      case 'Leader':
        return '#2196f3';
      case 'Employee':
        return '#4caf50';
      case 'Customer Supporter':
        return '#ff9800';
      case 'User':
        return '#9c27b0';
      default:
        return '#9e9e9e';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
  };

  const weeklyData = localData.closedTickets.weekly.map((value, index) => ({
    day: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][index],
    closed: value,
  }));

  // Kullanıcı istatistikleri için bar chart verisi
  const userStatsData = [
    { name: 'Toplam Kullanıcı', value: localData.users?.total || 0, color: '#2196F3' },
    { name: 'Doğrulanmış', value: localData.users?.verifiedUsers || 0, color: '#4CAF50' },
    { name: 'Engellenmiş', value: localData.users?.blockedUsers || 0, color: '#F44336' },
    { name: 'Doğrulanmamış', value: (localData.users?.total || 0) - (localData.users?.verifiedUsers || 0) - (localData.users?.blockedUsers || 0), color: '#FF9800' }
  ].filter(item => item.value > 0); // 0 olan değerleri filtrele

  // Task status verilerini API'den al
  const taskStatusData = localData.ticketStats?.tasks?.status ? 
    Object.entries(localData.ticketStats.tasks.status).map(([key, value]) => ({
      name: key === 'PENDING' ? 'Bekleyen' : 
            key === 'IN_PROGRESS' ? 'Devam Eden' : 
            key === 'DONE' ? 'Tamamlanan' : key,
      value: value,
      color: key === 'PENDING' ? '#FF9800' : 
             key === 'IN_PROGRESS' ? '#2196F3' : 
             key === 'DONE' ? '#4CAF50' : '#9E9E9E'
    })).filter(item => item.value > 0) : [];

  // Closed ticket verilerini API'den al
  const closedTicketData = localData.ticketStats?.tickets?.resolveTimes ? 
    Object.entries(localData.ticketStats.tickets.resolveTimes).map(([key, value]) => ({
      name: key === 'inaday' ? '1 Gün İçinde' :
            key === 'inaweek' ? '1 Hafta İçinde' :
            key === 'inamonth' ? '1 Ay İçinde' :
            key === 'notresolved' ? 'Çözülmemiş' : key,
      value: value,
      color: key === 'inaday' ? '#4CAF50' :
             key === 'inaweek' ? '#2196F3' :
             key === 'inamonth' ? '#FF9800' :
             key === 'notresolved' ? '#F44336' : '#9E9E9E'
    })).filter(item => item.value > 0) : [];

  // Toplam closed ticket sayısı
  const totalClosedTickets = closedTicketData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Başlık */}
      {showTitle && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {title}
          </h1>
          <p className="text-gray-600">
            {subtitle}
          </p>
        </div>
      )}

      {/* İlk Satır - Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Toplam Kullanıcı Sayısı */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              {t('adminDashboard.totalUsers')}
            </h6>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <PeopleIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-4">
            {getTotalUsers()}
          </h4>

          {/* Rol dağılımı */}
          <div className="space-y-2">
            {localData.users?.roles?.map((role) => (
              <div key={role.roleName} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getRoleColor(role.roleName) }}
                  />
                  <span className="text-sm text-gray-600">
                    {role.roleName}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {role.numberOfUsers}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Aktif Müşteri Temsilcileri */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              {t('adminDashboard.activeAgents')}
            </h6>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <PersonIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {localData.onlineAgents || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            {t('adminDashboard.last24Hours')}
          </p>
        </div>

        {/* Doğrulanmış Kullanıcılar */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              Doğrulanmış Kullanıcılar
            </h6>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <VerifiedUserIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {localData.users?.verifiedUsers || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            Toplam kullanıcıların %{localData.users?.total ? Math.round((localData.users.verifiedUsers / localData.users.total) * 100) : 0}'i
          </p>
        </div>

        {/* Engellenmiş Kullanıcılar */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              Engellenmiş Kullanıcılar
            </h6>
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <BlockIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {localData.users?.blockedUsers || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            Toplam kullanıcıların %{localData.users?.total ? Math.round((localData.users.blockedUsers / localData.users.total) * 100) : 0}'i
          </p>
        </div>
      </div>

      {/* Ticket İstatistikleri Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Toplam Ticket Sayısı */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              Toplam Ticket
            </h6>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <SupportIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {localData.ticketStats?.tickets?.status ? 
              Object.values(localData.ticketStats.tickets.status).reduce((sum, count) => sum + count, 0) : 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            Tüm durumlar
          </p>
        </div>

        {/* Açık Ticket Sayısı */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              Açık Ticket
            </h6>
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <WarningIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {localData.ticketStats?.tickets?.status?.OPEN || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            Bekleyen işlemler
          </p>
        </div>

        {/* Toplam Task Sayısı */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              Toplam Task
            </h6>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <AssignmentIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {localData.ticketStats?.tasks?.status ? 
              Object.values(localData.ticketStats.tasks.status).reduce((sum, count) => sum + count, 0) : 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            Tüm görevler
          </p>
        </div>

        {/* Toplam Ürün Sayısı */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              Toplam Ürün
            </h6>
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <WorkIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {localData.ticketStats?.products?.length || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            Sistem ürünleri
          </p>
        </div>
      </div>

      {/* İkinci Satır - Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kullanıcı İstatistikleri Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              Kullanıcı İstatistikleri
            </h6>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200">
              Toplam: {getTotalUsers()}
            </span>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userStatsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, 'Kullanıcı Sayısı']}
              />
              <Bar 
                dataKey="value" 
                fill="#2196F3"
                radius={[4, 4, 0, 0]}
              >
                {userStatsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Pie Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              Task Durumları
            </h6>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <AssignmentIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Üçüncü Satır - Ticket Trend ve Kapanan Ticket Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trend Grafiği */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              Ticket Trend'i (Son 7 Gün)
            </h6>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200">
              Toplam: {localData.ticketStats?.tickets?.status ? 
                Object.values(localData.ticketStats.tickets.status).reduce((sum, count) => sum + count, 0) : 0}
            </span>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={localData.ticketStats?.tickets?.dates || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('tr-TR', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('tr-TR', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalTickets" 
                stroke="#9C27B0" 
                strokeWidth={3}
                name="Toplam Ticket"
                dot={{ fill: '#9C27B0', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#9C27B0', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="openTickets" 
                stroke="#FF9800" 
                strokeWidth={3}
                name="Açık Ticket"
                dot={{ fill: '#FF9800', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#FF9800', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="inReviewTickets" 
                stroke="#2196F3" 
                strokeWidth={3}
                name="İncelemede"
                dot={{ fill: '#2196F3', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#2196F3', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="inProgressTickets" 
                stroke="#FFC107" 
                strokeWidth={3}
                name="Devam Eden"
                dot={{ fill: '#FFC107', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#FFC107', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="closedTickets" 
                stroke="#4CAF50" 
                strokeWidth={3}
                name="Kapanan"
                dot={{ fill: '#4CAF50', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#4CAF50', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Kapanan Ticket Trend */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              Çözüm Süreleri
            </h6>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <h4 className="text-3xl font-bold text-green-600">
                  {localData.ticketStats?.tickets?.status?.CLOSED || 0}
                </h4>
                <p className="text-sm text-gray-500">
                  Kapanan Ticket
                </p>
              </div>
              
              <div className="text-center">
                <h4 className="text-3xl font-bold text-blue-600">
                  {totalClosedTickets}
                </h4>
                <p className="text-sm text-gray-500">
                  Çözülen Ticket
                </p>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={closedTicketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, 'Ticket Sayısı']}
              />
              <Bar 
                dataKey="value" 
                fill="#4CAF50"
                radius={[4, 4, 0, 0]}
              >
                {closedTicketData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dördüncü Satır - Ticket ve Task Grafikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Status Pie Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              Ticket Durumları
            </h6>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <SupportIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={localData.ticketStats?.tickets?.status ? 
                  Object.entries(localData.ticketStats.tickets.status).map(([key, value]) => ({
                    name: key,
                    value: value,
                    color: key === 'OPEN' ? '#FF9800' : 
                           key === 'IN_REVIEW' ? '#2196F3' : 
                           key === 'IN_PROGRESS' ? '#FFC107' : '#4CAF50'
                  })) : []
                }
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {localData.ticketStats?.tickets?.status ? 
                  Object.entries(localData.ticketStats.tickets.status).map(([key, value], index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={key === 'OPEN' ? '#FF9800' : 
                            key === 'IN_REVIEW' ? '#2196F3' : 
                            key === 'IN_PROGRESS' ? '#FFC107' : '#4CAF50'} 
                    />
                  )) : []
                }
              </Pie>
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Task Priority Bar Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              Task Öncelikleri
            </h6>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <AssignmentIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={localData.ticketStats?.tasks?.priority ? 
              Object.entries(localData.ticketStats.tasks.priority).map(([key, value]) => ({
                priority: key,
                count: value,
                color: key === 'LOW' ? '#4CAF50' : 
                       key === 'MEDIUM' ? '#FFC107' : 
                       key === 'HIGH' ? '#FF9800' : '#F44336'
              })) : []
            }>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, 'Task Sayısı']}
              />
              <Bar 
                dataKey="count" 
                fill="#4CAF50"
                radius={[4, 4, 0, 0]}
              >
                {localData.ticketStats?.tasks?.priority ? 
                  Object.entries(localData.ticketStats.tasks.priority).map(([key, value], index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={key === 'LOW' ? '#4CAF50' : 
                            key === 'MEDIUM' ? '#FFC107' : 
                            key === 'HIGH' ? '#FF9800' : '#F44336'} 
                    />
                  )) : []
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Beşinci Satır - Kategori ve Chat Trend Grafikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori İstatistikleri */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              Kategori İstatistikleri
            </h6>
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <GroupIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={localData.ticketStats?.categories || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoryNameTr" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
              />
              <Legend />
              <Bar dataKey="numberOfRelatedTicket" fill="#2196F3" name="Ticket Sayısı" />
              <Bar dataKey="numberOfProduct" fill="#4CAF50" name="Ürün Sayısı" />
              <Bar dataKey="numberOfLeader" fill="#FF9800" name="Leader Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chat İstatistikleri */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              Chat İstatistikleri
            </h6>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <SupportIcon />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-blue-600">
                {localData.ticketStats?.chats?.chatCount || 0}
              </h4>
              <p className="text-sm text-gray-500">Toplam Chat</p>
            </div>
            <div className="text-center">
              <h4 className="text-2xl font-bold text-green-600">
                {localData.ticketStats?.chats?.messageCount || 0}
              </h4>
              <p className="text-sm text-gray-500">Toplam Mesaj</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={localData.ticketStats?.chats?.dates?.filter(date => date.messageCount > 0) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
              />
              <Legend />
              <Bar dataKey="customerMessages" fill="#4CAF50" name="Müşteri Mesajları" />
              <Bar dataKey="agentMessages" fill="#2196F3" name="Agent Mesajları" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Altıncı Satır - Message Trends Line Chart */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              Mesaj Trend'i (Son 7 Gün)
            </h6>
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
              <TrendingUpIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={localData.ticketStats?.chats?.dates || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('tr-TR', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('tr-TR', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="messageCount" 
                stroke="#2196F3" 
                strokeWidth={3}
                name="Toplam Mesaj"
                dot={{ fill: '#2196F3', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#2196F3', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="customerMessages" 
                stroke="#4CAF50" 
                strokeWidth={3}
                name="Müşteri Mesajları"
                dot={{ fill: '#4CAF50', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#4CAF50', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="agentMessages" 
                stroke="#FF9800" 
                strokeWidth={3}
                name="Agent Mesajları"
                dot={{ fill: '#FF9800', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#FF9800', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="chatCount" 
                stroke="#9C27B0" 
                strokeWidth={3}
                name="Chat Sayısı"
                dot={{ fill: '#9C27B0', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#9C27B0', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 