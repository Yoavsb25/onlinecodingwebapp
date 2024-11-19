export const executeCode = async (code, solution, timeout = 5000) => {
  try {
    if (!code || !code.trim()) {
      return {
        success: false,
        output: 'No code to execute'
      };
    }

    // Normalize the code and solution before comparison
    const normalizedCode = normalizeCode(code);
    const normalizedSolution = normalizeCode(solution);

    // Create a console capture mechanism
    let capturedOutput = [];
    const mockConsole = {
      log: (...args) => {
        capturedOutput.push(
          args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ')
        );
      },
      error: (...args) => {
        capturedOutput.push(
          'Error: ' + args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ')
        );
      }
    };

    // Execute the code with our mocked console
    const evaluationResult = new Function('console', code)(mockConsole);

    // Get the final output
    const output = capturedOutput.length > 0
      ? capturedOutput.join('\n')
      : (evaluationResult !== undefined ? String(evaluationResult) : 'Code executed successfully');

    // Compare normalized code with solution
    const isCorrect = normalizedCode === normalizedSolution;

    console.log('Code comparison:', {
      normalizedCode,
      normalizedSolution,
      isCorrect
    });

    return {
      success: isCorrect,
      output: output
    };
  } catch (error) {
    return {
      success: false,
      output: `Error: ${error.message}`
    };
  }
};

// Helper function to normalize code for comparison
export const normalizeCode = (code) => {
  if (!code) return '';
  return code
    .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
    .replace(/\n+/g, '\n')  // Replace multiple newlines with a single newline
    .trim();  // Trim any leading or trailing whitespace
};