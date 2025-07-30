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
import { Support as SupportIcon } from '@mui/icons-material';

const ChatStatisticsChart = ({ chatData, chatCount, messageCount }) => {
  const { t } = useTranslation();

  return (
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
            {chatCount}
          </h4>
          <p className="text-sm text-gray-500">{t('adminDashboard.totalChat')}</p>
        </div>
        <div className="text-center">
          <h4 className="text-2xl font-bold text-green-600">
            {messageCount}
          </h4>
          <p className="text-sm text-gray-500">{t('adminDashboard.totalMessage')}</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chatData?.filter(date => date.messageCount > 0) || []}>
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
  );
};

export default ChatStatisticsChart; 