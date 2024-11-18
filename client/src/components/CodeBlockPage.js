import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { Users, CheckCircle, AlertCircle, ArrowLeft, Play } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function CodeBlockPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [solution, setSolution] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const fetchCodeBlock = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/code-blocks/${id}`);
        if (!response.ok) throw new Error('Failed to fetch code block');
        const data = await response.json();
        setCode(data.content);
        setName(data.name);
        setSolution(data.solution);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCodeBlock();
  }, [id]);

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join', { room: `code-block-${id}` });
    });

    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('code_update', (data) => setCode(data.code));

    newSocket.on('user_joined', () => {
      setUserCount(prev => prev + 1);
    });

    newSocket.on('user_left', () => {
      setUserCount(prev => Math.max(1, prev - 1));
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave', { room: `code-block-${id}` });
        newSocket.close();
      }
    };
  }, [id]);

  const handleChange = useCallback((value) => {
    setCode(value);
    if (socket && connected) {
      socket.emit('code_change', {
        room: `code-block-${id}`,
        code: value,
      });
    }
    setIsSolved(value.trim() === solution.trim());
  }, [socket, connected, id, solution]);

  const runCode = useCallback(() => {
    setIsRunning(true);
    setOutput('');

    // Create a safe environment for evaluation
    const consoleLogs = [];
    const safeConsole = {
      log: (...args) => consoleLogs.push(args.join(' ')),
      error: (...args) => consoleLogs.push(`Error: ${args.join(' ')}`),
      warn: (...args) => consoleLogs.push(`Warning: ${args.join(' ')}`)
    };

    try {
      // Create a safe evaluation context
      const safeEval = new Function('console', `
        "use strict";
        ${code};
      `);

      safeEval(safeConsole);
      setOutput(consoleLogs.join('\n'));
    } catch (err) {
      setOutput(`Runtime Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-xl text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
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
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="relative">
            {isSolved && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <div className="text-6xl animate-bounce">😊</div>
              </div>
            )}
            <div className="rounded-lg overflow-hidden shadow-2xl bg-gray-800">
              <CodeMirror
                value={code}
                height="400px"
                theme={dracula}
                extensions={[javascript()]}
                onChange={handleChange}
                className="text-base"
              />
              <div className="p-4 border-t border-gray-700">
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="mr-2" size={16} />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden shadow-2xl bg-gray-800">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Output</h2>
            </div>
            <div className="p-4 font-mono text-sm h-[400px] overflow-auto whitespace-pre-wrap">
              {output || 'No output yet. Run your code to see results.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeBlockPage;