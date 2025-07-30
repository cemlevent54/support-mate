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
import { Assignment as AssignmentIcon } from '@mui/icons-material';

const TaskPriorityChart = ({ taskPriorityData }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h6 className="text-lg font-semibold text-gray-800">
          {t('adminDashboard.taskPriorities')}
        </h6>
        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <AssignmentIcon />
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={taskPriorityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <RechartsTooltip 
            formatter={(value, name) => [value, t('adminDashboard.taskCount')]}
          />
          <Bar 
            dataKey="count" 
            fill="#4CAF50"
            radius={[4, 4, 0, 0]}
          >
            {taskPriorityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaskPriorityChart; 