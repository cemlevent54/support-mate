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
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

const MessageTrendChart = ({ messageTrendData }) => {
  const { t } = useTranslation();

  return (
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
        <LineChart data={messageTrendData || []}>
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
  );
};

export default MessageTrendChart; 