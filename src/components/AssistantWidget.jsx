import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, RefreshCw } from 'lucide-react';

export default function AssistantWidget({ token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'I am here to help you navigate the AI Innovation Hub. I can suggest tools based on your role, field, or target difficulty, or tell you about upcoming workshops.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput('');
    
    const userMsg = { id: Date.now(), sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:5000/api/assistant', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: messageText })
      });

      const data = await res.json();
      
      const assistantMsg = { 
        id: Date.now() + 1, 
        sender: 'assistant', 
        text: data.reply || 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: 'Connection failed. Please ensure the backend server is running on port 5000.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Which tools can help with marketing?',
    'Show beginner-friendly tools for content creation.',
    'Are there any upcoming AI events?',
    'What tools are used in software development?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-primary-sky to-primary-secondary rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform duration-200 cursor-pointer text-white"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="w-[380px] h-[550px] rounded-2xl shadow-2xl bg-dark-bg-medium border border-white/8 overflow-hidden flex flex-col glass-panel">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-sky to-primary-secondary p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <h3 className="text-sm font-bold tracking-wider uppercase">AI Support Assistant</h3>
                <span className="text-[10px] opacity-75">Online Support Node</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:opacity-75 transition-opacity cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-primary-secondary text-white rounded-br-none'
                      : 'bg-white/5 text-neutral-light rounded-bl-none border border-white/8'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl rounded-bl-none px-4 py-3 border border-white/8 flex items-center gap-1.5 text-xs text-neutral-medium">
                  <RefreshCw className="animate-spin" size={12} />
                  Evaluating query...
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-white/8 bg-dark-bg-dark/60">
              <p className="text-[10px] uppercase font-bold opacity-50 mb-1.5">Common Queries</p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(qp)}
                    className="text-[10px] text-left px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/8 cursor-pointer max-w-full truncate text-neutral-light"
                  >
                    {qp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-neutral-medium/10 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Ask a question about tools or events..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-white/5 outline-none border border-white/10 focus:border-primary-sky rounded-xl px-4 py-2 text-xs text-neutral-light"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="w-9 h-9 bg-primary-secondary hover:bg-brand-sec-medium text-white flex items-center justify-center rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
