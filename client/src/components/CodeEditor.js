import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark'; // Use the correct theme
import { Play } from 'lucide-react';

const CodeEditor = React.memo(({ code, onChange, onRun, isRunning, isSolved }) => {
  return (
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
          theme={oneDark}
          extensions={[javascript()]}
          onChange={onChange}
          className="text-base"
        />
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="mr-2" size={16} />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CodeEditor;
