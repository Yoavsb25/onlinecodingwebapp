// src/components/Header/Header.js
import React from 'react';
import { Users, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const Header = React.memo(({ onBack, userCount, connected, name, role }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onBack}
        className="flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="mr-2" size={20} />
        Back to Lobby
      </button>
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-gray-400">
          <Users className="mr-2" size={20} />
          {userCount} user{userCount !== 1 ? 's' : ''} online
        </div>
        {connected ? (
          <div className="flex items-center text-green-400">
            <CheckCircle className="mr-2" size={20} />
            Connected
          </div>
        ) : (
          <div className="flex items-center text-red-400">
            <AlertCircle className="mr-2" size={20} />
            Disconnected
          </div>
        )}
        {role && (
          <div
            className={`flex items-center ${
              role === 'mentor' ? 'text-yellow-400' : 'text-blue-400'
            }`}
          >
            {role === 'mentor' ? '👨‍🏫 Mentor' : '👩‍💻 Student'}
          </div>
        )}
      </div>
    </div>
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2">{name}</h1>
    </div>
  </div>
));

export default Header;