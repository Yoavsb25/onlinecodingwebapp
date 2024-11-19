import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { Play, Check, X } from 'lucide-react';

const CodeEditor = React.memo(({ code, onChange, onRun, isRunning, isSolved }) => {
  return (
    <div className="relative">
      <div className="rounded-lg overflow-hidden shadow-2xl bg-gray-800">
        <CodeMirror
          value={code}
          height="400px"
          theme={oneDark}
          extensions={[javascript()]}
          onChange={onChange}
          className="text-base"
        />
        <div className="p-4 border-t border-gray-700 flex justify-between items-center">
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="mr-2" size={16} />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>

          {isSolved !== undefined && (
            <div className="flex items-center">
              {isSolved ? (
                <div className="flex items-center text-green-400">
                  <Check size={24} className="mr-2" />
                  <span>Correct solution!</span>
                </div>
              ) : (
                <div className="flex items-center text-red-400">
                  <X size={24} className="mr-2" />
                  <span>Try again</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CodeEditor;

const OutputPanel = React.memo(({ output, isSolved }) => (
  <div className="rounded-lg overflow-hidden shadow-2xl bg-gray-800">
    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
      <h2 className="text-lg font-semibold">Output</h2>
      {isSolved !== undefined && (
        <div className="text-4xl" role="img" aria-label={isSolved ? "Success" : "Try Again"}>
          {isSolved ? "😊" : "😔"}
        </div>
      )}
    </div>
    <div className="p-4 font-mono text-sm h-[400px] overflow-auto whitespace-pre-wrap">
      {output || 'No output yet. Run your code to see results.'}
    </div>
  </div>
));

export { OutputPanel };