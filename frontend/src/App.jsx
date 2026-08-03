import React, { useState, useEffect } from 'react';
import Landing from './Landing';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Chatbot from './Chatbot';
import AdminPortal from './AdminPortal';
import ClubExplorer from './ClubExplorer';
import CommunityFeed from './CommunityFeed';
import { auth, db } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [userData, setUserData] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // 1. Added loading state
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'chat', 'profile', 'clubs', 'feed', 'admin'

  useEffect(() => {
    // This listener watches for login/logout and survives page refreshes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // User is logged in! Fetch their data from Firestore
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData({ ...userDoc.data(), email: currentUser.email });
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
        }
      } else {
        // User is logged out
        setUserData(null);
      }
      // 2. Crucial Step: Stop loading ONLY AFTER Firestore finishes fetching
      setIsAuthLoading(false); 
    });

    // Cleanup the listener when the app closes
    return () => unsubscribe();
  }, []);

  // 3. The Anti-Flicker Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-blue-500 font-bold text-xl animate-pulse">
          Loading CampusConnect...
        </p>
      </div>
    );
  }

  // If no user is logged in, show the Landing Page
  if (!userData) {
    return <Landing onLogin={(data) => setUserData(data)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex justify-between items-center">
        <h1 
          className="text-xl font-bold text-blue-400 cursor-pointer"
          onClick={() => setActiveView('dashboard')}
        >
          CampusConnect
        </h1>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => auth.signOut()} 
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        
        {activeView === 'dashboard' && (
          <Dashboard 
            userData={userData}
            onOpenChat={() => setActiveView('chat')} 
            onOpenProfile={() => setActiveView('profile')} 
            onOpenClubs={() => setActiveView('clubs')}
            onOpenFeed={() => setActiveView('feed')}
            onOpenAdmin={() => setActiveView('admin')} 
          />
        )}

        {activeView === 'profile' && (
          <div className="p-6 h-full flex flex-col">
            <button onClick={() => setActiveView('dashboard')} className="mb-4 self-start text-blue-400 hover:text-blue-300 font-medium">&larr; Back to Dashboard</button>
            <Profile userData={userData} />
          </div>
        )}

        {activeView === 'chat' && (
          <div className="p-6 h-[85vh] flex flex-col">
            <button onClick={() => setActiveView('dashboard')} className="mb-4 self-start text-blue-400 hover:text-blue-300 font-medium">&larr; Back to Dashboard</button>
            <Chatbot userData={userData} /> 
          </div>
        )}

        {activeView === 'clubs' && (
          <div className="p-6 h-full flex flex-col">
            <button onClick={() => setActiveView('dashboard')} className="mb-4 self-start text-blue-400 hover:text-blue-300 font-medium">&larr; Back to Dashboard</button>
            <ClubExplorer userData={userData} />
          </div>
        )}

        {activeView === 'feed' && (
          <div className="p-6 h-full flex flex-col">
            <button onClick={() => setActiveView('dashboard')} className="mb-4 self-start text-blue-400 hover:text-blue-300 font-medium">&larr; Back to Dashboard</button>
            <CommunityFeed userData={userData} />
          </div>
        )}

        {activeView === 'admin' && (
          <div className="p-6 h-full flex flex-col">
            <button onClick={() => setActiveView('dashboard')} className="mb-4 self-start text-emerald-500 hover:text-emerald-400 font-medium">&larr; Back to Dashboard</button>
            <AdminPortal />
          </div>
        )}

      </main>
    </div>
  );
}