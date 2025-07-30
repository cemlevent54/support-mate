import React from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';

const UserStatisticsChart = ({ userStatsData, totalUsers }) => {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h6 className="text-lg font-semibold text-gray-800">
          {t('adminDashboard.userStatistics')}
        </h6>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200">
          {t('adminDashboard.total')}: {totalUsers}
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
  );
};

export default UserStatisticsChart; 