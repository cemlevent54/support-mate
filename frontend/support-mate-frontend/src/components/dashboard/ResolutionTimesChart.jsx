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

const ResolutionTimesChart = ({ closedTicketData, closedTickets, totalResolvedTickets }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h6 className="text-lg font-semibold text-gray-800">
          {t('adminDashboard.resolutionTimes')}
        </h6>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <h4 className="text-3xl font-bold text-green-600">
              {closedTickets}
            </h4>
            <p className="text-sm text-gray-500">
              {t('adminDashboard.closedTicket')}
            </p>
          </div>
          
          <div className="text-center">
            <h4 className="text-3xl font-bold text-blue-600">
              {totalResolvedTickets}
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
  );
};

export default ResolutionTimesChart; 