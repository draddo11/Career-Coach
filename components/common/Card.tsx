import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl shadow-black/20 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;