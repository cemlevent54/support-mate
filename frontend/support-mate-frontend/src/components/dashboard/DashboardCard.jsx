import React from 'react';

const DashboardCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor = 'bg-blue-100', 
  iconColor = 'text-blue-600',
  subtitle,
  children 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <h6 className="text-gray-600 font-medium">
          {title}
        </h6>
        <div className={`w-10 h-10 ${iconBgColor} ${iconColor} rounded-full flex items-center justify-center`}>
          <Icon />
        </div>
      </div>
      
      <h4 className="text-3xl font-bold text-gray-800 mb-2">
        {value}
      </h4>
      
      {subtitle && (
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      )}
      
      {children}
    </div>
  );
};

export default DashboardCard; 