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

const LeaderTaskChart = ({ leaderTaskData }) => {
  const { t } = useTranslation();

  return (
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
        <BarChart data={leaderTaskData || []}>
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
  );
};

export default LeaderTaskChart; 