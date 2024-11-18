import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { Users, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/dracula.css';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';

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

  const handleChange = useCallback((editor, data, value) => {
    setCode(value);
    if (socket && connected) {
      socket.emit('code_change', {
        room: `code-block-${id}`,
        code: value,
      });
    }
    setIsSolved(value.trim() === solution.trim());
  }, [socket, connected, id, solution]);

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

        <div className="relative">
          {isSolved && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <div className="text-6xl animate-bounce">😊</div>
            </div>
          )}
          <div className="rounded-lg overflow-hidden shadow-2xl">
            <CodeMirror
              value={code}
              options={{
                mode: 'javascript',
                theme: 'dracula',
                lineNumbers: true,
                lineWrapping: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                tabSize: 2,
                extraKeys: {
                  'Ctrl-Space': 'autocomplete',
                },
                viewportMargin: Infinity,
              }}
              onBeforeChange={handleChange}
              className="code-editor"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeBlockPage;