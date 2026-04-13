/**
 * Extracts a user-friendly error message from an Axios error object.
 * Handles server-side messages, network errors, and fallbacks.
 * 
 * @param {Error} error - The error object from a catch block (usually Axios)
 * @param {string} defaultMsg - The fallback message if no specific error is found
 * @returns {string}
 */
export const getErrorMessage = (error, defaultMsg = 'Something went wrong') => {
  // If the server responded with an error (4xx, 5xx)
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // If the request was made but no response was received (Server down / Network error)
  if (error.request && !error.response) {
    return 'Server unreachable. Please check your connection or try again later.';
  }

  // Fallback to default message or the generic error message
  return error.message || defaultMsg;
};
