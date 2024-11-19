import React, { useReducer, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCodeSocket } from './hooks/useCodeSocket';
import { executeCode } from './utils/codeExecutor';
import { codeBlockReducer, initialState } from './reducers/codeBlockReducer';
import CodeEditor from './CodeEditor';
import OutputPanel from './OutputPanel';
import Header from './Header';
import ErrorDisplay from "./ErrorDisplay";
import LoadingSpinner from "./LoadingSpinner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000';

function CodeBlockPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(codeBlockReducer, {
    ...initialState,
    isSolved: undefined
  });

  const handleCodeUpdate = useCallback(({ code }) => {
    dispatch({ type: 'SET_CODE', payload: code });
  }, []);

  const handleUserCountUpdate = useCallback((updateFn) => {
    dispatch({ type: 'UPDATE_USER_COUNT', payload: updateFn });
  }, []);

  const { connected, error: socketError, emitCodeChange } = useCodeSocket(
    BACKEND_URL,
    id,
    handleCodeUpdate,
    handleUserCountUpdate
  );

  useEffect(() => {
    const fetchCodeBlock = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/code-blocks/${id}`);
        if (!response.ok) throw new Error('Failed to fetch code block');
        const data = await response.json();
        dispatch({type: 'SET_CODE_BLOCK', payload: data })
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err.message });
      }
    };

    fetchCodeBlock();
  }, [id]);

  const handleChange = useCallback((value) => {
    dispatch({ type: 'SET_CODE', payload: value });
    emitCodeChange(value);
  }, [emitCodeChange]);

  const runCode = useCallback(async () => {
  dispatch({ type: 'SET_RUNNING', payload: true });

  try {
    const { output, success } = await executeCode(state.code, state.solution);
    dispatch({ type: 'SET_OUTPUT', payload: output });
    dispatch({ type: 'SET_IS_SOLVED', payload: success });

    // Additional comparison of code content
    const codeMatches = state.code.trim() === state.solution.trim();
    dispatch({ type: 'SET_IS_SOLVED', payload: codeMatches });

    console.log('Code execution result:', { output, success, codeMatches });
  } catch (error) {
    dispatch({ type: 'SET_OUTPUT', payload: `Error: ${error.message}` });
    dispatch({ type: 'SET_IS_SOLVED', payload: false });
  } finally {
    dispatch({ type: 'SET_RUNNING', payload: false });
  }
}, [state.code, state.solution]);

  if (state.loading) {
    return <LoadingSpinner />;
  }

  if (state.error) {
    return <ErrorDisplay error={state.error} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <Header
          onBack={() => navigate('/')}
          userCount={state.userCount}
          connected={connected}
          name={state.name}
        />

        {/* Question Display */}
        {state.question && (
          <div className="mb-6 bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-3">Problem Description:</h2>
            <div className="prose prose-invert">
              {state.question}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CodeEditor
            code={state.code}
            onChange={handleChange}
            onRun={runCode}
            isRunning={state.isRunning}
            isSolved={state.isSolved}
          />

          <OutputPanel
            output={state.output}
            isSolved={state.isSolved}
          />
        </div>
      </div>
    </div>
  );
}

export default CodeBlockPage;