"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  ChevronLeft,
  User,
  MessageSquare,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  File as FileIcon,
  Users,
  Shield,
  Ban,
  Trash2,
  Info,
  Globe,
  Lock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '@/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: any;
  type: 'text' | 'image' | 'file' | 'voice';
  status?: 'sent' | 'delivered' | 'read';
}

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
}

export default function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatData, setChatData] = useState<any>(null);
  const [chatType, setChatType] = useState<'private' | 'group'>('private');
  const [loading, setLoading] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chat details
  useEffect(() => {
    if (!chatId || !auth.currentUser) return;

    let unsub: (() => void) | null = null;

    const fetchDetails = async () => {
      try {
        // Try private conversation first
        const convRef = doc(db, 'conversations', chatId);
        const convSnap = await getDoc(convRef);
        
        if (convSnap.exists()) {
          setChatType('private');
          unsub = onSnapshot(convRef, async (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const otherId = data.participantIds.find((id: string) => id !== auth.currentUser?.uid);
              if (otherId) {
                const userSnap = await getDoc(doc(db, 'users', otherId));
                if (userSnap.exists()) {
                  setChatData(userSnap.data());
                }
              }
              // Clear unread
              if (data.unreadCounts?.[auth.currentUser?.uid || ''] > 0) {
                const newUnread = { ...data.unreadCounts };
                newUnread[auth.currentUser?.uid || ''] = 0;
                await updateDoc(convRef, { unreadCounts: newUnread });
              }
            }
          });
        } else {
          // Try group
          const groupRef = doc(db, 'groups', chatId);
          const groupSnap = await getDoc(groupRef);
          if (groupSnap.exists()) {
            setChatType('group');
            unsub = onSnapshot(groupRef, async (snap) => {
              if (snap.exists()) {
                const gData = snap.data();
                setChatData(gData);
                
                // Fetch members
                const memberIds = gData.memberIds || [];
                const members = [];
                for (const uid of memberIds) {
                  const uSnap = await getDoc(doc(db, 'users', uid));
                  if (uSnap.exists()) members.push(uSnap.data());
                }
                setGroupMembers(members);
              }
            });
          }
        }
      } catch (err) {
        console.error("Error fetching chat details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      if (unsub) unsub();
    };
  }, [chatId]);

  // Listen for messages
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      
      // Scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (err) => {
      console.error("Error fetching messages:", err);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Add message
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'User',
        content: messageContent,
        timestamp: serverTimestamp(),
        type: 'text',
        status: 'sent'
      });

      // Update metadata
      if (chatType === 'private') {
        const convRef = doc(db, 'conversations', chatId);
        const convSnap = await getDoc(convRef);
        if (convSnap.exists()) {
          const convData = convSnap.data();
          const otherId = convData.participantIds.find((id: string) => id !== auth.currentUser?.uid);
          const unreadCounts = convData.unreadCounts || {};
          if (otherId) unreadCounts[otherId] = (unreadCounts[otherId] || 0) + 1;

          await updateDoc(convRef, {
            lastMessage: messageContent,
            updatedAt: serverTimestamp(),
            lastMessageTimestamp: serverTimestamp(),
            unreadCounts
          });
        }
      } else {
        const groupRef = doc(db, 'groups', chatId);
        await updateDoc(groupRef, {
          lastMessage: messageContent,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  const handleBanUser = async (userId: string) => {
    if (chatType !== 'group' || !chatData.adminIds.includes(auth.currentUser?.uid)) return;
    try {
      const groupRef = doc(db, 'groups', chatId);
      const newBanned = [...(chatData.bannedUserIds || []), userId];
      const newMembers = chatData.memberIds.filter((id: string) => id !== userId);
      await updateDoc(groupRef, {
        bannedUserIds: newBanned,
        memberIds: newMembers
      });
      setGroupMembers(prev => prev.filter(m => m.uid !== userId));
      setChatData(prev => ({ ...prev, bannedUserIds: newBanned, memberIds: newMembers }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'groups');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsInfoOpen(true)}>
            <div className="relative">
              <div className="w-12 h-12 bg-slate-100 rounded-[1.2rem] flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm">
                {chatData?.photoURL ? (
                  <img src={chatData.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  chatType === 'private' ? <User className="w-6 h-6 text-slate-300" /> : <Users className="w-6 h-6 text-slate-300" />
                )}
              </div>
              {chatType === 'private' && chatData?.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                {chatType === 'private' ? chatData?.displayName || 'User' : chatData?.name || 'Group'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {chatType === 'private' ? (chatData?.isOnline ? 'Online' : 'Offline') : `${chatData?.memberIds?.length || 0} members`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/30"
      >
        {messages.length > 0 ? (
          messages.map((msg, i) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            const showAvatar = i === 0 || messages[i-1].senderId !== msg.senderId;
            
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex items-end gap-3 max-w-[85%] md:max-w-[70%]",
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden">
                    {showAvatar ? (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-[10px] font-black">
                        {msg.senderName.charAt(0)}
                      </div>
                    ) : <div className="w-full h-full" />}
                  </div>
                )}
                
                <div className="space-y-1">
                  <div className={cn(
                    "p-4 rounded-[1.5rem] shadow-sm relative group",
                    isMe 
                      ? "bg-indigo-600 text-white rounded-br-none" 
                      : "bg-white text-slate-900 rounded-bl-none border border-slate-100"
                  )}>
                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                    
                    <div className={cn(
                      "flex items-center gap-1 mt-1 justify-end",
                      isMe ? "text-white/60" : "text-slate-400"
                    )}>
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </span>
                      {isMe && (
                        <CheckCheck className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-indigo-500/5 border border-slate-100 animate-float">
              <MessageSquare className="w-10 h-10 text-indigo-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Say Hello!</h3>
              <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto">
                Start a conversation with {chatData?.displayName}. Your messages are secure and encrypted.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white border-t border-slate-100 pb-24 lg:pb-6">
        <form 
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-2 md:gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100 focus-within:ring-4 focus-within:ring-indigo-500/5 focus-within:border-indigo-200 transition-all"
        >
          <div className="flex items-center gap-1 pl-2">
            <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all">
              <Paperclip className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none py-3 px-2 text-sm font-bold text-slate-900 focus:ring-0 placeholder:text-slate-400"
          />
          
          <div className="flex items-center gap-2 pr-2">
            {newMessage.trim() ? (
              <motion.button 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                type="submit"
                className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            ) : (
              <button type="button" className="w-10 h-10 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-300 transition-all">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>
      {/* Info Sidebar */}
      <AnimatePresence>
        {isInfoOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInfoOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">
                  {chatType === 'private' ? 'User Info' : 'Group Info'}
                </h3>
                <button onClick={() => setIsInfoOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-inner">
                    {chatData?.photoURL ? (
                      <img src={chatData.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      chatType === 'private' ? <User className="w-12 h-12 text-slate-300" /> : <Users className="w-12 h-12 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                      {chatType === 'private' ? chatData?.displayName : chatData?.name}
                    </h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {chatType === 'private' ? `@${chatData?.username}` : chatData?.type}
                    </p>
                  </div>
                </div>

                {chatData?.description && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{chatData.description}</p>
                  </div>
                )}

                {chatType === 'group' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Members ({groupMembers.length})</p>
                    </div>
                    <div className="space-y-2">
                      {groupMembers.map((member) => (
                        <div key={member.uid} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl group/member">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                              {member.photoURL ? (
                                <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{member.displayName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@{member.username}</p>
                            </div>
                          </div>
                          {chatData.adminIds.includes(auth.currentUser?.uid) && member.uid !== auth.currentUser?.uid && (
                            <button 
                              onClick={() => handleBanUser(member.uid)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/member:opacity-100"
                              title="Ban User"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
