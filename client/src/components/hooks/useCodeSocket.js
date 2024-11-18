import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

export const useCodeSocket = (backendUrl, roomId, onCodeUpdate, onUserCountUpdate, onSolutionMatched) => {
  const [socketState, setSocketState] = useState({
    socket: null,
    connected: false,
    error: null
  });

  useEffect(() => {
    const socket = io(backendUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const handleConnect = () => {
      setSocketState(prev => ({ ...prev, connected: true, error: null }));
      socket.emit('join', { room: `code-block-${roomId}` });
    };

    const handleDisconnect = () => {
      setSocketState(prev => ({ ...prev, connected: false }));
    };

    const handleError = (error) => {
      setSocketState(prev => ({ ...prev, error: error.message }));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('code_update', onCodeUpdate);
    socket.on('solution_matched', () => onSolutionMatched(true));  // Update if the solution is matched
    socket.on('user_joined', () => onUserCountUpdate(prev => prev + 1));
    socket.on('user_left', () => onUserCountUpdate(prev => Math.max(1, prev - 1)));

    setSocketState(prev => ({ ...prev, socket }));

    return () => {
      if (socket) {
        socket.emit('leave', { room: `code-block-${roomId}` });
        socket.disconnect();
      }
    };
  }, [backendUrl, roomId, onCodeUpdate, onUserCountUpdate, onSolutionMatched]);

  const emitCodeChange = useCallback((code) => {
    if (socketState.socket && socketState.connected) {
      socketState.socket.emit('code_change', {
        room: `code-block-${roomId}`,
        code,
      });
    }
  }, [socketState.socket, socketState.connected, roomId]);

  return { ...socketState, emitCodeChange };
};
