import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomeScreen from './WelcomeScreen';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import { jwtDecode } from 'jwt-decode'; // Fixed the import

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to check if a token is valid
  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      return decoded.exp > currentTime; // Check if token is still valid
    } catch (err) {
      console.error('Error decoding token:', err);
      return false;
    }
  };

  // Check token validity on app load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && isTokenValid(token)) {
      setIsAuthenticated(true);
    } else {
      // Clear tokens if invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
    }
  }, []);

  // Logout handler
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    window.location.href = '/'; // Force reload to ensure state is reset
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<WelcomeScreen />} />

        {/* Force users to see the login page */}
        <Route
          path="/login"
          element={
            <Login
              setIsAuthenticated={setIsAuthenticated}
              clearTokens={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setIsAuthenticated(false);
              }}
            />
          }
        />

        {/* Force users to see the signup page */}
        <Route
          path="/signup"
          element={
            <Signup
              setIsAuthenticated={setIsAuthenticated}
              clearTokens={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setIsAuthenticated(false);
              }}
            />
          }
        />

        {/* Protected Route */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard logout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
