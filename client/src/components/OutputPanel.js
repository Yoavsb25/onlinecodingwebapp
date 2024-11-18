import React from 'react';

const OutputPanel = React.memo(({ output }) => (
  <div className="rounded-lg overflow-hidden shadow-2xl bg-gray-800">
    <div className="p-4 border-b border-gray-700">
      <h2 className="text-lg font-semibold">Output</h2>
    </div>
    <div className="p-4 font-mono text-sm h-[400px] overflow-auto whitespace-pre-wrap">
      {output || 'No output yet. Run your code to see results.'}
    </div>
  </div>
));

export default OutputPanel;
