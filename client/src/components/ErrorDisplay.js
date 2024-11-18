// src/components/ErrorDisplay.js
import React from 'react';

const ErrorDisplay = ({ error }) => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-red-600 text-white">
      <div className="text-center p-4 border rounded-lg shadow-lg bg-red-700">
        <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h2>
        <p>{error}</p>
        <p className="mt-4">Please try again later or contact support if the issue persists.</p>
      </div>
    </div>
  );
};

export default ErrorDisplay;
