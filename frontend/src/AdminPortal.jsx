import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function AdminPortal() {
  const [clubName, setClubName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [presidentEmail, setPresidentEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // New state to hold the list of clubs
  const [clubs, setClubs] = useState([]);

  // Fetch all clubs as soon as the portal opens
  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clubs"));
      const clubsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClubs(clubsList);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await addDoc(collection(db, "clubs"), {
        name: clubName,
        category: category,
        presidentEmail: presidentEmail.toLowerCase().trim(),
        description: "",
        vicePresident: "",
        tags: [],
        works: [],
        recognitions: [],
        currentMembersCount: 0,
        bookmarkedBy: [],
        applicants: [],
        createdAt: serverTimestamp()
      });

      setMessage(`✅ Successfully created ${clubName} and assigned ${presidentEmail} as President!`);
      
      setClubName('');
      setPresidentEmail('');
      setCategory('Technology');
      
      // Refresh the list immediately after creating
      fetchClubs(); 
    } catch (error) {
      console.error("Error creating club:", error);
      setMessage("❌ Error creating club. Check console.");
    } finally {
      setIsLoading(false);
    }
  };

  // The new Delete function
  const handleDeleteClub = async (clubId, clubName) => {
    // Add a strict confirmation popup so you don't accidentally delete one!
    const isConfirmed = window.confirm(`⚠️ Are you absolutely sure you want to delete "${clubName}"? This action cannot be undone.`);
    
    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, "clubs", clubId));
        setMessage(`🗑️ Successfully deleted ${clubName}`);
        
        // Refresh the list immediately after deleting
        fetchClubs();
      } catch (error) {
        console.error("Error deleting club:", error);
        setMessage("❌ Error deleting club. Check console.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-4 pb-12">
      
      {/* 1. CREATION PANEL */}
      <div className="bg-slate-900 border border-emerald-900/50 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 border-b border-slate-800 pb-4">
          <h2 className="text-3xl font-black text-emerald-400">👑 Super Admin Portal</h2>
          <p className="text-slate-400 mt-2">Create official club shells and assign presidential access.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 font-medium ${message.includes('✅') || message.includes('🗑️') ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleCreateClub} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Official Club Name</label>
              <input 
                type="text" required value={clubName} onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g. Algorithmic Thinkers Society"
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
              <select 
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500"
              >
                <option value="Technology">Technology</option>
                <option value="Engineering">Engineering</option>
                <option value="Academics">Academics</option>
                <option value="Soft Skills">Soft Skills</option>
                <option value="Arts & Culture">Arts & Culture</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">President's Account Email</label>
            <input 
              type="email" required value={presidentEmail} onChange={(e) => setPresidentEmail(e.target.value)}
              placeholder="e.g. president@university.edu"
              className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-lg transition disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Processing...' : 'Deploy New Club'}
          </button>
        </form>
      </div>

      {/* 2. MANAGEMENT PANEL (DELETE LIST) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-slate-200">Manage Active Clubs</h2>
          <p className="text-slate-400 text-sm mt-1">Total clubs in database: {clubs.length}</p>
        </div>

        <div className="space-y-4">
          {clubs.length === 0 ? (
            <p className="text-slate-500 italic text-center py-4">No clubs have been created yet.</p>
          ) : (
            clubs.map(club => (
              <div key={club.id} className="flex flex-col md:flex-row items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-bold text-slate-200 text-lg">{club.name}</h3>
                  <p className="text-sm text-slate-400">President: <span className="text-emerald-400">{club.presidentEmail}</span> | Category: {club.category}</p>
                </div>
                <button 
                  onClick={() => handleDeleteClub(club.id, club.name)}
                  className="bg-red-900/50 hover:bg-red-600 text-red-300 hover:text-white border border-red-800 hover:border-red-600 font-medium px-4 py-2 rounded-lg transition-colors w-full md:w-auto"
                >
                  Delete Club
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}