import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Users, 
  Megaphone, 
  Bot, 
  MoreVertical, 
  CheckCheck, 
  Clock, 
  UserPlus,
  Hash,
  Lock,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Group, Channel, Message, UserProfile } from '../../types';
import { ZynoService } from '../../zynoService';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

interface ChatsScreenProps {
  onSelectChat: (chat: any) => void;
}

const ChatsScreen: React.FC<ChatsScreenProps> = ({ onSelectChat }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'personal' | 'groups' | 'channels' | 'bots'>('all');
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'group' | 'channel'>('group');

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const unsub = ZynoService.subscribeToUserChats(auth.currentUser.uid, (data) => {
      const combined = [
        ...data.personal.map(p => ({ ...p, type: 'private' })),
        ...data.groups.map(g => ({ ...g, type: 'group' })),
        ...data.channels.map(c => ({ ...c, type: 'channel' }))
      ];
      setChats(combined);
    });

    return () => unsub();
  }, []);

  const filters = [
    { id: 'all', label: 'All', icon: MessageSquare },
    { id: 'personal', label: 'Personal', icon: UserPlus },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'channels', label: 'Channels', icon: Megaphone },
    { id: 'bots', label: 'Bots', icon: Bot },
  ];

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'personal' && chat.type === 'private') ||
                         (activeFilter === 'groups' && chat.type === 'group') ||
                         (activeFilter === 'channels' && chat.type === 'channel');
    return matchesSearch && matchesFilter;
  });

  const [createName, setCreateName] = useState('');
  const [createHandle, setCreateHandle] = useState('');

  const handleCreate = async () => {
    if (!createName.trim() || !createHandle.trim() || !auth.currentUser) return;

    try {
      if (createType === 'group') {
        await ZynoService.createGroup({
          name: createName,
          handle: createHandle,
          description: `Welcome to ${createName}!`,
          type: 'public',
          memberIds: [auth.currentUser.uid],
          adminIds: [auth.currentUser.uid],
          createdAt: Date.now(),
          createdBy: auth.currentUser.uid
        } as any);
      } else {
        await ZynoService.createChannel({
          name: createName,
          handle: createHandle,
          description: `Official channel for ${createName}`,
          type: 'public',
          subscriberIds: [auth.currentUser.uid],
          adminIds: [auth.currentUser.uid],
          viewCount: 0,
          createdAt: Date.now(),
          createdBy: auth.currentUser.uid
        } as any);
      }
      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateHandle('');
    } catch (error) {
      console.error('Error creating:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20 overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-plum-600 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search chats, groups, channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-charcoal focus:ring-2 focus:ring-plum-500/20 focus:bg-white transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isActive ? 'bg-plum-700 text-white shadow-lg shadow-plum-700/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat, index) => (
              <button
                key={chat.id || `chat-${index}`}
                onClick={() => onSelectChat(chat)}
                className="w-full p-4 flex items-center gap-4 hover:bg-white transition-colors group relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-plum-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg ring-1 ring-black/5 ${
                    chat.type === 'group' ? 'bg-indigo-100 text-indigo-600' : 
                    chat.type === 'channel' ? 'bg-orange-100 text-orange-600' : 
                    'bg-plum-100 text-plum-600'
                  }`}>
                    {chat.photoURL ? (
                      <img src={chat.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      chat.type === 'group' ? <Users className="w-7 h-7" /> : 
                      chat.type === 'channel' ? <Megaphone className="w-7 h-7" /> : 
                      <MessageSquare className="w-7 h-7" />
                    )}
                  </div>
                  {chat.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-gray-50" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-charcoal tracking-tight truncate">{chat.name}</h3>
                      {chat.isPrivate ? <Lock className="w-3 h-3 text-gray-400" /> : <Globe className="w-3 h-3 text-gray-400" />}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">12:45 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 truncate pr-4">
                      {chat.lastMessage || 'No messages yet. Start chatting!'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <div className="bg-plum-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-plum-600/20">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center ring-1 ring-black/5">
              <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-charcoal tracking-tight">No chats found</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Start a new conversation or join a group</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsCreateModalOpen(true)}
        className="absolute bottom-24 right-6 w-14 h-14 bg-plum-700 text-white rounded-2xl shadow-2xl shadow-plum-700/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 ring-2 ring-white/20"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[3rem] p-8 relative z-10 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-black text-charcoal tracking-tighter mb-6 text-center">Create New Zyno</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setCreateType('group')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                    createType === 'group' ? 'border-plum-700 bg-plum-50 text-plum-700' : 'border-gray-100 text-gray-400'
                  }`}
                >
                  <Users className="w-8 h-8" />
                  <span className="text-xs font-black uppercase tracking-widest">Group</span>
                </button>
                <button 
                  onClick={() => setCreateType('channel')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                    createType === 'channel' ? 'border-plum-700 bg-plum-50 text-plum-700' : 'border-gray-100 text-gray-400'
                  }`}
                >
                  <Megaphone className="w-8 h-8" />
                  <span className="text-xs font-black uppercase tracking-widest">Channel</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Name</label>
                  <input 
                    type="text" 
                    placeholder={`Enter ${createType} name...`}
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-sm font-bold text-charcoal focus:ring-2 focus:ring-plum-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Username / Handle</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <Hash className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="handle"
                      value={createHandle}
                      onChange={(e) => setCreateHandle(e.target.value)}
                      className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 px-6 text-sm font-bold text-charcoal focus:ring-2 focus:ring-plum-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCreate}
                className="w-full bg-plum-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-plum-700/20 mt-8 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Create {createType}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatsScreen;
