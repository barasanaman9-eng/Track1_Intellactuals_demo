import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Landing({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Log in
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
        onLogin(userDoc.data()); 
      } else {
        // Sign up
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const newUserData = {
          name: name,
          email: email,
          major: "B.Tech Computer Science",
          university: "MBM University"
        };
        await setDoc(doc(db, "users", userCred.user.uid), newUserData);
        onLogin(newUserData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-3xl font-black text-blue-400 text-center mb-6">CampusConnect</h1>
        {error && <p className="text-red-400 text-sm mb-4 bg-red-900/20 p-2 rounded">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input 
              type="text" required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500"
            />
          )}
          <input 
            type="email" required placeholder="University Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <input 
            type="password" required placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg disabled:opacity-50">
            {isLoading ? 'Processing...' : (isLogin ? 'Enter Portal' : 'Create Account')}
          </button>
        </form>
        
        <button onClick={() => setIsLogin(!isLogin)} className="text-slate-400 text-sm mt-6 w-full text-center hover:text-white">
          {isLogin ? "Need an account? Sign up" : "Have an account? Log in"}
        </button>
      </div>
    </div>
  );
}