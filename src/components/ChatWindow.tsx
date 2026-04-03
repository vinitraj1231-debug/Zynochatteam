import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  ImageIcon, 
  MoreVertical, 
  Phone, 
  Video, 
  Search,
  ArrowLeft,
  Smile,
  Paperclip,
  Mic,
  Shield,
  Info,
  Users,
  Radio,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { ZynoService } from '../zynoService';
import { Message } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatWindowProps {
  chat: { id: string; name: string; type: 'group' | 'channel' | 'private' };
  onBack?: () => void;
}

export default function ChatWindow({ chat, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = ZynoService.subscribeToMessages(chat.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !auth.currentUser) return;

    const user = auth.currentUser;
    await ZynoService.sendMessage({
      chatId: chat.id,
      senderId: user.uid,
      senderName: user.displayName || 'User',
      content: input,
      timestamp: Date.now(),
      type: 'text'
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden">
      {/* Chat Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-[#111111]/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-white/5">
              {chat.type === 'group' ? <Users className="w-6 h-6 text-white" /> : 
               chat.type === 'channel' ? <Radio className="w-6 h-6 text-white" /> : 
               <User className="w-6 h-6 text-white" />}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#111111]" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-white tracking-tight">{chat.name}</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
              {chat.type === 'private' ? 'Online' : '124 members • 12 online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
            <Video className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col max-w-[80%] md:max-w-[70%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {!isMe && chat.type !== 'private' && (
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 ml-2">
                    {msg.senderName}
                  </span>
                )}
                <div className={cn(
                  "px-5 py-3.5 rounded-[1.5rem] text-sm md:text-base shadow-xl relative group",
                  isMe 
                    ? "bg-blue-600 text-white rounded-tr-none ring-1 ring-white/20" 
                    : "bg-[#1a1a1a] text-gray-200 rounded-tl-none ring-1 ring-white/5"
                )}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <div className={cn(
                    "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2",
                    isMe ? "right-full mr-2" : "left-full ml-2"
                  )}>
                    <button className="p-1.5 hover:bg-white/5 rounded-lg text-gray-600 hover:text-white">
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <span className="text-[9px] font-black text-gray-700 uppercase tracking-tighter mt-1.5 px-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gradient-to-t from-[#0a0a0a] to-transparent">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all shadow-2xl">
            <button className="p-3 text-gray-500 hover:text-blue-400 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write a message..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base py-3 px-2 resize-none max-h-32 custom-scrollbar placeholder:text-gray-600"
              rows={1}
            />
            <button className="p-3 text-gray-500 hover:text-blue-400 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "p-4 rounded-full transition-all shadow-xl",
              input.trim() 
                ? "bg-blue-600 text-white shadow-blue-500/30 hover:scale-105 active:scale-95" 
                : "bg-white/5 text-gray-600"
            )}
          >
            {input.trim() ? <Send className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
