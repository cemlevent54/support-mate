import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Assignment as AssignmentIcon } from '@mui/icons-material';

const TaskStatusChart = ({ taskStatusData }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h6 className="text-lg font-semibold text-gray-800">
          {t('adminDashboard.taskStatuses')}
        </h6>
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <AssignmentIcon />
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={taskStatusData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {taskStatusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip 
            formatter={(value, name) => [value, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaskStatusChart; 