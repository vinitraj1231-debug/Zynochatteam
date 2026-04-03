import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  MoreVertical, 
  Phone, 
  Video, 
  Send, 
  Plus, 
  Paperclip, 
  Mic, 
  Smile, 
  Check,
  CheckCheck, 
  Clock, 
  Image as ImageIcon, 
  File, 
  User, 
  Users, 
  Megaphone, 
  Search,
  Lock,
  Globe,
  Bot,
  Trash2,
  Shield,
  Settings,
  X,
  UserMinus,
  UserPlus,
  MicOff,
  VideoOff,
  Volume2,
  Edit3,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, UserProfile, Group, Channel, VideoChatState, GroupPermissions } from '../../types';
import { ZynoService } from '../../zynoService';
import { auth, db } from '../../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface ChatDetailScreenProps {
  chat: any;
  onBack: () => void;
  onNavigateToProfile?: (uid: string) => void;
}

const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({ chat, onBack, onNavigateToProfile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [chatData, setChatData] = useState<Group | Channel | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [slowModeCountdown, setSlowModeCountdown] = useState(0);

  const isAdmin = currentUserProfile?.role === 'admin' || chatData?.adminIds?.includes(auth.currentUser?.uid || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat.id || !auth.currentUser) return;
    
    const markAsRead = async () => {
      if (auth.currentUser) {
        await ZynoService.markMessagesAsRead(chat.id, auth.currentUser.uid);
      }
    };

    markAsRead();
  }, [chat.id, messages.length]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      setCurrentUserProfile(doc.data() as UserProfile);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!chat.id || !auth.currentUser) return;
    const collectionName = chat.type === 'group' ? 'groups' : 'channels';
    const unsub = onSnapshot(doc(db, collectionName, chat.id), (doc) => {
      if (doc.exists()) {
        setChatData(doc.data() as any);
      }
    });
    return () => unsub();
  }, [chat.id, chat.type]);

  useEffect(() => {
    if (!chat.id || !auth.currentUser) return;
    
    const checkAccessAndSubscribe = async () => {
      let hasAccess = false;
      if (chat.type === 'private') {
        hasAccess = chat.id.includes(auth.currentUser?.uid || '');
      } else {
        const collectionName = chat.type === 'group' ? 'groups' : 'channels';
        const docRef = doc(db, collectionName, chat.id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const members = chat.type === 'group' ? data.memberIds : data.subscriberIds;
          const isPublic = data.type === 'public' || data.type === 'supergroup' || data.type === 'broadcast';
          hasAccess = members?.includes(auth.currentUser?.uid) || isPublic;
        }
      }

      if (hasAccess || currentUserProfile?.role === 'admin') {
        const unsub = ZynoService.subscribeToMessages(chat.id, setMessages);
        return unsub;
      }
      return () => {};
    };

    let unsubPromise = checkAccessAndSubscribe();
    return () => {
      unsubPromise.then(unsub => unsub());
    };
  }, [chat.id, chat.type, currentUserProfile?.role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (slowModeCountdown > 0) {
      const timer = setTimeout(() => setSlowModeCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [slowModeCountdown]);

  const otherUserId = chat.type === 'private' ? chat.id.split('_').find((id: string) => id !== auth.currentUser?.uid) : null;
  const isBlocked = otherUserId ? currentUserProfile?.blockedUids?.includes(otherUserId) : false;
  const amIBlocked = otherUserId ? currentUserProfile?.blockedByUids?.includes(otherUserId) : false;

  const handleBlock = async () => {
    if (!auth.currentUser || !otherUserId) return;
    if (isBlocked) {
      await ZynoService.unblockUser(auth.currentUser.uid, otherUserId);
    } else {
      await ZynoService.blockUser(auth.currentUser.uid, otherUserId);
    }
    setIsMenuOpen(false);
  };

  const [isMember, setIsMember] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!chat.id || !auth.currentUser) return;
    
    if (chat.type === 'group' || chat.type === 'channel') {
      const collectionName = chat.type === 'group' ? 'groups' : 'channels';
      const unsub = onSnapshot(doc(db, collectionName, chat.id), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const members = chat.type === 'group' ? data.memberIds : data.subscriberIds;
          setIsMember(members?.includes(auth.currentUser?.uid));
        }
      });
      return () => unsub();
    } else {
      setIsMember(true);
    }
  }, [chat.id, chat.type]);

  const handleJoin = async () => {
    if (!auth.currentUser || !chat.id) return;
    setIsJoining(true);
    try {
      if (chat.type === 'group') {
        await ZynoService.joinGroup(chat.id, auth.currentUser.uid);
      } else if (chat.type === 'channel') {
        await ZynoService.joinChannel(chat.id, auth.currentUser.uid);
      }
    } catch (error) {
      console.error('Error joining:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !auth.currentUser || isBlocked || amIBlocked || !isMember) return;

    // Check slow mode
    if (chatData && 'slowMode' in chatData && chatData.slowMode && !isAdmin) {
      const timeSinceLast = (Date.now() - lastMessageTime) / 1000;
      if (timeSinceLast < chatData.slowMode) {
        setSlowModeCountdown(Math.ceil(chatData.slowMode - timeSinceLast));
        return;
      }
    }

    const newMessage: Omit<Message, 'id'> = {
      chatId: chat.id,
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || 'User',
      content: input,
      timestamp: Date.now(),
      type: 'text',
      status: 'sent'
    };

    if (otherUserId) {
      newMessage.recipientId = otherUserId;
    }

    await ZynoService.sendMessage(newMessage);
    setInput('');
    setLastMessageTime(Date.now());
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!auth.currentUser) return;
    await ZynoService.deleteMessage(messageId, auth.currentUser.uid);
  };

  const handleToggleVideoChat = async () => {
    if (!auth.currentUser || !chatData) return;
    const isActive = !chatData.videoChat?.isActive;
    await ZynoService.toggleVideoChat(chat.id, chat.type as any, isActive, auth.currentUser.uid);
  };

  const handleJoinVideoChat = async () => {
    if (!auth.currentUser) return;
    await ZynoService.joinVideoChat(chat.id, chat.type as any, auth.currentUser.uid);
  };

  const handleLeaveVideoChat = async () => {
    if (!auth.currentUser) return;
    await ZynoService.leaveVideoChat(chat.id, chat.type as any, auth.currentUser.uid);
  };

  const canSendMessages = isAdmin || (chatData && 'permissions' in chatData ? chatData.permissions?.canSendMessages : true);

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5] relative overflow-hidden">
      {/* Chat Header */}
      <header className="h-20 bg-plum-700 text-white flex items-center justify-between px-4 shadow-xl z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner ring-1 ring-white/30 backdrop-blur-sm overflow-hidden">
                {chat.photoURL ? (
                  <img src={chat.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  chat.type === 'group' ? <Users className="w-6 h-6" /> : chat.type === 'channel' ? <Megaphone className="w-6 h-6" /> : <User className="w-6 h-6" />
                )}
              </div>
              {chat.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-plum-700 shadow-lg" />
              )}
            </div>
            <div className="flex flex-col">
              <h3 className="font-black tracking-tight text-lg leading-tight">{chat.name}</h3>
              <div className="flex items-center gap-1.5">
                {chat.type === 'private' && <Lock className="w-2.5 h-2.5 text-green-500" />}
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  {chat.type === 'group' ? `${(chatData as Group)?.memberIds?.length || 0} Members` : 
                   chat.type === 'channel' ? `${(chatData as Channel)?.subscriberIds?.length || 0} Subscribers` : 
                   chat.type === 'private' ? 'End-to-End Encrypted' : 'Online'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button 
            onClick={handleToggleVideoChat}
            className={`p-2.5 rounded-xl transition-colors ${chatData?.videoChat?.isActive ? 'bg-green-500 text-white' : 'hover:bg-white/10 text-white'}`}
          >
            <Video className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden z-50"
                >
                  <div className="p-2">
                    <button className="w-full text-left px-4 py-3 text-sm font-bold text-charcoal hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3">
                      <Search className="w-4 h-4 text-gray-400" />
                      Search
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-charcoal hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Settings
                      </button>
                    )}
                    {chat.type === 'private' && (
                      <button 
                        onClick={handleBlock}
                        className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-colors flex items-center gap-3 ${
                          isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                        {isBlocked ? 'Unblock User' : 'Block User'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Video Chat Banner */}
      <AnimatePresence>
        {chatData?.videoChat?.isActive && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-600 text-white px-6 py-3 flex items-center justify-between shadow-lg relative z-40"
          >
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {chatData.videoChat.participants.slice(0, 3).map((p, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-green-600 flex items-center justify-center text-[10px] font-bold">
                    {p.slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {chatData.videoChat.participants.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-green-600 flex items-center justify-center text-[10px] font-bold">
                    +{chatData.videoChat.participants.length - 3}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Video Chat Active</p>
                <p className="text-[10px] font-bold text-white/70">{chatData.videoChat.participants.length} participants</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {chatData.videoChat.participants.includes(auth.currentUser?.uid || '') ? (
                <button 
                  onClick={handleLeaveVideoChat}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                >
                  Leave
                </button>
              ) : (
                <button 
                  onClick={handleJoinVideoChat}
                  className="px-4 py-2 bg-white text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-50 transition-colors"
                >
                  Join
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          if (msg.isDeleted) {
            return (
              <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="px-4 py-2 bg-gray-200/50 rounded-2xl text-[10px] font-bold text-gray-400 italic">
                  This message was deleted
                </div>
              </div>
            );
          }
          return (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div 
                className="w-10 h-10 rounded-2xl bg-white shadow-sm flex-shrink-0 overflow-hidden cursor-pointer ring-1 ring-black/5"
                onClick={() => onNavigateToProfile?.(msg.senderId)}
              >
                {msg.senderPhotoURL ? (
                  <img src={msg.senderPhotoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-plum-50 text-plum-700 font-black text-xs">
                    {msg.senderName?.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && chat.type !== 'private' && (
                  <span 
                    className="text-[10px] font-black text-plum-700 uppercase tracking-widest px-2 mb-1 cursor-pointer hover:underline"
                    onClick={() => onNavigateToProfile?.(msg.senderId)}
                  >
                    {msg.senderName}
                  </span>
                )}
                <div className={`px-4 py-3 rounded-3xl shadow-sm relative group ${
                  isMe 
                    ? 'bg-plum-700 text-white rounded-tr-none shadow-plum-700/20' 
                    : 'bg-white text-charcoal rounded-tl-none border border-gray-100'
                }`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      msg.status === 'read' ? (
                        <CheckCheck className="w-3 h-3 text-blue-400" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-3 h-3 text-white/60" />
                      ) : (
                        <Check className="w-3 h-3 text-white/60" />
                      )
                    )}
                  </div>
                  
                  {/* Message Actions */}
                  {(isMe || isAdmin) && (
                    <button 
                      onClick={() => handleDeleteMessage(msg.id)}
                      className={`absolute top-0 ${isMe ? '-left-10' : '-right-10'} p-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        {!isMember ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">You are not a member of this {chat.type}</p>
            <button 
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full bg-plum-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-plum-700/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isJoining ? 'Joining...' : `Join ${chat.type}`}
            </button>
          </div>
        ) : (isBlocked || amIBlocked) ? (
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
            <p className="text-xs font-black text-red-600 uppercase tracking-widest">
              {isBlocked ? 'You have blocked this user' : 'This user has blocked you'}
            </p>
            {isBlocked && (
              <button 
                onClick={handleBlock}
                className="mt-2 text-[10px] font-black text-red-700 underline uppercase tracking-widest"
              >
                Unblock to send messages
              </button>
            )}
          </div>
        ) : !canSendMessages ? (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Only administrators can send messages
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-2">
            {slowModeCountdown > 0 && (
              <p className="text-[8px] font-black text-plum-600 uppercase tracking-widest text-center animate-pulse">
                Slow mode active: Wait {slowModeCountdown}s
              </p>
            )}
            <div className="flex items-end gap-3">
              <div className="flex-1 bg-gray-100 rounded-[2rem] p-2 flex items-end gap-2 shadow-inner group focus-within:bg-white focus-within:ring-2 focus-within:ring-plum-500/20 transition-all">
                <button type="button" className="p-3 text-gray-400 hover:text-plum-700 transition-colors">
                  <Smile className="w-6 h-6" />
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
                  placeholder={chat.type === 'channel' ? "Broadcast only..." : "Type a message..."}
                  className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-sm font-bold text-charcoal resize-none max-h-32 custom-scrollbar placeholder:text-gray-400 disabled:opacity-50"
                  rows={1}
                />
                <button type="button" className="p-3 text-gray-400 hover:text-plum-700 transition-colors">
                  <Paperclip className="w-6 h-6" />
                </button>
              </div>
              
              <button 
                type="submit"
                disabled={!input.trim() || slowModeCountdown > 0}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
                  input.trim() && slowModeCountdown === 0
                    ? 'bg-plum-700 text-white shadow-plum-700/30 hover:scale-110 active:scale-95' 
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {input.trim() ? <Send className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Advanced Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-plum-50 flex items-center justify-center text-plum-700">
                    <Settings className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-charcoal tracking-tighter">Chat Settings</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage permissions & members</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Info Section */}
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gray-100 overflow-hidden ring-4 ring-plum-50 shadow-xl">
                      {chat.photoURL ? (
                        <img src={chat.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-black text-charcoal tracking-tight">{chat.name}</h3>
                      <p className="text-xs font-medium text-gray-500">@{chat.handle || 'no_handle'}</p>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <>
                    {/* Permissions Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Permissions</h4>
                      <div className="bg-gray-50 rounded-[2rem] p-4 space-y-2">
                        {[
                          { id: 'canSendMessages', label: 'Send Messages', icon: MessageCircle },
                          { id: 'canSendMedia', label: 'Send Media', icon: ImageIcon },
                          { id: 'canAddUsers', label: 'Add Members', icon: UserPlus },
                          { id: 'canPinMessages', label: 'Pin Messages', icon: Paperclip },
                          { id: 'canChangeInfo', label: 'Change Chat Info', icon: Edit3 },
                        ].map((perm) => (
                          <div key={perm.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                              <perm.icon className="w-4 h-4 text-plum-600" />
                              <span className="text-sm font-bold text-charcoal">{perm.label}</span>
                            </div>
                            <button 
                              onClick={async () => {
                                const group = chatData as Group;
                                const currentPerms = group.permissions || {
                                  canSendMessages: true,
                                  canSendMedia: true,
                                  canAddUsers: true,
                                  canPinMessages: true,
                                  canChangeInfo: true
                                };
                                await ZynoService.updateGroupSettings(chat.id, {
                                  permissions: {
                                    ...currentPerms,
                                    [perm.id]: !currentPerms[perm.id as keyof GroupPermissions]
                                  }
                                });
                              }}
                              className={`w-12 h-6 rounded-full transition-colors relative ${
                                (chatData as Group).permissions?.[perm.id as keyof GroupPermissions] !== false ? 'bg-plum-700' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                                (chatData as Group).permissions?.[perm.id as keyof GroupPermissions] !== false ? 'left-7' : 'left-1'
                              }`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Slow Mode Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Slow Mode</h4>
                      <div className="bg-gray-50 rounded-[2rem] p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-charcoal">Message Delay</span>
                          <span className="text-plum-700 font-black text-lg">{(chatData as Group).slowMode || 0}s</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="60" 
                          step="5"
                          value={(chatData as Group).slowMode || 0}
                          onChange={async (e) => {
                            await ZynoService.updateGroupSettings(chat.id, { slowMode: parseInt(e.target.value) });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-plum-700"
                        />
                        <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          <span>Off</span>
                          <span>30s</span>
                          <span>60s</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Members Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Members</h4>
                    <span className="text-[10px] font-black text-plum-600 uppercase tracking-widest">{(chatData as Group).memberIds?.length || (chatData as Channel).subscriberIds?.length || 0} Total</span>
                  </div>
                  <div className="space-y-2">
                    {(chatData as Group).memberIds?.slice(0, 10).map((uid) => (
                      <div key={uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xs font-black text-plum-700 shadow-sm">
                            {uid.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-charcoal">User {uid.slice(0, 5)}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                              {chatData?.adminIds.includes(uid) ? 'Administrator' : 'Member'}
                            </p>
                          </div>
                        </div>
                        {isAdmin && uid !== auth.currentUser?.uid && (
                          <button className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-5 bg-charcoal text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-charcoal/90 transition-all"
                >
                  Close Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatDetailScreen;
