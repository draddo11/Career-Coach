
import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface AlertProps {
  type: 'error' | 'warning';
  title: string;
  message: string;
}

const Alert: React.FC<AlertProps> = ({ type, title, message }) => {
  const baseClasses = "border rounded-2xl p-4 flex items-start space-x-4";
  const typeClasses = {
    error: "bg-red-900/20 border-red-500/30 text-red-300",
    warning: "bg-yellow-900/20 border-yellow-500/30 text-yellow-300",
  };
  
  const iconClasses = {
    error: "text-red-400",
    warning: "text-yellow-400",
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <div className={`flex-shrink-0 ${iconClasses[type]}`}>
        <ExclamationTriangleIcon />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm mt-1 opacity-90 whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
};

export default Alert;