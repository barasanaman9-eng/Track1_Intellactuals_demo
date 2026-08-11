import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { sendSignInLinkToEmail, signInWithPopup } from 'firebase/auth';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Google Auth Logic
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setMessage('');
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login failed:", error);
      setMessage(`Login error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Magic Link Logic (with Vercel URL fix)
  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email first.");
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    // Automatically uses your live Vercel URL when deployed, and localhost during dev
    const actionCodeSettings = {
      url: window.location.origin, 
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('✨ Magic link sent! Please check your inbox.');
      setEmail(''); // Clear the input field after success
    } catch (error) {
      console.error("Magic link failed:", error);
      setMessage(`Email error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to CampusConnect
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The exclusive network for M.B.M. University students and alumni.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Status Message Display */}
          {message && (
            <div className={`mb-4 text-sm text-center p-3 rounded ${message.includes('error') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {message}
            </div>
          )}

          {/* Google Auth Button */}
          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
            >
              <img 
                className="h-5 w-5 mr-2" 
                src="https://www.svgrepo.com/show/475656/google-color.svg" 
                alt="Google logo" 
              />
              Continue with Google
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          {/* Magic Link Form */}
          <form className="mt-6 space-y-6" onSubmit={handleMagicLinkLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}