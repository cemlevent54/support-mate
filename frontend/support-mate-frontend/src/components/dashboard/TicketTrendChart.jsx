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

const TicketTrendChart = ({ ticketData, totalTickets }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h6 className="text-lg font-semibold text-gray-800">
          {t('adminDashboard.ticketTrendLast7Days')}
        </h6>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200">
          {t('adminDashboard.total')}: {totalTickets}
        </span>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={ticketData || []}>
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
  );
};

export default TicketTrendChart; 