import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignupForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!username.trim() || !password) {
      setMessage('Both fields are required.');
      return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (response.ok) {
        setMessage('Signup successful! Redirecting to login...');
        setUsername('');
        setPassword('');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Signup failed. Try again.');
      }
    } catch (error) {
      console.error('Error during signup:', error);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 shadow-lg rounded-lg p-6">
      <form onSubmit={handleSignup}>
        <div className="mb-4">
          <label htmlFor="username" className="block font-semibold mb-1 text-gray-300">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
            placeholder="Enter your username"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block font-semibold mb-1 text-gray-300">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
            placeholder="Enter your password"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className={`w-full py-2 rounded-lg font-semibold ${
            loading
              ? 'text-white cursor-not-allowed'
              : 'bg-lime-500 hover:bg-lime-600 text-white'
          }`}
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Signup'}
        </button>
      </form>
      {message && (
        <p
          className={`text-center mt-4 ${
            message.includes('successful') ? 'text-lime-400' : 'text-red-500'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default SignupForm;
