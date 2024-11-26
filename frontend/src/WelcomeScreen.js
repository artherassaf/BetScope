import React from 'react';
import { Link } from 'react-router-dom';
import BetScopeLogo from './assets/images/betscope.png';

const WelcomeScreen = () => {
  return (
    <div className="min-h-screen bg-gradient text-white font-sans flex flex-col">
      {/* NavBar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-dark-800 shadow-md">
        {/* Title with the logo shifted slightly left */}
        <div className="flex items-center -ml-4"> {/* Added -ml-4 to shift left */}
          <img src={BetScopeLogo} alt="BetScope Logo" className="h-16 w-auto" />
        </div>
        <div className="space-x-4">
          <Link
            to="/login"
            className="text-gray-300 font-semibold hover:text-white transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-lime-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-lime-600 transition"
          >
            Create Account
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center flex-grow text-center px-6 py-12">
        <h1 className="text-6xl font-extrabold mb-6 leading-tight animate-fadeIn">
          Track Smarter, <span className="text-lime-500">Bet Better</span>
        </h1>
        <p className="text-lg max-w-2xl text-gray-300 animate-fadeIn delay-200">
          Take control of your betting activity with BetScope. Get real-time insights into your betting deposits and withdrawals. Track trends and make smarter decisions all in one easy-to-use platform.
        </p>
      </main>
    </div>
  );
};

export default WelcomeScreen;


