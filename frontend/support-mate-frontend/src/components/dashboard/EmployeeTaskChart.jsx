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
import { Work as WorkIcon } from '@mui/icons-material';

const EmployeeTaskChart = ({ employeeTaskData }) => {
  const { t } = useTranslation();

  return (
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
        <BarChart data={employeeTaskData || []}>
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
  );
};

export default EmployeeTaskChart; 