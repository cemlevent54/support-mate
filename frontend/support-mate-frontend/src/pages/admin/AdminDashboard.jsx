import React, { useState, useEffect } from 'react';
import {
  People as PeopleIcon,
  Support as SupportIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
  Block as BlockIcon,
  VerifiedUser as VerifiedUserIcon,
  Warning as WarningIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getDashboardStatistics, getTicketDashboardStatistics } from '../../api/statisticsApi';

// Dashboard Components
import DashboardCard from '../../components/dashboard/DashboardCard';
import UserStatisticsChart from '../../components/dashboard/UserStatisticsChart';
import TaskStatusChart from '../../components/dashboard/TaskStatusChart';
import TicketTrendChart from '../../components/dashboard/TicketTrendChart';
import ResolutionTimesChart from '../../components/dashboard/ResolutionTimesChart';
import TicketStatusPieChart from '../../components/dashboard/TicketStatusChart';
import TaskPriorityChart from '../../components/dashboard/TaskPriorityChart';
import UserRegistrationChart from '../../components/dashboard/UserRegistrationChart';
import LeaderTaskChart from '../../components/dashboard/LeaderTaskChart';
import EmployeeTaskChart from '../../components/dashboard/EmployeeTaskChart';
import CategoryStatisticsChart from '../../components/dashboard/CategoryStatisticsChart';
import ChatStatisticsChart from '../../components/dashboard/ChatStatisticsChart';
import MessageTrendChart from '../../components/dashboard/MessageTrendChart';
import ExportDashboardModal from '../../components/dashboard/ExportDashboardModal';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';


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
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleShowSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

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
              dates: [],
              numberOfNotAssignedAgentTickets: 0
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
    <div className={`p-2 space-y-6 ${className}`}>
      {/* Başlık ve Export Butonu */}
      {showTitle && (
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {title}
            </h1>
            <p className="text-gray-600">
              {subtitle}
            </p>
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
            onClick={() => setExportModalOpen(true)}
          >
            Export
          </button>
        </div>
      )}

      <ExportDashboardModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onSnackbar={handleShowSnackbar}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* İlk Satır - Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Toplam Kullanıcı Sayısı */}
        <DashboardCard
          title={t('adminDashboard.totalUsers')}
          value={getTotalUsers()}
          icon={PeopleIcon}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        >
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
        </DashboardCard>

        {/* Aktif Müşteri Temsilcileri */}
        <DashboardCard
          title={t('adminDashboard.activeAgents')}
          value={dashboardData.onlineAgents || 0}
          icon={PersonIcon}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          subtitle={t('adminDashboard.last24Hours')}
        />

        {/* Doğrulanmış Kullanıcılar */}
        <DashboardCard
          title={t('adminDashboard.verifiedUsers')}
          value={dashboardData.users?.verifiedUsers || 0}
          icon={VerifiedUserIcon}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          subtitle={
            dashboardData.users?.total ? (
              i18n.language === 'tr' ? (
                `Toplam kullanıcıların %${Math.round((dashboardData.users.verifiedUsers / dashboardData.users.total) * 100)}'i`
              ) : (
                `Verified users make up ${Math.round((dashboardData.users.verifiedUsers / dashboardData.users.total) * 100)}% of all users`
              )
            ) : (
              i18n.language === 'tr' ? 'Toplam kullanıcı sayısı mevcut değil' : 'Total user count is not available'
            )
          }
        />

        {/* Engellenmiş Kullanıcılar */}
        <DashboardCard
          title={t('adminDashboard.blockedUsers')}
          value={dashboardData.users?.blockedUsers || 0}
          icon={BlockIcon}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
          subtitle={
            dashboardData.users?.total ? (
              i18n.language === 'tr' ? (
                `Toplam kullanıcıların %${Math.round((dashboardData.users.blockedUsers / dashboardData.users.total) * 100)}'i`
              ) : (
                `Blocked users make up ${Math.round((dashboardData.users.blockedUsers / dashboardData.users.total) * 100)}% of all users`
              )
            ) : (
              i18n.language === 'tr' ? 'Toplam kullanıcı sayısı mevcut değil' : 'Total user count is not available'
            )
          }
        />
      </div>

      {/* Ticket İstatistikleri Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        {/* Toplam Ticket Sayısı */}
        <DashboardCard
          title={t('adminDashboard.totalTicket')}
          value={dashboardData.ticketStats?.tickets?.status ? 
            Object.values(dashboardData.ticketStats.tickets.status).reduce((sum, count) => sum + count, 0) : 0}
          icon={SupportIcon}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          subtitle={t('adminDashboard.allStatuses')}
        />

        {/* Açık Ticket Sayısı */}
        <DashboardCard
          title={t('adminDashboard.openTicket')}
          value={dashboardData.ticketStats?.tickets?.status?.OPEN || 0}
          icon={WarningIcon}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
          subtitle={t('adminDashboard.pendingTasks')}
        />

        {/* Atanmamış Ticket Sayısı */}
        <DashboardCard
          title={t('adminDashboard.unassignedTicket')}
          value={dashboardData.ticketStats?.tickets?.numberOfNotAssignedAgentTickets || 0}
          icon={PersonOffIcon}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
          subtitle={t('adminDashboard.noAgentAssigned')}
        />

        {/* Toplam Task Sayısı */}
        <DashboardCard
          title={t('adminDashboard.totalTask')}
          value={dashboardData.ticketStats?.tasks?.status ? 
            Object.values(dashboardData.ticketStats.tasks.status).reduce((sum, count) => sum + count, 0) : 0}
          icon={AssignmentIcon}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          subtitle={t('adminDashboard.allTasks')}
        />

        {/* Toplam Ürün Sayısı */}
        <DashboardCard
          title={t('adminDashboard.totalProduct')}
          value={dashboardData.ticketStats?.products?.length || 0}
          icon={WorkIcon}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          subtitle={t('adminDashboard.systemProducts')}
        />
      </div>

      {/* İkinci Satır - Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kullanıcı İstatistikleri Bar Chart */}
        <UserStatisticsChart 
          userStatsData={userStatsData}
          totalUsers={getTotalUsers()}
        />

        {/* Task Status Pie Chart */}
        <TaskStatusChart taskStatusData={taskStatusData} />
      </div>

      {/* Üçüncü Satır - Ticket Trend ve Kapanan Ticket Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trend Grafiği */}
        <TicketTrendChart 
          ticketData={dashboardData.ticketStats?.tickets?.dates || []}
          totalTickets={dashboardData.ticketStats?.tickets?.status ? 
            Object.values(dashboardData.ticketStats.tickets.status).reduce((sum, count) => sum + count, 0) : 0}
        />

        {/* Kapanan Ticket Trend */}
        <ResolutionTimesChart 
          closedTicketData={closedTicketData}
          closedTickets={dashboardData.ticketStats?.tickets?.status?.CLOSED || 0}
          totalResolvedTickets={totalClosedTickets}
        />
      </div>

      {/* Dördüncü Satır - Ticket ve Task Grafikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Status Pie Chart */}
        <TicketStatusPieChart 
          ticketStatusData={dashboardData.ticketStats?.tickets?.status ? 
            Object.entries(dashboardData.ticketStats.tickets.status).map(([key, value]) => ({
              name: key,
              value: value,
              color: key === 'OPEN' ? '#FF9800' : 
                     key === 'IN_REVIEW' ? '#2196F3' : 
                     key === 'IN_PROGRESS' ? '#FFC107' : '#4CAF50'
            })) : []
          }
        />

        {/* Task Priority Bar Chart */}
        <TaskPriorityChart 
          taskPriorityData={dashboardData.ticketStats?.tasks?.priority ? 
            Object.entries(dashboardData.ticketStats.tasks.priority).map(([key, value]) => ({
              priority: key,
              count: value,
              color: key === 'LOW' ? '#4CAF50' : 
                     key === 'MEDIUM' ? '#FFC107' : 
                     key === 'HIGH' ? '#FF9800' : '#F44336'
            })) : []
          }
        />
      </div>

      {/* Yeni Satır - Kullanıcı Kayıt Trendi */}
      <div className="grid grid-cols-1 gap-6">
        <UserRegistrationChart 
          userRegistrationData={dashboardData.users?.date || []}
        />
      </div>

      {/* Yeni Satır - Leader ve Employee Task İstatistikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leader Task İstatistikleri */}
        <LeaderTaskChart 
          leaderTaskData={dashboardData.ticketStats?.tasks?.leader || []}
        />

        {/* Employee Task İstatistikleri */}
        <EmployeeTaskChart 
          employeeTaskData={dashboardData.ticketStats?.tasks?.employee || []}
        />
      </div>

      {/* Beşinci Satır - Kategori ve Chat Trend Grafikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori İstatistikleri */}
        <CategoryStatisticsChart 
          categoryData={dashboardData.ticketStats?.categories || []}
        />

        {/* Chat İstatistikleri */}
        <ChatStatisticsChart 
          chatData={dashboardData.ticketStats?.chats?.dates || []}
          chatCount={dashboardData.ticketStats?.chats?.chatCount || 0}
          messageCount={dashboardData.ticketStats?.chats?.messageCount || 0}
        />
      </div>

      {/* Altıncı Satır - Message Trends Line Chart */}
      <div className="grid grid-cols-1 gap-6">
        <MessageTrendChart 
          messageTrendData={dashboardData.ticketStats?.chats?.dates || []}
        />
      </div>
    </div>
  );
};

export default AdminDashboard; 