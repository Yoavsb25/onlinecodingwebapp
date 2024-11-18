import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code, ChevronRight, Loader } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function LobbyPage() {
  const [codeBlocks, setCodeBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCodeBlocks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/code-blocks`);
        if (!response.ok) throw new Error('Failed to fetch code blocks');
        const data = await response.json();
        setCodeBlocks(data.codeBlocks);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching code blocks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCodeBlocks();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
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
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose a Code Block</h1>
          <p className="text-gray-400">Select a challenge to start coding</p>
        </div>

        {codeBlocks.length === 0 ? (
          <div className="text-xl text-gray-400 text-center">
            No code blocks available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {codeBlocks.map((block) => (
              <Link
                key={block.id}
                to={`/code-block/${block.id}`}
                className="group relative block p-6 bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-2 text-white">
                      {block.name}
                    </h2>
                    <p className="text-gray-400">Click to start coding</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LobbyPage;