import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { People as PeopleIcon } from '@mui/icons-material';

const UserRegistrationChart = ({ userRegistrationData }) => {
  const { t } = useTranslation();

  return (
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
        <LineChart data={userRegistrationData || []}>
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
  );
};

export default UserRegistrationChart; 