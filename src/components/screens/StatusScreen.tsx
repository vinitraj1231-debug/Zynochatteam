import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Camera, 
  MoreVertical, 
  Search,
  User,
  Clock,
  ChevronRight,
  X,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Story, UserProfile } from '../../types';
import { ZynoService } from '../../zynoService';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const StatusScreen: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [statusInput, setStatusInput] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsub = ZynoService.subscribeToStories(setStories);
    if (auth.currentUser) {
      ZynoService.getUserProfile(auth.currentUser.uid).then(setCurrentUser);
    }
    return () => unsub();
  }, []);

  const handleAddStatus = async () => {
    if (!statusInput.trim() || !auth.currentUser) return;
    
    const newStory: Omit<Story, 'id'> = {
      userId: auth.currentUser.uid,
      mediaUrl: `https://picsum.photos/seed/${Math.random()}/1080/1920`, // Placeholder for real upload
      type: 'image',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      viewers: []
    };

    await ZynoService.createStory(newStory);
    setStatusInput('');
    setIsAddingStatus(false);
  };

  const myStories = stories.filter(s => s.userId === auth.currentUser?.uid);
  const otherStories = stories.filter(s => s.userId !== auth.currentUser?.uid);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-charcoal tracking-tighter">Status</h2>
        <div className="flex items-center gap-2">
          <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
            <Search className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* My Status */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <button 
                  onClick={() => setIsAddingStatus(true)}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-wa-green text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="font-black text-charcoal tracking-tight">My Status</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {myStories.length > 0 ? 'Tap to view your updates' : 'Tap to add status update'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="px-6 py-2">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Recent Updates</h4>
          <div className="space-y-4">
            {otherStories.length > 0 ? otherStories.map((story) => (
              <button 
                key={story.id} 
                onClick={() => setSelectedStory(story)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full p-0.5 border-2 border-wa-green">
                    <img 
                      src={story.mediaUrl} 
                      alt="" 
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-charcoal tracking-tight">User {story.userId.slice(0, 5)}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-wa-teal transition-colors" />
              </button>
            )) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No status updates yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Status Modal */}
      <AnimatePresence>
        {isAddingStatus && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
          >
            <div className="p-6 flex items-center justify-between">
              <button onClick={() => setIsAddingStatus(false)} className="p-2 text-white">
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-white font-black uppercase tracking-widest text-xs">New Status</h3>
              <div className="w-10" />
            </div>
            
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-sm aspect-[9/16] bg-gray-800 rounded-[3rem] overflow-hidden relative shadow-2xl ring-1 ring-white/10">
                <img 
                  src={`https://picsum.photos/seed/status/1080/1920`} 
                  className="w-full h-full object-cover opacity-50" 
                  alt=""
                />
                <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/80 to-transparent">
                  <textarea 
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    placeholder="Add a caption..."
                    className="w-full bg-transparent border-none focus:ring-0 text-white font-bold text-lg placeholder:text-white/40 resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="p-8 flex justify-center">
              <button 
                onClick={handleAddStatus}
                className="w-20 h-20 bg-wa-green text-white rounded-full flex items-center justify-center shadow-2xl shadow-wa-green/40 hover:scale-110 active:scale-95 transition-all"
              >
                <Send className="w-8 h-8" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Status Modal */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[110] bg-black flex flex-col"
          >
            <div className="absolute top-0 left-0 right-0 h-1 flex gap-1 p-1 z-20">
              <div className="flex-1 h-full bg-white/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  onAnimationComplete={() => setSelectedStory(null)}
                  className="h-full bg-white"
                />
              </div>
            </div>

            <div className="p-6 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                  <img src={selectedStory.mediaUrl} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">User {selectedStory.userId.slice(0, 5)}</h4>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                    {new Date(selectedStory.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedStory(null)} className="p-2 text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 relative">
              <img 
                src={selectedStory.mediaUrl} 
                className="w-full h-full object-contain" 
                alt=""
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusScreen;
