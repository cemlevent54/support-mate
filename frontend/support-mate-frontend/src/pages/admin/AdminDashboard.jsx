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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = ({ 
  title = 'Dashboard',
  subtitle = 'Sistem Metrikleri',
  showTitle = true,
  className = '',
  onTimeRangeChange,
  onDataUpdate
}) => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  
  const [timeRange, setTimeRange] = useState('weekly');
  const [dashboardData, setDashboardData] = useState({
    users: {
      total: 0,
      roles: [],
      blockedUsers: 0,
      verifiedUsers: 0
    },
    onlineAgents: 0,
    ticketStats: {
      categories: [],
      tickets: {
        status: {},
        resolveTimes: {},
        dates: []
      },
      tasks: {
        status: {},
        priority: {}
      },
      products: [],
      chats: {
        chatCount: 0,
        messageCount: 0,
        dates: []
      }
    }
  });
  const [loading, setLoading] = useState(true);
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
          // API verilerini birleştir
          const authData = authResponse.data;
          const ticketData = ticketResponse.data;
          
          // Ticket verilerini grafik formatına çevir
          const ticketStats = {
            categories: ticketData.categories || [],
            tickets: ticketData.tickets || {
              status: {},
              resolveTimes: {},
              dates: []
            },
            tasks: ticketData.tasks || {
              status: {},
              priority: {},
              leader: [],
              employee: []
            },
            products: ticketData.products || [],
            chats: ticketData.chats || {
              chatCount: 0,
              messageCount: 0,
              dates: []
            }
          };
          
          const combinedData = {
            users: authData.users || {
              total: 0,
              roles: [],
              blockedUsers: 0,
              verifiedUsers: 0,
              date: []
            },
            onlineAgents: authData.onlineAgents || 0,
            ticketStats: ticketStats
          };
          setDashboardData(combinedData);
        } else {
          setError(t('adminDashboard.dataError'));
        }
      } catch (err) {
        setError(t('adminDashboard.apiError'));
        console.error('Dashboard veri çekme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]);

  const handleTimeRangeChange = (event, newTimeRange) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
      if (onTimeRangeChange) {
        onTimeRangeChange(newTimeRange);
      }
    }
  };

  const getTotalUsers = () => {
    return dashboardData.users?.total || 0;
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

  // Kullanıcı istatistikleri için bar chart verisi
  const userStatsData = [
    { name: t('adminDashboard.totalUsers'), value: dashboardData.users?.total || 0, color: '#2196F3' },
    { name: t('adminDashboard.verifiedUsers'), value: dashboardData.users?.verifiedUsers || 0, color: '#4CAF50' },
    { name: t('adminDashboard.blockedUsers'), value: dashboardData.users?.blockedUsers || 0, color: '#F44336' },
    { name: t('adminDashboard.notVerified'), value: (dashboardData.users?.total || 0) - (dashboardData.users?.verifiedUsers || 0) - (dashboardData.users?.blockedUsers || 0), color: '#FF9800' }
  ].filter(item => item.value > 0); // 0 olan değerleri filtrele

  // Task status verilerini API'den al
  const taskStatusData = dashboardData.ticketStats?.tasks?.status ? 
    Object.entries(dashboardData.ticketStats.tasks.status).map(([key, value]) => ({
      name: key === 'PENDING' ? t('adminDashboard.pending') : 
            key === 'IN_PROGRESS' ? t('adminDashboard.inProgress') : 
            key === 'DONE' ? t('adminDashboard.done') : key,
      value: value,
      color: key === 'PENDING' ? '#FF9800' : 
             key === 'IN_PROGRESS' ? '#2196F3' : 
             key === 'DONE' ? '#4CAF50' : '#9E9E9E'
    })).filter(item => item.value > 0) : [];

  // Closed ticket verilerini API'den al
  const closedTicketData = dashboardData.ticketStats?.tickets?.resolveTimes ? 
    Object.entries(dashboardData.ticketStats.tickets.resolveTimes).map(([key, value]) => ({
      name: key === 'inaday' ? t('adminDashboard.resolutionInDay') :
            key === 'inaweek' ? t('adminDashboard.resolutionInWeek') :
            key === 'inamonth' ? t('adminDashboard.resolutionInMonth') :
            key === 'notresolved' ? t('adminDashboard.notResolved') : key,
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
        <div className="text-lg text-gray-600">{t('adminDashboard.loading')}</div>
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
            {dashboardData.users?.roles?.map((role) => (
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
            {dashboardData.onlineAgents || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            {t('adminDashboard.last24Hours')}
          </p>
        </div>

        {/* Doğrulanmış Kullanıcılar */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              {t('adminDashboard.verifiedUsers')}
            </h6>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <VerifiedUserIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {dashboardData.users?.verifiedUsers || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            {dashboardData.users?.total ? (
              i18n.language === 'tr' ? (
                `Toplam kullanıcıların %${Math.round((dashboardData.users.verifiedUsers / dashboardData.users.total) * 100)}'i`
              ) : (
                `Verified users make up ${Math.round((dashboardData.users.verifiedUsers / dashboardData.users.total) * 100)}% of all users`
              )
            ) : (
              i18n.language === 'tr' ? 'Toplam kullanıcı sayısı mevcut değil' : 'Total user count is not available'
            )}
          </p>
        </div>

        {/* Engellenmiş Kullanıcılar */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              {t('adminDashboard.blockedUsers')}
            </h6>
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <BlockIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {dashboardData.users?.blockedUsers || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            {dashboardData.users?.total ? (
              i18n.language === 'tr' ? (
                `Toplam kullanıcıların %${Math.round((dashboardData.users.blockedUsers / dashboardData.users.total) * 100)}'i`
              ) : (
                `Blocked users make up ${Math.round((dashboardData.users.blockedUsers / dashboardData.users.total) * 100)}% of all users`
              )
            ) : (
              i18n.language === 'tr' ? 'Toplam kullanıcı sayısı mevcut değil' : 'Total user count is not available'
            )}
          </p>
        </div>
      </div>

      {/* Ticket İstatistikleri Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Toplam Ticket Sayısı */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              {t('adminDashboard.totalTicket')}
            </h6>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <SupportIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {dashboardData.ticketStats?.tickets?.status ? 
              Object.values(dashboardData.ticketStats.tickets.status).reduce((sum, count) => sum + count, 0) : 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            {t('adminDashboard.allStatuses')}
          </p>
        </div>

        {/* Açık Ticket Sayısı */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              {t('adminDashboard.openTicket')}
            </h6>
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <WarningIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {dashboardData.ticketStats?.tickets?.status?.OPEN || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            {t('adminDashboard.pendingTasks')}
          </p>
        </div>

        {/* Toplam Task Sayısı */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              {t('adminDashboard.totalTask')}
            </h6>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <AssignmentIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {dashboardData.ticketStats?.tasks?.status ? 
              Object.values(dashboardData.ticketStats.tasks.status).reduce((sum, count) => sum + count, 0) : 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            {t('adminDashboard.allTasks')}
          </p>
        </div>

        {/* Toplam Ürün Sayısı */}
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-gray-600 font-medium">
              {t('adminDashboard.totalProduct')}
            </h6>
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <WorkIcon />
            </div>
          </div>
          
          <h4 className="text-3xl font-bold text-gray-800 mb-2">
            {dashboardData.ticketStats?.products?.length || 0}
          </h4>
          
          <p className="text-sm text-gray-500">
            {t('adminDashboard.systemProducts')}
          </p>
        </div>
      </div>

      {/* İkinci Satır - Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kullanıcı İstatistikleri Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              {t('adminDashboard.userStatistics')}
            </h6>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200">
              {t('adminDashboard.total')}: {getTotalUsers()}
            </span>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userStatsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, t('adminDashboard.userCount')]}
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
              {t('adminDashboard.taskStatuses')}
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
              {t('adminDashboard.ticketTrendLast7Days')}
            </h6>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200">
              {t('adminDashboard.total')}: {dashboardData.ticketStats?.tickets?.status ? 
                Object.values(dashboardData.ticketStats.tickets.status).reduce((sum, count) => sum + count, 0) : 0}
            </span>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.ticketStats?.tickets?.dates || []}>
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
                name={t('adminDashboard.totalTicket')}
                dot={{ fill: '#9C27B0', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#9C27B0', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="openTickets" 
                stroke="#FF9800" 
                strokeWidth={3}
                name={t('adminDashboard.openTicket')}
                dot={{ fill: '#FF9800', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#FF9800', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="inReviewTickets" 
                stroke="#2196F3" 
                strokeWidth={3}
                name={t('adminDashboard.inReview')}
                dot={{ fill: '#2196F3', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#2196F3', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="inProgressTickets" 
                stroke="#FFC107" 
                strokeWidth={3}
                name={t('adminDashboard.inProgress')}
                dot={{ fill: '#FFC107', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#FFC107', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="closedTickets" 
                stroke="#4CAF50" 
                strokeWidth={3}
                name={t('adminDashboard.closed')}
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
              {t('adminDashboard.resolutionTimes')}
            </h6>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <h4 className="text-3xl font-bold text-green-600">
                  {dashboardData.ticketStats?.tickets?.status?.CLOSED || 0}
                </h4>
                <p className="text-sm text-gray-500">
                  {t('adminDashboard.closedTicket')}
                </p>
              </div>
              
              <div className="text-center">
                <h4 className="text-3xl font-bold text-blue-600">
                  {totalClosedTickets}
                </h4>
                <p className="text-sm text-gray-500">
                  {t('adminDashboard.resolvedTicket')}
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
                formatter={(value, name) => [value, t('adminDashboard.ticketCount')]}
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
              {t('adminDashboard.ticketStatuses')}
            </h6>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <SupportIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.ticketStats?.tickets?.status ? 
                  Object.entries(dashboardData.ticketStats.tickets.status).map(([key, value]) => ({
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
                {dashboardData.ticketStats?.tickets?.status ? 
                  Object.entries(dashboardData.ticketStats.tickets.status).map(([key, value], index) => (
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
              {t('adminDashboard.taskPriorities')}
            </h6>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <AssignmentIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.ticketStats?.tasks?.priority ? 
              Object.entries(dashboardData.ticketStats.tasks.priority).map(([key, value]) => ({
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
                formatter={(value, name) => [value, t('adminDashboard.taskCount')]}
              />
              <Bar 
                dataKey="count" 
                fill="#4CAF50"
                radius={[4, 4, 0, 0]}
              >
                {dashboardData.ticketStats?.tasks?.priority ? 
                  Object.entries(dashboardData.ticketStats.tasks.priority).map(([key, value], index) => (
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

      {/* Yeni Satır - Kullanıcı Kayıt Trendi */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              {t('adminDashboard.userRegistrationTrend')}
            </h6>
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <PeopleIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.users?.date || []}>
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
                formatter={(value, name) => [value, t('adminDashboard.newUsers')]}
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
                dataKey="numberOfCreatedUsers" 
                stroke="#9C27B0" 
                strokeWidth={3}
                name={t('adminDashboard.newUsers')}
                dot={{ fill: '#9C27B0', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#9C27B0', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Yeni Satır - Leader ve Employee Task İstatistikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leader Task İstatistikleri */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              {t('adminDashboard.leaderTaskStatistics')}
            </h6>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <GroupIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.ticketStats?.tasks?.leader || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
              />
              <Legend />
              <Bar dataKey="assignTaskCount" fill="#2196F3" name={t('adminDashboard.assignTaskCount')} />
              <Bar dataKey="doneTaskCount" fill="#4CAF50" name={t('adminDashboard.doneTaskCount')} />
              <Bar dataKey="overDueTaskCount" fill="#F44336" name={t('adminDashboard.overDueTaskCount')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Task İstatistikleri */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              {t('adminDashboard.employeeTaskStatistics')}
            </h6>
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <WorkIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.ticketStats?.tasks?.employee || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
              />
              <Legend />
              <Bar dataKey="doneTaskCount" fill="#4CAF50" name={t('adminDashboard.doneTaskCount')} />
              <Bar dataKey="overDueTaskCount" fill="#F44336" name={t('adminDashboard.overDueTaskCount')} />
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
              {t('adminDashboard.categoryStatistics')}
            </h6>
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
              <GroupIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.ticketStats?.categories || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoryNameTr" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
              />
              <Legend />
              <Bar dataKey="numberOfRelatedTicket" fill="#2196F3" name={t('adminDashboard.ticketCount')} />
              <Bar dataKey="numberOfProduct" fill="#4CAF50" name={t('adminDashboard.productCount')} />
              <Bar dataKey="numberOfLeader" fill="#FF9800" name={t('adminDashboard.leaderCount')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chat İstatistikleri */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              {t('adminDashboard.chatStatistics')}
            </h6>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <SupportIcon />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-blue-600">
                {dashboardData.ticketStats?.chats?.chatCount || 0}
              </h4>
              <p className="text-sm text-gray-500">{t('adminDashboard.totalChat')}</p>
            </div>
            <div className="text-center">
              <h4 className="text-2xl font-bold text-green-600">
                {dashboardData.ticketStats?.chats?.messageCount || 0}
              </h4>
              <p className="text-sm text-gray-500">{t('adminDashboard.totalMessage')}</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboardData.ticketStats?.chats?.dates?.filter(date => date.messageCount > 0) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                formatter={(value, name) => [value, name]}
              />
              <Legend />
              <Bar dataKey="customerMessages" fill="#4CAF50" name={t('adminDashboard.customerMessages')} />
              <Bar dataKey="agentMessages" fill="#2196F3" name={t('adminDashboard.agentMessages')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Altıncı Satır - Message Trends Line Chart */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h6 className="text-lg font-semibold text-gray-800">
              {t('adminDashboard.messageTrendLast7Days')}
            </h6>
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
              <TrendingUpIcon />
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={dashboardData.ticketStats?.chats?.dates || []}>
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
                name={t('adminDashboard.totalMessage')}
                dot={{ fill: '#2196F3', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#2196F3', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="customerMessages" 
                stroke="#4CAF50" 
                strokeWidth={3}
                name={t('adminDashboard.customerMessages')}
                dot={{ fill: '#4CAF50', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#4CAF50', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="agentMessages" 
                stroke="#FF9800" 
                strokeWidth={3}
                name={t('adminDashboard.agentMessages')}
                dot={{ fill: '#FF9800', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#FF9800', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="chatCount" 
                stroke="#9C27B0" 
                strokeWidth={3}
                name={t('adminDashboard.chatCount')}
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