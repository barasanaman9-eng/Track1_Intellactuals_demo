import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Chatbot({ userData }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your CampusConnect AI. How can I help you with your academic or career goals today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to newest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // 1. Build a hidden context string based on their profile
    const profileContext = userData ? `
      [SYSTEM CONTEXT: The user you are talking to is named ${userData.name || 'a student'}. 
      They are a ${userData.year || 'student'} studying ${userData.major || 'their major'}. 
      Their skills are: ${userData.skills || 'Not specified'}. 
      They want to learn: ${userData.wantToLearn || 'Not specified'}. 
      Tailor all advice specifically to this profile.]\n\n
    ` : '';

    // 2. Prepend it to the user's message before sending it to the backend
    const messageToSend = profileContext + userMessage;

    try {
      // ⚠️ UPDATE THIS URL IF YOUR BACKEND RUNS ON A DIFFERENT PORT ⚠️
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Update state with the AI's reply
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply || data.response || "I processed your request, but the response format was unexpected." 
      }]);
      
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I am having trouble connecting to the campus servers right now. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Chat Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
          🤖
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">CampusConnect AI</h2>
          <p className="text-xs text-emerald-400 font-medium">Personalized for {userData?.name?.split(' ')[0] || 'You'}</p>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' 
                : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm shadow-md overflow-x-auto'
            }`}>
              {/* Render Markdown for Assistant, regular text for User */}
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.content}</p>
              ) : (
                <div className="text-sm md:text-base leading-relaxed space-y-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h3]:text-lg [&>h3]:font-bold [&>p]:mb-2">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-4 flex gap-2 items-center">
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="p-4 bg-slate-800/50 border-t border-slate-700">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for course advice, club recommendations, or interview tips..."
            className="flex-1 bg-slate-900 border border-slate-700 text-white p-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold px-6 py-4 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}