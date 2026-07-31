import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function Profile({ userData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with whatever data Firebase gave us on login
  const [profileData, setProfileData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    major: userData?.major || '',
    university: userData?.university || '',
    gpaSem1: userData?.gpaSem1 || '',
    gpaSem2: userData?.gpaSem2 || '',
    skills: userData?.skills || '',
    wantToLearn: userData?.wantToLearn || ''
  });

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get the currently logged-in user's unique ID
      const user = auth.currentUser; 
      
      if (user) {
        // Find their specific document in the database
        const userRef = doc(db, "users", user.uid);
        
        // Update the database with the new profile data
        await updateDoc(userRef, profileData);
        
        console.log("Profile successfully updated in the cloud!");
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("There was an error saving your profile. Check the console.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl mt-4 relative">
      
      {/* Profile Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-blue-400">Student Profile</h2>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={isSaving}
          className={`px-6 py-2 rounded-lg font-bold transition disabled:opacity-50 ${
            isEditing ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isSaving ? 'Saving...' : (isEditing ? '💾 Save Profile' : '✏️ Edit Profile')}
        </button>
      </div>

      <div className="space-y-8">
        
        {/* Basic Identity Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
            {isEditing ? (
              <input name="name" value={profileData.name} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500" />
            ) : (
              <p className="text-lg font-medium text-slate-100 bg-slate-800/50 p-3 rounded-lg">{profileData.name || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Account Email</label>
            <p className="text-lg font-medium text-slate-400 bg-slate-800/30 p-3 rounded-lg">{profileData.email}</p> 
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Major / Degree</label>
            {isEditing ? (
              <input name="major" value={profileData.major} onChange={handleChange} placeholder="e.g. B.Tech Computer Science" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500" />
            ) : (
              <p className="text-lg font-medium text-slate-100 bg-slate-800/50 p-3 rounded-lg">{profileData.major || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">University</label>
            {isEditing ? (
              <input name="university" value={profileData.university} onChange={handleChange} placeholder="e.g. MBM University" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500" />
            ) : (
              <p className="text-lg font-medium text-slate-100 bg-slate-800/50 p-3 rounded-lg">{profileData.university || '—'}</p>
            )}
          </div>
        </div>

        {/* Academic Performance (GPA) */}
        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
          <h3 className="text-lg font-bold text-slate-300 mb-4">Academic Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Semester 1 GPA</label>
              {isEditing ? (
                <input name="gpaSem1" value={profileData.gpaSem1} onChange={handleChange} placeholder="e.g. 8.5" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500" />
              ) : (
                <p className="text-lg font-bold text-blue-400 bg-slate-800/80 p-3 rounded-lg text-center">{profileData.gpaSem1 || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Semester 2 GPA</label>
              {isEditing ? (
                <input name="gpaSem2" value={profileData.gpaSem2} onChange={handleChange} placeholder="e.g. 9.0" className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500" />
              ) : (
                <p className="text-lg font-bold text-blue-400 bg-slate-800/80 p-3 rounded-lg text-center">{profileData.gpaSem2 || '—'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Technical Profile (Skills & Goals) */}
        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
          <h3 className="text-lg font-bold text-slate-300 mb-4">Technical Profile</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Current Skills <span className="text-xs opacity-50">(Separate with commas)</span></label>
              {isEditing ? (
                <textarea name="skills" value={profileData.skills} onChange={handleChange} placeholder="React, Python, Data Structures..." className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500" rows="2" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profileData.skills ? profileData.skills.split(',').map((skill, i) => (
                    <span key={i} className="bg-blue-900/40 text-blue-300 px-4 py-1.5 rounded-full text-sm border border-blue-800/50">
                      {skill.trim()}
                    </span>
                  )) : <p className="text-slate-500 italic text-sm">No skills added yet.</p>}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">What I Want to Learn <span className="text-xs opacity-50">(Separate with commas)</span></label>
              {isEditing ? (
                <textarea name="wantToLearn" value={profileData.wantToLearn} onChange={handleChange} placeholder="Machine Learning, Cloud Architecture..." className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-500" rows="2" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profileData.wantToLearn ? profileData.wantToLearn.split(',').map((item, i) => (
                    <span key={i} className="bg-emerald-900/40 text-emerald-300 px-4 py-1.5 rounded-full text-sm border border-emerald-800/50">
                      {item.trim()}
                    </span>
                  )) : <p className="text-slate-500 italic text-sm">No learning goals added yet.</p>}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}