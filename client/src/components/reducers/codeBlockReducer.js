// In your codeBlockReducer.js
export const initialState = {
  loading: true,
  error: null,
  code: '',
  solution: '',
  name: '',
  output: '',
  isRunning: false,
  isSolved: false,
  userCount: 1
};

export function codeBlockReducer(state, action) {
  switch (action.type) {
    case 'SET_CODE_BLOCK':
      return {
        ...state,
        loading: false,
        name: action.payload.name,
        code: action.payload.content,
        solution: action.payload.solution
      };
    case 'SET_CODE':
      return { ...state, code: action.payload };
    case 'SET_OUTPUT':
      return { ...state, output: action.payload };
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload };
    case 'SET_SOLVED':
      return { ...state, isSolved: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_USER_COUNT':
      return { ...state, userCount: action.payload };
    default:
      return state;
  }
}