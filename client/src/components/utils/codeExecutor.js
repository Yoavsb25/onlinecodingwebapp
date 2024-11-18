export const executeCode = async (code, solution, timeout = 5000) => {
  try {
    // First check if the code is just whitespace or empty
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

    // Create a safe evaluation context with mocked console and return mechanism
    const safeEval = new Function('code', 'mockConsole', `
      try {
        // Capture the original console
        const originalConsole = console;
        
        // Replace console with our mock
        console = mockConsole;
        
        // Capture the return value as well
        let returnValue;
        
        // Evaluate the code, capturing any potential return
        returnValue = eval(code);
        
        // If there's a return value and it's not undefined, log it
        if (returnValue !== undefined) {
          mockConsole.log(returnValue);
        }
        
        // Restore original console
        console = originalConsole;
        
        return { success: true, output: 'output' };
      } catch (error) {
        return { 
          success: false, 
          output: 'Error: ' + error.message 
        };
      }
    `);

    // Execute the code with our mocked console
    const result = safeEval(code, mockConsole);

    // Determine the output
    const output = capturedOutput.length > 0
      ? capturedOutput.join('\n')
      : (result.success ? 'Code executed successfully' : result.output);

    // Return the comparison result
    return {
      success: normalizedCode === normalizedSolution, // Compare normalized code and solution
      output: output || 'No output generated'
    };
  } catch (error) {
    return {
      success: false,
      output: `Critical Error: ${error.message}`
    };
  }
};

// Helper function to normalize code for comparison
export const normalizeCode = (code) => {
  if (!code) return '';
  // Normalize multiple spaces and multiple newlines
  return code
    .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
    .replace(/\n+/g, '\n')  // Replace multiple newlines with a single newline
    .trim();  // Trim any leading or trailing whitespace
};
