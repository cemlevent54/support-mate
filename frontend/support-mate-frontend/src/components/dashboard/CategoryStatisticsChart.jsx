import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Group as GroupIcon } from '@mui/icons-material';

const CategoryStatisticsChart = ({ categoryData }) => {
  const { t } = useTranslation();

  return (
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
        <BarChart data={categoryData || []}>
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
  );
};

export default CategoryStatisticsChart; 