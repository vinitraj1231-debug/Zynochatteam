import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  Volume2, 
  Copy, 
  Check, 
  RefreshCw, 
  Globe, 
  Image as ImageIcon,
  Search,
  ChevronRight,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, ChatSession } from '../../types';

interface AIScreenProps {
  onBack: () => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const AIScreen: React.FC<AIScreenProps> = ({ onBack }) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('zyno_ai_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('zyno_ai_current_session_id');
    return saved || null;
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    localStorage.setItem('zyno_ai_sessions', JSON.stringify(sessions));
    if (currentSessionId) localStorage.setItem('zyno_ai_current_session_id', currentSessionId);
  }, [sessions, currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isTyping]);

  useEffect(() => {
    if (sessions.length === 0) createNewSession();
  }, []);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New AI Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleSend = async (overrideInput?: string) => {
    const messageContent = overrideInput || input;
    if (!messageContent.trim() || !currentSessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      chatId: currentSessionId,
      senderId: 'user',
      senderName: 'You',
      content: messageContent,
      timestamp: Date.now(),
      type: 'text'
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const updatedMessages = [...s.messages, userMessage];
        const title = s.messages.length === 0 ? messageContent.slice(0, 30) + (messageContent.length > 30 ? '...' : '') : s.title;
        return { ...s, messages: updatedMessages, title };
      }
      return s;
    }));

    if (!overrideInput) setInput('');
    setIsTyping(true);

    try {
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [...(currentSession?.messages || []).map(m => ({
          role: m.senderId === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })), { role: 'user', parts: [{ text: messageContent }] }],
        config: {
          systemInstruction: "You are Zyno AI, the highly advanced assistant for Zynochat. You provide concise, insightful, and beautifully formatted responses. You aim to be the ultimate super-app companion.",
          tools: useSearch ? [{ googleSearch: {} }] : undefined
        }
      });

      let assistantContent = '';
      const assistantMessageId = crypto.randomUUID();
      let groundingUrls: string[] = [];

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, {
              id: assistantMessageId,
              chatId: currentSessionId,
              senderId: 'assistant',
              senderName: 'Zyno AI',
              content: '',
              timestamp: Date.now(),
              type: 'text'
            }]
          };
        }
        return s;
      }));

      for await (const chunk of response) {
        const text = (chunk as GenerateContentResponse).text;
        const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          groundingUrls = [...groundingUrls, ...chunks.map(c => c.web?.uri).filter(Boolean) as string[]];
        }

        if (text) {
          assistantContent += text;
          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                messages: s.messages.map(m => 
                  m.id === assistantMessageId ? { ...m, content: assistantContent, groundingUrls: [...new Set(groundingUrls)] } : m
                )
              };
            }
            return s;
          }));
        }
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 relative overflow-hidden">
      {/* AI Header */}
      <header className="h-20 bg-purple-700 text-white flex items-center justify-between px-4 shadow-xl z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-black tracking-tight text-lg leading-tight">Zyno AI</h3>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Advanced Intelligence
              </p>
            </div>
          </div>
        </div>
        <button onClick={createNewSession} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {currentSession?.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
            <div className="w-24 h-24 bg-purple-100 rounded-[2.5rem] flex items-center justify-center shadow-xl ring-1 ring-purple-200 animate-float">
              <Bot className="w-12 h-12 text-purple-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-charcoal tracking-tighter">I'm Zyno AI</h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto">Your personal assistant for everything Zynochat</p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
              {["Explain Zynochat features", "Help me create a channel", "What's new in Zyno?"].map((text, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(text)}
                  className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-xs font-black text-charcoal uppercase tracking-widest hover:bg-purple-50 hover:text-purple-700 transition-all text-left flex items-center justify-between group"
                >
                  {text}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-700" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          currentSession?.messages.map((msg, i) => {
            const isMe = msg.senderId === 'user';
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  isMe ? 'bg-gray-900' : 'bg-purple-600'
                }`}>
                  {isMe ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
                </div>
                <div className={`max-w-[85%] space-y-2 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-4 rounded-3xl shadow-sm relative ${
                    isMe 
                      ? 'bg-gray-900 text-white rounded-tr-none' 
                      : 'bg-white text-charcoal rounded-tl-none border border-gray-100'
                  }`}>
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-950 prose-pre:rounded-2xl prose-code:text-purple-400">
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-xl !bg-gray-950 !p-4 !m-0"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="bg-gray-100 px-1.5 py-0.5 rounded-md text-purple-600 font-mono" {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center animate-pulse shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="bg-white border border-gray-100 px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-1 shadow-sm">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Zyno AI anything..."
              className="w-full bg-gray-100 border-none rounded-3xl py-5 pl-6 pr-16 text-sm font-bold text-charcoal focus:ring-4 focus:ring-purple-500/20 focus:bg-white transition-all shadow-inner resize-none min-h-[60px] max-h-32 custom-scrollbar placeholder:text-gray-400"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={`absolute right-3 bottom-3 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
                input.trim() && !isTyping 
                  ? 'bg-purple-700 text-white shadow-purple-700/30 hover:scale-105 active:scale-95' 
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ring-1 ${
                useSearch ? "bg-purple-500/10 text-purple-600 ring-purple-500/30" : "bg-gray-50 text-gray-400 ring-gray-100"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Search {useSearch ? "ON" : "OFF"}
            </button>
            <div className="h-3 w-px bg-gray-200" />
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Zyno Intelligence v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIScreen;
