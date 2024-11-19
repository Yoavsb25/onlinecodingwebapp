import React from 'react';

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

export default OutputPanel ;