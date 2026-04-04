import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Users, 
  Bot, 
  Megaphone, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Banner, Story, Channel } from '../../types';
import { ZynoService } from '../../zynoService';
import { auth } from '../../firebase';

interface HomeScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [trendingChannels, setTrendingChannels] = useState<Channel[]>([]);

  useEffect(() => {
    const unsubBanners = ZynoService.subscribeToBanners(setBanners);
    const unsubStories = ZynoService.subscribeToStories(setStories);
    
    ZynoService.getTrendingChannels().then(setTrendingChannels);

    return () => {
      unsubBanners();
      unsubStories();
    };
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const shortcuts = [
    { id: 'help', label: 'Help', icon: HelpCircle, color: 'bg-blue-500', screen: 'help' },
    { id: 'support', label: 'Support', icon: Users, color: 'bg-green-500', screen: 'chat_detail', data: { id: 'support_group', name: 'Zyno Support', type: 'group' } },
    { id: 'ai', label: 'AI Assistant', icon: Bot, color: 'bg-purple-500', screen: 'ai' },
    { id: 'update', label: 'Updates', icon: Megaphone, color: 'bg-orange-500', screen: 'chat_detail', data: { id: 'update_channel', name: 'Zyno Updates', type: 'channel' } },
    { id: 'report', label: 'Report', icon: AlertTriangle, color: 'bg-red-500', screen: 'report' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white pb-20 custom-scrollbar">
      {/* Dynamic Banner Section */}
      <div className="p-6">
        <div className="relative h-56 rounded-[3rem] overflow-hidden shadow-2xl shadow-plum-700/10 bg-plum-900 group">
          <AnimatePresence mode="wait">
            {banners.length > 0 ? (
              <motion.div
                key={banners[currentBannerIndex].id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <img 
                  src={banners[currentBannerIndex].imageUrl} 
                  alt={banners[currentBannerIndex].title}
                  className="w-full h-full object-cover opacity-50 scale-105 group-hover:scale-100 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="px-3 py-1 bg-plum-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full mb-3 inline-block">Featured</span>
                    <h3 className="text-white font-black text-2xl tracking-tighter leading-tight mb-1">{banners[currentBannerIndex].title}</h3>
                    <p className="text-gray-300 text-xs font-bold line-clamp-2 leading-relaxed opacity-80">{banners[currentBannerIndex].description}</p>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md ring-1 ring-white/20">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Zyno Ecosystem</p>
                </div>
              </div>
            )}
          </AnimatePresence>
          
          {banners.length > 1 && (
            <div className="absolute top-6 right-8 flex gap-2">
              {banners.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentBannerIndex(i)}
                  className={`h-1 rounded-full transition-all duration-500 ${i === currentBannerIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stories Section */}
      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Recent Stories</h2>
          <button className="text-[10px] font-black text-plum-600 uppercase tracking-widest">View All</button>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
          <button className="flex-shrink-0 group" onClick={() => onNavigate('profile')}>
            <div className="w-16 h-16 rounded-[1.5rem] bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-plum-500 transition-colors">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-plum-600" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 text-center">Add</p>
          </button>
          {stories.length > 0 ? stories.map((story) => (
            <button key={story.id} className="flex-shrink-0 group">
              <div className="w-16 h-16 rounded-[1.5rem] p-0.5 bg-gradient-to-tr from-plum-600 to-indigo-600 group-hover:rotate-6 transition-transform">
                <div className="w-full h-full rounded-[1.4rem] bg-white p-0.5">
                  <img 
                    src={story.mediaUrl} 
                    alt="" 
                    className="w-full h-full rounded-[1.3rem] object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <p className="text-[10px] font-black text-charcoal uppercase tracking-widest mt-2 text-center truncate w-16">
                {story.userId === auth.currentUser?.uid ? 'You' : 'Story'}
              </p>
            </button>
          )) : (
            <div className="flex items-center px-4">
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest whitespace-nowrap">No stories yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Shortcuts Grid */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Services & Tools</h2>
          <div className="h-[1px] flex-1 bg-gray-100 mx-4" />
        </div>
        <div className="grid grid-cols-4 gap-6">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.screen, item.data)}
                className="flex flex-col items-center gap-3 group"
              >
                <div className={`w-14 h-14 ${item.color} rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-${item.color.split('-')[1]}-500/10 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ring-1 ring-white/20 relative`}>
                  <Icon className="w-7 h-7 text-white" />
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]" />
                </div>
                <span className="text-[10px] font-black text-charcoal/60 uppercase tracking-widest group-hover:text-plum-700 transition-colors">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Discovery Section */}
      <div className="px-6 py-8">
        <div className="bg-gray-900 rounded-[3rem] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-plum-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-plum-500/20 transition-colors duration-700" />
          
          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <h2 className="text-white text-3xl font-black tracking-tighter leading-none">Discover<br />Communities</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Join millions of users worldwide</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {trendingChannels.slice(0, 2).map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => onNavigate('chat_detail', item)}
                  className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shadow-inner">
                      {item.photoURL ? (
                        <img src={item.photoURL} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Megaphone className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{item.name}</h4>
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Trending Community</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </div>
              ))}
            </div>

            <button 
              onClick={() => onNavigate('search')}
              className="w-full bg-white text-gray-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-plum-50 transition-colors"
            >
              Explore All Communities
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trending Channels */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Trending Channels</h2>
          <button className="text-[10px] font-black text-plum-600 uppercase tracking-widest hover:underline">View Ranking</button>
        </div>
        
        <div className="space-y-4">
          {trendingChannels.length > 0 ? trendingChannels.map((channel) => (
            <div 
              key={channel.id} 
              onClick={() => onNavigate('chat_detail', channel)}
              className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-xl hover:shadow-plum-700/5 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-plum-50 text-plum-600 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform overflow-hidden">
                  {channel.photoURL ? (
                    <img src={channel.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Megaphone className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-charcoal tracking-tight text-lg">{channel.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{channel.subscriberIds?.length || 0} Subscribers</p>
                  <p className="text-[10px] font-medium text-gray-500 italic line-clamp-1">{channel.description || 'No description'}</p>
                </div>
              </div>
              <button className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-plum-700 group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )) : (
            <div className="p-8 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No trending channels yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
