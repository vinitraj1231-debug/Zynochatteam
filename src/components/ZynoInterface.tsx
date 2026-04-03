import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Hash, 
  Shield, 
  Lock, 
  Globe, 
  Plus, 
  Search, 
  UserPlus, 
  MessageCircle,
  Settings,
  ChevronRight,
  X,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { ZynoService } from '../zynoService';
import { UserProfile, Group, Channel } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface ZynoInterfaceProps {
  onSelectChat: (chat: { id: string; name: string; type: 'group' | 'channel' | 'private' }) => void;
}

export default function ZynoInterface({ onSelectChat }: ZynoInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'channels'>('chats');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'group' | 'channel'>('group');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form state for creation
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [newIsSupergroup, setNewIsSupergroup] = useState(false);
  const [newIsBroadcast, setNewIsBroadcast] = useState(false);

  const [userChats, setUserChats] = useState<{ groups: Group[], channels: Channel[] }>({ groups: [], channels: [] });

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = ZynoService.subscribeToUserChats(auth.currentUser.uid, (chats) => {
      setUserChats(chats);
    });
    return () => unsub();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const q = query(
        collection(db, 'users'), 
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => doc.data() as UserProfile);
      setSearchResults(results.filter(u => u.uid !== auth.currentUser?.uid));
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !auth.currentUser) return;

    const uid = auth.currentUser.uid;
    if (createType === 'group') {
      await ZynoService.createGroup({
        name: newName,
        description: newDesc,
        type: newIsSupergroup ? 'supergroup' : (newIsPrivate ? 'private' : 'public'),
        adminIds: [uid],
        memberIds: [uid],
        createdAt: Date.now(),
        createdBy: uid
      } as any);
    } else {
      await ZynoService.createChannel({
        name: newName,
        description: newDesc,
        type: newIsBroadcast ? 'broadcast' : (newIsPrivate ? 'private' : 'public'),
        adminIds: [uid],
        subscriberIds: [uid],
        createdAt: Date.now(),
        createdBy: uid,
        viewCount: 0
      } as any);
    }

    setIsCreateModalOpen(false);
    setNewName('');
    setNewDesc('');
  };

  return (
    <div className="flex flex-col h-full bg-[#111111]">
      {/* Search Bar */}
      <div className="p-4 border-b border-white/5">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search usernames..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 py-2 gap-2 border-b border-white/5">
        {(['chats', 'groups', 'channels'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
              activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {searchQuery && searchResults.length > 0 && (
          <div className="mb-4">
            <p className="px-3 py-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Search Results</p>
            {searchResults.map(user => (
              <button
                key={user.uid}
                onClick={() => {
                  if (!auth.currentUser) return;
                  const chatId = ZynoService.getPrivateChatId(auth.currentUser.uid, user.uid);
                  onSelectChat({ id: chatId, name: user.username, type: 'private' });
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center ring-1 ring-white/10">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-white">@{user.username}</p>
                  <p className="text-xs text-gray-500">{user.displayName || 'Zyno User'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-blue-400 transition-all" />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <p className="px-3 py-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Your {activeTab}</p>
          
          {activeTab === 'groups' && userChats.groups.map((group, index) => (
            <button
              key={group.id || `group-${index}`}
              onClick={() => onSelectChat({ id: group.id, name: group.name, type: 'group' })}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">{group.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{group.memberIds.length} members</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-blue-400 transition-all" />
            </button>
          ))}

          {activeTab === 'channels' && userChats.channels.map((channel, index) => (
            <button
              key={channel.id || `channel-${index}`}
              onClick={() => onSelectChat({ id: channel.id, name: channel.name, type: 'channel' })}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center ring-1 ring-green-500/20">
                <Radio className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">{channel.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{channel.subscriberIds.length} subscribers</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-green-400 transition-all" />
            </button>
          ))}

          {((activeTab === 'groups' && userChats.groups.length === 0) || 
            (activeTab === 'channels' && userChats.channels.length === 0) ||
            (activeTab === 'chats')) && (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
              <MessageCircle className="w-8 h-8 mb-2 text-gray-600" />
              <p className="text-xs text-gray-500">No {activeTab} yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Button */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span className="text-sm font-bold">Create Zyno Group</span>
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  Create New {createType === 'group' ? 'Group' : 'Channel'}
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setCreateType('group')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${createType === 'group' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                  >
                    Group
                  </button>
                  <button 
                    onClick={() => setCreateType('channel')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${createType === 'channel' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                  >
                    Channel
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Name</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={`Enter ${createType} name...`}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="What is this about?"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none h-24"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setNewIsPrivate(!newIsPrivate)}
                    className="w-full flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${newIsPrivate ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {newIsPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{newIsPrivate ? 'Private' : 'Public'}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                          {newIsPrivate ? 'Only invited members can join' : 'Anyone can find and join'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-all relative ${newIsPrivate ? 'bg-purple-600' : 'bg-gray-700'}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all ${newIsPrivate ? 'right-0.75' : 'left-0.75'}`} />
                    </div>
                  </button>

                  {createType === 'group' ? (
                    <button 
                      onClick={() => setNewIsSupergroup(!newIsSupergroup)}
                      className="w-full flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${newIsSupergroup ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">Supergroup</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Advanced admin controls & large capacity</p>
                        </div>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-all relative ${newIsSupergroup ? 'bg-orange-600' : 'bg-gray-700'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all ${newIsSupergroup ? 'right-0.75' : 'left-0.75'}`} />
                      </div>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setNewIsBroadcast(!newIsBroadcast)}
                      className="w-full flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${newIsBroadcast ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          <Radio className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">Broadcast Channel</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Only admins can post messages</p>
                        </div>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-all relative ${newIsBroadcast ? 'bg-green-600' : 'bg-gray-700'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all ${newIsBroadcast ? 'right-0.75' : 'left-0.75'}`} />
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 bg-black/20 border-t border-white/5 flex gap-3">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Create {createType === 'group' ? 'Group' : 'Channel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
