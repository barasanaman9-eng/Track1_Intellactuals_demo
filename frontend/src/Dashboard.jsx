import React, { useState } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function Dashboard({ userData, onOpenChat, onOpenProfile, onOpenClubs, onOpenAdmin, onOpenFeed }) {
  
  // State to instantly hide the warning when dismissed
  const [isDismissing, setIsDismissing] = useState(false);
  const [hideWarning, setHideWarning] = useState(false);

  // 🔥 SET YOUR ADMIN EMAIL HERE 🔥
  const ADMIN_EMAIL = "mayangurj@gmail.com"; 
  const isAdmin = userData?.email === ADMIN_EMAIL;

  const firstName = userData?.name?.split(' ')[0] || 'Student';
  const initials = userData?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';

  // Function to clear the warning from the database
  const handleDismissWarnings = async () => {
    setIsDismissing(true);
    try {
      const q = query(collection(db, "users"), where("email", "==", userData.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDocRef = doc(db, "users", querySnapshot.docs[0].id);
        // Wipe the warnings array clean in Firebase
        await updateDoc(userDocRef, {
          warnings: []
        });
        // Instantly hide the banner on the screen
        setHideWarning(true);
      }
    } catch (error) {
      console.error("Error dismissing warnings:", error);
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-blue-400 mb-2">CampusConnect</h1>
          <p className="text-slate-400 text-lg">Welcome back, {firstName}! 👋</p>
        </div>
        
        <button 
          onClick={onOpenProfile}
          className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all hover:scale-105"
          title="Open Profile"
        >
          {initials}
        </button>
      </div>

      {/* 🚨 ADMIN WARNING BANNER (With Dismiss Button) 🚨 */}
      {userData?.warnings && userData.warnings.length > 0 && !hideWarning && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-6 mb-8 shadow-lg shadow-red-900/10">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
              ⚠️ Administrative Notice
            </h3>
            <button 
              onClick={handleDismissWarnings}
              disabled={isDismissing}
              className="text-xs bg-red-900/50 hover:bg-red-700 text-red-200 px-4 py-1.5 rounded-lg transition-colors border border-red-800"
            >
              {isDismissing ? 'Clearing...' : 'Dismiss'}
            </button>
          </div>
          <p className="text-slate-300 mb-3 text-sm">
            You have received the following warnings from the CampusConnect administration:
          </p>
          <ul className="list-disc pl-5 text-slate-300 space-y-2">
            {userData.warnings.map((warn, index) => (
              <li key={index} className="text-red-200">{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions Grid */}
      <h2 className="text-2xl font-bold mb-6 text-slate-200">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div onClick={onOpenChat} className="bg-slate-800 p-6 rounded-xl cursor-pointer hover:bg-slate-700 transition border border-slate-700">
          <h3 className="text-xl font-bold mb-2">🚀 Campus AI</h3>
          <p className="text-slate-400 text-sm">Ask questions & get personalized advice.</p>
        </div>

        <div onClick={onOpenProfile} className="bg-slate-800 p-6 rounded-xl cursor-pointer hover:bg-slate-700 transition border border-slate-700">
          <h3 className="text-xl font-bold mb-2">👤 My Profile</h3>
          <p className="text-slate-400 text-sm">Update your skills, GPA, and details.</p>
        </div>

        <div onClick={onOpenClubs} className="bg-slate-800 p-6 rounded-xl cursor-pointer hover:bg-slate-700 transition border border-slate-700">
          <h3 className="text-xl font-bold mb-2">🎯 Club Explorer</h3>
          <p className="text-slate-400 text-sm">Find and join campus organizations.</p>
        </div>

        <div onClick={onOpenFeed} className="bg-slate-800 p-6 rounded-xl cursor-pointer hover:bg-slate-700 transition border border-slate-700">
          <h3 className="text-xl font-bold mb-2">🌐 Campus Feed</h3>
          <p className="text-slate-400 text-sm">Discuss topics and connect with alumni.</p>
        </div>
      </div>

      {/* THE SECRET ADMIN SECTION */}
      {isAdmin && (
        <div className="mt-12 pt-8 border-t border-slate-800">
          <h2 className="text-xl font-bold mb-4 text-emerald-500">Admin Controls</h2>
          <div onClick={onOpenAdmin} className="bg-slate-900 p-6 rounded-xl cursor-pointer hover:bg-slate-800 transition border border-emerald-900/50">
            <h3 className="text-lg font-bold mb-2 text-emerald-400">👑 Open Admin Portal</h3>
            <p className="text-slate-500 text-sm">Create clubs and assign Presidents.</p>
          </div>
        </div>
      )}

    </div>
  );
}