import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, arrayUnion, deleteDoc, query, where } from 'firebase/firestore';

export default function CommunityFeed({ userData }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Post Form State
  const [newPostDomain, setNewPostDomain] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  
  // Comment Form State 
  const [commentInputs, setCommentInputs] = useState({});

  // Edit State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editDomain, setEditDomain] = useState('');
  const [editContent, setEditContent] = useState('');

  // ⚠️ SET YOUR ADMIN EMAIL HERE ⚠️
  const ADMIN_EMAIL = "mayangurj@gmail.com"; 
  const isAdmin = userData?.email === ADMIN_EMAIL;
  const isBlocked = userData?.isBlockedFromFeed || false;

  useEffect(() => {
    fetchPosts();
  }, [userData]);

  const fetchPosts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "communityPosts"));
      let fetchedPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // --- UPGRADED AI MATCHING ALGORITHM ---
      // 1. Combine major, skills, and goals into one giant lowercase string
      const userInterests = `${userData?.major || ''} ${userData?.skills || ''} ${userData?.wantToLearn || ''}`.toLowerCase();
      
      // 2. Split by spaces, commas, or punctuation to get individual keywords
      // Filter out tiny words (like "and", "or", "in") by checking length > 3
      const interestKeywords = userInterests.split(/[\s,.-]+/).filter(k => k.length > 3);

      fetchedPosts = fetchedPosts.map(post => {
        let score = 0;
        const postText = `${post.domain} ${post.content}`.toLowerCase();
        
        // 3. Add points for every keyword match
        interestKeywords.forEach(keyword => {
          if (postText.includes(keyword)) score += 15; // Increased weight for matches!
        });

        // 4. Slight deduction for older posts
        const daysOld = (new Date() - (post.createdAt?.toDate() || new Date())) / (1000 * 60 * 60 * 24);
        score -= daysOld * 0.5;

        return { ...post, matchScore: score };
      });
      // ----------------------------------------

      // Sort by score (highest match score first)
      fetchedPosts.sort((a, b) => b.matchScore - a.matchScore);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostDomain || !newPostContent || isBlocked) return;

    try {
      await addDoc(collection(db, "communityPosts"), {
        authorName: userData?.name || 'Anonymous Student',
        authorEmail: userData?.email || '',
        domain: newPostDomain,
        content: newPostContent,
        comments: [],
        createdAt: serverTimestamp()
      });
      setNewPostDomain('');
      setNewPostContent('');
      fetchPosts();
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };

  const handleAddComment = async (postId, e) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || isBlocked) return;

    try {
      const postRef = doc(db, "communityPosts", postId);
      await updateDoc(postRef, {
        comments: arrayUnion({
          authorName: userData?.name || 'Student',
          text: commentText,
          timestamp: new Date().toISOString()
        })
      });
      setCommentInputs({ ...commentInputs, [postId]: '' });
      fetchPosts();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // --- USER POST CONTROLS ---
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
    try {
      await deleteDoc(doc(db, "communityPosts", postId));
      fetchPosts(); 
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    }
  };

  const startEditing = (post) => {
    setEditingPostId(post.id);
    setEditDomain(post.domain);
    setEditContent(post.content);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditDomain('');
    setEditContent('');
  };

  const handleSaveEdit = async (postId) => {
    if (!editDomain || !editContent) return;
    try {
      const postRef = doc(db, "communityPosts", postId);
      await updateDoc(postRef, {
        domain: editDomain,
        content: editContent,
        isEdited: true 
      });
      setEditingPostId(null);
      fetchPosts(); 
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  // --- ADMIN MODERATION CONTROLS ---
  const issueWarning = async (userEmail) => {
    if (!window.confirm(`Issue an official warning to ${userEmail}?`)) return;
    
    try {
      const q = query(collection(db, "users"), where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDocRef = doc(db, "users", querySnapshot.docs[0].id);
        await updateDoc(userDocRef, {
          warnings: arrayUnion("⚠️ System Notice: A recent post or comment violated community guidelines. Please keep interactions professional.")
        });
        alert(`✅ Successfully issued a warning to ${userEmail}.`);
      } else {
        alert("❌ Error: User not found in database.");
      }
    } catch (error) {
      console.error("Error issuing warning:", error);
    }
  };

  const blockUser = async (userEmail) => {
    if (!window.confirm(`🚨 BLOCK ${userEmail} from posting/commenting?`)) return;
    
    try {
      const q = query(collection(db, "users"), where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDocRef = doc(db, "users", querySnapshot.docs[0].id);
        await updateDoc(userDocRef, {
          isBlockedFromFeed: true
        });
        alert(`🚫 Successfully blocked ${userEmail} from the Community Feed.`);
      } else {
        alert("❌ Error: User not found in database.");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-blue-400 mb-2">Campus Feed</h2>
        <p className="text-slate-400">Share experiences, ask questions, and connect with alumni. Sorted by your goals.</p>
      </div>

      {/* CREATE POST BOX */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        {isBlocked ? (
          <div className="text-center py-6">
            <h3 className="text-xl font-bold text-red-400 mb-2">Account Restricted</h3>
            <p className="text-slate-400">An administrator has blocked your account from participating in the community feed due to a policy violation. You may still use other campus features.</p>
          </div>
        ) : (
          <form onSubmit={handlePostSubmit}>
            <input 
              type="text" required value={newPostDomain} onChange={(e) => setNewPostDomain(e.target.value)}
              placeholder="Topic Domain (e.g., Placement Interview, UI/UX, Study Hacks)" 
              className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-t-lg focus:outline-none focus:border-blue-500 mb-1"
            />
            <textarea 
              required value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your experience or ask the campus a question..." rows="3"
              className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-b-lg focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex justify-end">
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg transition-colors">
                Publish Post
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FEED */}
      {isLoading ? (
        <p className="text-center text-slate-500 animate-pulse mt-12">Curating your personalized feed...</p>
      ) : (
        <div className="space-y-6">
          {posts.map(post => {
            const isAuthor = userData?.email === post.authorEmail && post.authorEmail !== '';

            return (
              <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                
                {/* Post Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-blue-400 uppercase bg-blue-900/30 px-2 py-1 rounded">{post.domain}</span>
                    {post.matchScore > 0 && <span className="ml-2 text-xs text-emerald-400 font-medium">✨ Top Match</span>}
                    {post.isEdited && <span className="ml-2 text-xs text-slate-500 italic">(Edited)</span>}
                    <h3 className="font-bold text-slate-200 mt-3">{post.authorName}</h3>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isAuthor && (
                      <>
                        <button onClick={() => startEditing(post)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded border border-slate-700 transition">Edit</button>
                        <button onClick={() => handleDeletePost(post.id)} className="text-xs bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded border border-red-800/50 transition">Delete</button>
                      </>
                    )}
                    {isAdmin && !isAuthor && (
                      <>
                        <button onClick={() => issueWarning(post.authorEmail)} className="text-xs bg-amber-900/40 hover:bg-amber-600 text-amber-400 hover:text-white px-2 py-1 rounded border border-amber-800 transition">⚠️ Warn</button>
                        <button onClick={() => blockUser(post.authorEmail)} className="text-xs bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white px-2 py-1 rounded border border-red-800 transition">🚫 Block</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Post Content OR Edit Form */}
                {editingPostId === post.id ? (
                  <div className="mb-6 space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <input 
                      type="text" value={editDomain} onChange={(e) => setEditDomain(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none focus:border-emerald-500"
                    />
                    <textarea 
                      value={editContent} onChange={(e) => setEditContent(e.target.value)} rows="3"
                      className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEditing} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded-lg text-sm transition">Cancel</button>
                      <button onClick={() => handleSaveEdit(post.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition">Save Changes</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300 mb-6 whitespace-pre-line">{post.content}</p>
                )}

                {/* Comments Section */}
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-sm font-bold text-slate-400 mb-4">Discussion ({post.comments?.length || 0})</h4>
                  
                  <div className="space-y-4 mb-4">
                    {post.comments?.map((comment, idx) => (
                      <div key={idx} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <span className="font-bold text-slate-300 text-sm">{comment.authorName}</span>
                        <p className="text-slate-400 text-sm mt-1">{comment.text}</p>
                      </div>
                    ))}
                  </div>

                  {!isBlocked && (
                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex gap-2">
                      <input 
                        type="text" placeholder="Write a reply..." 
                        value={commentInputs[post.id] || ''} 
                        onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                        className="flex-1 bg-slate-800 border border-slate-700 text-sm text-white p-2 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <button type="submit" className="bg-slate-700 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                        Reply
                      </button>
                    </form>
                  )}
                </div>

              </div>
            );
          })}
          {posts.length === 0 && <p className="text-center text-slate-500 py-10">No posts yet. Be the first to share!</p>}
        </div>
      )}
    </div>
  );
}