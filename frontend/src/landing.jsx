import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider } from './firebase'; 
import { 
  signInWithPopup, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Landing() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isVerificationMode, setIsVerificationMode] = useState(false);

  // --- 1. HANDLE RETURNING USER FROM EMAIL LINK ---
  useEffect(() => {
    const completeSignIn = async () => {
      // Check if the URL contains the secure Firebase token when the page loads
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setIsLoading(true);
        let savedEmail = window.localStorage.getItem('emailForSignIn');

        // If they opened the link on a different device, ask for their email again to confirm
        if (!savedEmail) {
          savedEmail = window.prompt('Please re-enter your email for confirmation:');
        }

        try {
          const result = await signInWithEmailLink(auth, savedEmail, window.location.href);
          window.localStorage.removeItem('emailForSignIn'); // Clear storage
          await checkAndCreateUser(result.user, savedEmail);
        } catch (err) {
          console.error("Link Sign-In Error:", err);
          setError("Verification link expired or is invalid. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    completeSignIn();
  }, []);

  // --- 2. DATABASE CREATION HELPER ---
  const checkAndCreateUser = async (user, emailUsed) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    // If they don't exist yet, create a default profile for them
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        name: user.displayName || emailUsed.split('@')[0] || "New Student",
        email: user.email || emailUsed,
        major: "",
        skills: "",
        wantToLearn: "",
        isBlockedFromFeed: false,
        warnings: [],
        createdAt: serverTimestamp()
      });
    }
  };

  // --- 3. SEND EMAIL VERIFICATION LINK ---
  const handleSendLink = async (e) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email.");

    setIsLoading(true);
    setError('');
    setMessage('');

    const actionCodeSettings = {
      // This dynamically grabs your current URL (works for both localhost and your live Firebase app)
      url: window.location.href, 
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email); // Save email locally so they don't have to re-type it
      setIsVerificationMode(true);
      setMessage("✨ Verification link sent! Please check your inbox and spam folder.");
    } catch (error) {
      console.error("Email Link Error:", error);
      setError("Failed to send verification link. Please ensure the email is valid.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. GOOGLE SIGN IN ---
  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await checkAndCreateUser(result.user, result.user.email);
    } catch (error) {
      console.error("Google Auth Error:", error);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
        
        <h1 className="text-3xl font-black text-blue-500 mb-2 text-center">CampusConnect</h1>
        <p className="text-slate-400 text-center mb-8">Sign in to access your student dashboard.</p>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-400 p-3 rounded-lg mb-6 text-sm text-center">
            {message}
          </div>
        )}

        {/* Google Auth Button */}
        <button 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
             <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold tracking-wider">OR VERIFY EMAIL</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        {/* Email Link Auth */}
        {!isVerificationMode ? (
          <form onSubmit={handleSendLink} className="space-y-4">
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..." 
              className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Send Login Link'}
            </button>
          </form>
        ) : (
          <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-slate-300 text-sm mb-4">
              We sent a magic link to <strong className="text-white">{email}</strong>. Click the link in that email to instantly log in.
            </p>
            <button 
              onClick={() => setIsVerificationMode(false)}
              className="text-blue-400 hover:text-blue-300 text-sm font-bold"
            >
              Entered the wrong email? Try again.
            </button>
          </div>
        )}

      </div>
    </div>
  );
}