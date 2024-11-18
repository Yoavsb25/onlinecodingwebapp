// src/components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
