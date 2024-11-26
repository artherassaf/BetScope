import React from 'react';
import SignupForm from './SignupForm';

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center mb-4 text-white">
          Create an Account
        </h1>
        <p className="text-gray-400 text-center mb-6">
          
          Sign up to track your betting transactions and analytics!
        </p>
        <SignupForm />
      </div>
    </div>
  );
};

export default Signup;
