import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function ClubExplorer({ userData }) {
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // NEW: State to track which club is currently opened
  const [selectedClub, setSelectedClub] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for when the President is editing
  const [formData, setFormData] = useState({});

  const categories = ['All', 'Technology', 'Academics', 'Engineering', 'Soft Skills', 'Arts & Culture'];

  const fetchClubs = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "clubs"));
      const clubsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClubs(clubsList);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter(club => {
    const safeName = club.name || '';
    const nameMatch = safeName.toLowerCase().includes(searchTerm.toLowerCase());
    const safeTags = Array.isArray(club.tags) ? club.tags : [];
    const tagsMatch = safeTags.some(tag => (tag || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (nameMatch || tagsMatch) && (activeFilter === 'All' || club.category === activeFilter);
  });

  // --- DETAIL VIEW FUNCTIONS ---

  const handleOpenClub = (club) => {
    setSelectedClub(club);
    setIsEditing(false);
    // Pre-fill the form with existing data (or empty strings if it's a new club)
    setFormData({
      description: club.description || '',
      vicePresident: club.vicePresident || '',
      membersByYear: club.membersByYear || '',
      works: club.works || '',
      recognitions: club.recognitions || '',
      latestNews: club.latestNews || '',
      upcomingEvents: club.upcomingEvents || '',
      contactEmail: club.contactEmail || '',
      contactPhone: club.contactPhone || ''
    });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const clubRef = doc(db, "clubs", selectedClub.id);
      await updateDoc(clubRef, formData);
      
      // Update local state so the UI refreshes immediately
      setSelectedClub({ ...selectedClub, ...formData });
      setIsEditing(false);
      
      // Refresh the main list in the background
      fetchClubs();
    } catch (error) {
      console.error("Error saving club details:", error);
      alert("Error saving details. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center mt-20"><p className="text-slate-400 animate-pulse text-lg">Loading organizations...</p></div>;
  }

  // ==========================================
  // VIEW 1: THE DETAILED DASHBOARD (OPENED CLUB)
  // ==========================================
  if (selectedClub) {
    const isPresident = userData?.email === selectedClub.presidentEmail;

    return (
      <div className="max-w-5xl mx-auto w-full pb-12 animate-fade-in">
        <button onClick={() => setSelectedClub(null)} className="mb-6 text-blue-400 hover:text-blue-300 font-medium">
          &larr; Back to Club List
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-6">
            <div>
              <span className="text-sm font-bold tracking-wider text-blue-400 uppercase">{selectedClub.category}</span>
              <h2 className="text-3xl font-black text-white mt-1">{selectedClub.name}</h2>
            </div>
            
            {isPresident && (
              <div className="mt-4 md:mt-0">
                {isEditing ? (
                  <button onClick={handleSaveDetails} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                    {isSaving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold transition-colors border border-slate-600">
                    ✏️ Edit Club Details
                  </button>
                )}
              </div>
            )}
          </div>

          {/* EDIT MODE */}
          {isEditing && isPresident ? (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-blue-200 mb-6">
                You are editing <strong>{selectedClub.name}</strong> as the President. Make sure to save your changes!
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-slate-400 text-sm mb-2">Club Description</label><textarea name="description" value={formData.description} onChange={handleFormChange} rows="3" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="What does your club do?"/></div>
                <div><label className="block text-slate-400 text-sm mb-2">Vice President Name</label><input type="text" name="vicePresident" value={formData.vicePresident} onChange={handleFormChange} className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="e.g. John Doe"/></div>
                <div><label className="block text-slate-400 text-sm mb-2">Current Members (By Year)</label><textarea name="membersByYear" value={formData.membersByYear} onChange={handleFormChange} rows="3" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="e.g. 1st Year: 15 members&#10;2nd Year: 10 members"/></div>
                <div><label className="block text-slate-400 text-sm mb-2">Past Works & Projects</label><textarea name="works" value={formData.works} onChange={handleFormChange} rows="3" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="List your projects here..."/></div>
                <div><label className="block text-slate-400 text-sm mb-2">Awards & Recognitions</label><textarea name="recognitions" value={formData.recognitions} onChange={handleFormChange} rows="3" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="Any awards won?"/></div>
                <div><label className="block text-slate-400 text-sm mb-2">Upcoming Events</label><textarea name="upcomingEvents" value={formData.upcomingEvents} onChange={handleFormChange} rows="3" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="Hackathon on Friday..."/></div>
                <div className="md:col-span-2"><label className="block text-slate-400 text-sm mb-2">Latest News & Updates</label><textarea name="latestNews" value={formData.latestNews} onChange={handleFormChange} rows="2" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="What's happening right now?"/></div>
                <div><label className="block text-slate-400 text-sm mb-2">Contact Email (For Queries)</label><input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleFormChange} className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="club@university.edu"/></div>
                <div><label className="block text-slate-400 text-sm mb-2">Contact Phone Number</label><input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleFormChange} className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" placeholder="+91 XXXXX XXXXX"/></div>
              </div>
            </div>
          ) : (
            
          /* VIEW MODE (What students see) */
            <div className="space-y-8">
              <p className="text-lg text-slate-300">{selectedClub.description || "Description coming soon."}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-blue-400 mb-3">📰 Latest News</h3>
                    <p className="text-slate-300 whitespace-pre-line">{selectedClub.latestNews || "No recent updates."}</p>
                  </div>
                  <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-purple-400 mb-3">🚀 Upcoming Events</h3>
                    <p className="text-slate-300 whitespace-pre-line">{selectedClub.upcomingEvents || "No upcoming events scheduled."}</p>
                  </div>
                  <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-emerald-400 mb-3">🛠️ Past Works</h3>
                    <p className="text-slate-300 whitespace-pre-line">{selectedClub.works || "No projects listed yet."}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-amber-400 mb-3">🏆 Recognitions</h3>
                    <p className="text-slate-300 whitespace-pre-line">{selectedClub.recognitions || "No recognitions added yet."}</p>
                  </div>
                  
                  <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">👥 Club Leadership & Members</h3>
                    <div className="space-y-3">
                      <div><span className="text-slate-400 text-sm">President:</span> <p className="font-medium text-white">{selectedClub.presidentEmail}</p></div>
                      {selectedClub.vicePresident && (<div><span className="text-slate-400 text-sm">Vice President:</span> <p className="font-medium text-white">{selectedClub.vicePresident}</p></div>)}
                      <div>
                        <span className="text-slate-400 text-sm">Members by Year:</span> 
                        <p className="font-medium text-white whitespace-pre-line mt-1">{selectedClub.membersByYear || "Not updated."}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 p-5 rounded-xl border border-blue-900/50">
                    <h3 className="text-lg font-bold text-blue-300 mb-3">📞 Contact Info</h3>
                    <p className="text-slate-300">Email: {selectedClub.contactEmail || "N/A"}</p>
                    <p className="text-slate-300">Phone: {selectedClub.contactPhone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {!isPresident && (
                <button className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-900/20">
                  Apply to Join this Club
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: THE MAIN GRID (LIST OF ALL CLUBS)
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto w-full pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-blue-400 mb-2">Club Explorer</h2>
        <p className="text-slate-400">Discover and join campus organizations that match your goals.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input type="text" placeholder="Search by club name or skill..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500"/>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeFilter === cat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="text-xl font-bold text-slate-300 mb-2">No Clubs Found</h3>
            <p className="text-slate-500">The administration has not established any clubs yet.</p>
          </div>
        ) : filteredClubs.length > 0 ? (
          filteredClubs.map(club => {
            const isPresident = userData?.email === club.presidentEmail;
            return (
              <div key={club.id} className={`bg-slate-900 border ${isPresident ? 'border-emerald-500/50' : 'border-slate-800'} rounded-xl p-6 flex flex-col hover:border-blue-500/50 transition-colors`}>
                <div className="mb-4">
                  <span className="text-xs font-bold tracking-wider text-blue-400 uppercase">{club.category}</span>
                  <h3 className="text-xl font-bold text-slate-100 mt-1">{club.name}</h3>
                </div>
                
                <p className="text-slate-400 text-sm mb-6 flex-1 line-clamp-3">
                  {club.description || <span className="italic opacity-50">Description pending update from the club president.</span>}
                </p>
                
                <button 
                  onClick={() => handleOpenClub(club)} 
                  className={`w-full font-bold py-2 rounded-lg transition-colors border ${isPresident ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500' : 'bg-slate-800 hover:bg-blue-600 text-white border-slate-700 hover:border-blue-500'}`}
                >
                  {isPresident ? '👑 Manage My Club' : 'View Details & Apply'}
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-slate-500">No clubs match your current search filters.</div>
        )}
      </div>
    </div>
  );
}