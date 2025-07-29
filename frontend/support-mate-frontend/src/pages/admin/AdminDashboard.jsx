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
import { getDashboardStatistics } from '../../api/statisticsApi';

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
        const response = await getDashboardStatistics();
        if (response.success) {
          // API verilerini local data ile birleştir
          const apiData = response.data;
          const combinedData = {
            ...localData,
            users: apiData.users,
            onlineAgents: apiData.onlineAgents
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
              {t('adminDashboard.taskStatus')}
            </h6>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <AssignmentIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={localData.tasksByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {localData.tasksByStatus.map((entry, index) => (
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
              {t('adminDashboard.ticketTrend')} ({t('adminDashboard.last7Days')})
            </h6>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200">
              Toplam: {localData.totalTickets}
            </span>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={localData.ticketTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value) => [value, 'Ticket Sayısı']}
                labelFormatter={formatDate}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#2196F3" 
                strokeWidth={3}
                dot={{ fill: '#2196F3', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#2196F3', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Kapanan Ticket Trend */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              {t('adminDashboard.closedTickets')}
            </h6>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <h4 className="text-3xl font-bold text-green-600">
                  {localData.closedTickets.today}
                </h4>
                <p className="text-sm text-gray-500">
                  {t('adminDashboard.today')}
                </p>
              </div>
              
              <div className="text-center">
                <h4 className="text-3xl font-bold text-blue-600">
                  {localData.closedTickets.monthly}
                </h4>
                <p className="text-sm text-gray-500">
                  {t('adminDashboard.thisMonth')}
                </p>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value) => [value, 'Kapanan Ticket']}
              />
              <Bar 
                dataKey="closed" 
                fill="#4CAF50"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 