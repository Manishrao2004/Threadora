import { createContext, useState, useEffect } from 'react';
import { getMe, loginUser, registerUser, loginGoogle as loginGoogleApi } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate the session on mount. If a stored token is no longer valid
  // (expired, revoked, etc.) the /auth/me call will fail, we clear local
  // storage, and the user is treated as a guest.
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await registerUser(userData);
    // The backend issues a token immediately on successful registration
    // (no email-verification step is currently active).
    if (data.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
    }
    return data;
  };

  const googleLoginAction = async (idToken) => {
    const data = await loginGoogleApi(idToken);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Partial update — merges fields into the cached user object without a
  // round-trip to the server. Used after profile edits, save-thread toggles, etc.
  const updateUser = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      googleLogin: googleLoginAction,
      logout,
      updateUser,
      isAdmin: user?.role === 'admin' || user?.role === 'superadmin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
