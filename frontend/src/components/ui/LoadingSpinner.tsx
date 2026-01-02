import React from "react";

const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600 ${className}`} />
  );
};

export default LoadingSpinner;
