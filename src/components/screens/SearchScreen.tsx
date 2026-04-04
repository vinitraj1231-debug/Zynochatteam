import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Hash, 
  Users, 
  Megaphone, 
  Bot, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  Globe,
  Lock,
  User,
  Plus,
  Check,
  Filter,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ZynoService } from '../../zynoService';

interface SearchScreenProps {
  onSelectResult: (result: any) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectResult }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'groups' | 'channels' | 'bots' | 'users'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    ZynoService.getTrending().then(setTrending);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const searchLower = searchQuery.toLowerCase();
        let allResults: any[] = [];

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;

        const applyDateFilter = (items: any[]) => {
          if (dateFilter === 'all') return items;
          const threshold = dateFilter === 'today' ? now - oneDay : 
                            dateFilter === 'week' ? now - oneWeek : 
                            now - oneMonth;
          return items.filter(item => (item.createdAt || 0) >= threshold);
        };

        // Search Users
        if (activeFilter === 'all' || activeFilter === 'users') {
          const usersRef = collection(db, 'users');
          const snapshot = await getDocs(query(usersRef, limit(100)));
          const filteredUsers = snapshot.docs
            .map(doc => ({ ...doc.data(), type: 'private', id: doc.id }))
            .filter((u: any) => 
              u.username?.toLowerCase().includes(searchLower) || 
              u.displayName?.toLowerCase().includes(searchLower)
            );
          allResults = [...allResults, ...applyDateFilter(filteredUsers)];
        }

        // Search Groups
        if (activeFilter === 'all' || activeFilter === 'groups') {
          const groupsRef = collection(db, 'groups');
          const snapshot = await getDocs(query(groupsRef, limit(100)));
          const filteredGroups = snapshot.docs
            .map(doc => ({ ...doc.data(), type: 'group', id: doc.id }))
            .filter((g: any) => 
              (g.name?.toLowerCase().includes(searchLower) || g.handle?.toLowerCase().includes(searchLower)) &&
              (g.type === 'public' || g.type === 'supergroup' || g.type === 'broadcast' || g.memberIds?.includes(auth.currentUser?.uid))
            );
          allResults = [...allResults, ...applyDateFilter(filteredGroups)];
        }

        // Search Channels
        if (activeFilter === 'all' || activeFilter === 'channels') {
          const channelsRef = collection(db, 'channels');
          const snapshot = await getDocs(query(channelsRef, limit(100)));
          const filteredChannels = snapshot.docs
            .map(doc => ({ ...doc.data(), type: 'channel', id: doc.id }))
            .filter((c: any) => 
              (c.name?.toLowerCase().includes(searchLower) || c.handle?.toLowerCase().includes(searchLower)) &&
              (c.type === 'public' || c.type === 'broadcast' || c.subscriberIds?.includes(auth.currentUser?.uid))
            );
          allResults = [...allResults, ...applyDateFilter(filteredChannels)];
        }

        // Sort by creation date descending
        allResults.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setResults(allResults.slice(0, 20));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeFilter, dateFilter]);

  const handleJoin = async (e: React.MouseEvent, result: any) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    setJoiningId(result.id);
    try {
      if (result.type === 'group') {
        await ZynoService.joinGroup(result.id, auth.currentUser.uid);
      } else if (result.type === 'channel') {
        await ZynoService.joinChannel(result.id, auth.currentUser.uid);
      }
      // Update local state to show joined
      setResults(prev => prev.map(r => {
        if (r.id === result.id) {
          if (r.type === 'group') return { ...r, memberIds: [...(r.memberIds || []), auth.currentUser?.uid] };
          if (r.type === 'channel') return { ...r, subscriberIds: [...(r.subscriberIds || []), auth.currentUser?.uid] };
        }
        return r;
      }));
    } catch (error) {
      console.error('Join error:', error);
    } finally {
      setJoiningId(null);
    }
  };

  const isMember = (result: any) => {
    if (!auth.currentUser) return false;
    if (result.type === 'group') return result.memberIds?.includes(auth.currentUser.uid);
    if (result.type === 'channel') return result.subscriberIds?.includes(auth.currentUser.uid);
    return false;
  };

  const filters = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'users', label: 'Users', icon: User },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'channels', label: 'Channels', icon: Megaphone },
    { id: 'bots', label: 'Bots', icon: Bot },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20 overflow-hidden">
      {/* Search Header */}
      <div className="p-6 bg-white border-b border-gray-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-wa-teal transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search Zyno ecosystem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-charcoal focus:ring-2 focus:ring-wa-teal/20 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-4 rounded-2xl transition-all ${isFilterOpen ? 'bg-wa-teal text-white shadow-lg shadow-wa-teal/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-2">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2">Chat Type</p>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {filters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = activeFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          isActive ? 'bg-wa-teal text-white shadow-lg shadow-wa-teal/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2">Creation Date</p>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'all', label: 'Any Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' },
                  ].map((date) => (
                    <button
                      key={date.id}
                      onClick={() => setDateFilter(date.id as any)}
                      className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        dateFilter === date.id ? 'bg-wa-teal text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {date.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {searchQuery ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                {isSearching ? 'Searching...' : `Found ${results.length} results`}
              </h2>
              {dateFilter !== 'all' && (
                <span className="text-[8px] font-black text-wa-teal uppercase tracking-widest bg-wa-teal/10 px-2 py-1 rounded-full">
                  Filtered by Date
                </span>
              )}
            </div>
            <div className="space-y-3">
              {results.map((result) => (
                <button
                  key={result.id || result.uid}
                  onClick={() => onSelectResult(result)}
                  className="w-full bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl shadow-inner group-hover:bg-wa-teal/10 group-hover:text-wa-teal transition-colors overflow-hidden">
                      {result.photoURL ? (
                        <img src={result.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        result.type === 'group' ? <Users className="w-6 h-6" /> : 
                        result.type === 'channel' ? <Megaphone className="w-6 h-6" /> : 
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-charcoal tracking-tight">{result.name || result.displayName}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          @{result.username || result.handle || 'user'} • {result.type}
                        </p>
                        {result.createdAt && (
                          <span className="text-[8px] font-medium text-gray-300">
                            {new Date(result.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {result.type !== 'private' && (
                      <button
                        onClick={(e) => handleJoin(e, result)}
                        disabled={isMember(result) || joiningId === result.id}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          isMember(result) 
                            ? 'bg-gray-100 text-gray-400' 
                            : 'bg-wa-teal/10 text-wa-teal hover:bg-wa-teal hover:text-white'
                        }`}
                      >
                        {joiningId === result.id ? (
                          <div className="w-3 h-3 border-2 border-wa-teal/30 border-t-wa-teal rounded-full animate-spin" />
                        ) : isMember(result) ? (
                          <div className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Joined
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Plus className="w-3 h-3" />
                            Join
                          </div>
                        )}
                      </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-wa-teal transition-colors" />
                  </div>
                </button>
              ))}
              {!isSearching && results.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No results found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Trending Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <TrendingUp className="w-4 h-4 text-wa-teal" />
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Trending Now</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {trending.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectResult(item)}
                    className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3 group hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg shadow-inner group-hover:bg-wa-teal/10 transition-colors">
                        {item.icon}
                      </div>
                      <div className="bg-wa-teal/10 text-wa-teal text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {item.type}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-charcoal tracking-tight truncate">{item.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.members}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Discover Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-wa-blue" />
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Discover More</h2>
                </div>
                <button className="text-[10px] font-black text-wa-teal uppercase tracking-widest flex items-center gap-1">
                  Explore <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-wa-dark-teal to-wa-teal p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center ring-1 ring-white/30 backdrop-blur-md">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-white font-black text-xl tracking-tight">Zyno Premium</h3>
                    <p className="text-white/60 text-xs font-medium leading-relaxed">Get exclusive access to verified channels, custom themes, and advanced AI features.</p>
                  </div>
                  <button className="w-full bg-white text-wa-dark-teal py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;
