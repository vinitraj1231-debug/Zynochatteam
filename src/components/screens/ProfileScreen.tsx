import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Edit3, 
  Share2, 
  Grid, 
  Clock, 
  Heart, 
  MessageCircle, 
  Eye, 
  Plus, 
  Camera, 
  ChevronRight, 
  Sparkles,
  ArrowLeft,
  LogOut,
  Shield,
  Bell,
  Lock,
  Globe,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Story, Post } from '../../types';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { ZynoService } from '../../zynoService';

interface ProfileScreenProps {
  user: UserProfile;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'stories' | 'saved'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    displayName: user.displayName || '',
    username: user.username || '',
    bio: user.bio || '',
    photoURL: user.photoURL || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [realStats, setRealStats] = useState({ posts: 0, followers: 0, following: 0 });

  useEffect(() => {
    if (user.uid) {
      ZynoService.getUserStats(user.uid).then(setRealStats);
    }
  }, [user.uid, posts.length]);

  useEffect(() => {
    setEditData({
      displayName: user.displayName || '',
      username: user.username || '',
      bio: user.bio || '',
      photoURL: user.photoURL || ''
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user.uid) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await ZynoService.updateProfile(user.uid, editData);
      setSaveStatus('success');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!user.uid) return;
    
    const postsQuery = query(
      collection(db, 'posts'), 
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => doc.data() as Post));
    });

    const storiesQuery = query(
      collection(db, 'stories'), 
      where('authorId', '==', user.uid),
      where('expiresAt', '>', Date.now()),
      orderBy('createdAt', 'desc')
    );
    const unsubStories = onSnapshot(storiesQuery, (snapshot) => {
      setStories(snapshot.docs.map(doc => doc.data() as Story));
    });

    return () => {
      unsubPosts();
      unsubStories();
    };
  }, [user.uid]);

  const stats = [
    { label: 'Posts', value: realStats.posts },
    { label: 'Followers', value: realStats.followers },
    { label: 'Following', value: realStats.following },
  ];

  return (
    <div className="h-full flex flex-col bg-white pb-20 overflow-y-auto custom-scrollbar">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-plum-700 to-plum-900 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <button className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <button className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 -mt-16 relative z-10">
          <div className="flex items-end justify-between mb-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl ring-1 ring-black/5">
                <div className="w-full h-full rounded-[2rem] overflow-hidden bg-gray-100 relative">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 rounded-2xl border-4 border-white shadow-lg" />
            </div>
            
            <div className="flex gap-3 mb-2">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="px-6 py-3 bg-plum-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-plum-700/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Edit Profile
              </button>
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-charcoal tracking-tighter">{user.displayName}</h1>
              {user.role === 'admin' && (
                <div className="bg-plum-50 text-plum-600 p-1 rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">@{user.username}</p>
            <p className="text-sm text-gray-500 font-medium leading-relaxed pt-2 max-w-xs">{user.bio}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-100 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-black text-charcoal tracking-tight">{stat.value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-charcoal tracking-tighter">Edit Profile</h2>
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-[2rem] bg-gray-100 overflow-hidden ring-4 ring-plum-50">
                        {editData.photoURL ? (
                          <img src={editData.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-plum-700 text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Display Name</label>
                      <input 
                        type="text"
                        value={editData.displayName}
                        onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-charcoal focus:ring-2 focus:ring-plum-700/20 transition-all"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                        <input 
                          type="text"
                          value={editData.username}
                          onChange={(e) => setEditData({ ...editData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                          className="w-full pl-10 pr-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-charcoal focus:ring-2 focus:ring-plum-700/20 transition-all"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bio</label>
                      <textarea 
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-charcoal focus:ring-2 focus:ring-plum-700/20 transition-all resize-none h-24"
                        placeholder="Tell us about yourself"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Photo URL</label>
                      <input 
                        type="text"
                        value={editData.photoURL}
                        onChange={(e) => setEditData({ ...editData, photoURL: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-charcoal focus:ring-2 focus:ring-plum-700/20 transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving || saveStatus === 'success'}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 ${
                      saveStatus === 'success' ? 'bg-green-600 text-white shadow-green-700/20' :
                      saveStatus === 'error' ? 'bg-red-600 text-white shadow-red-700/20' :
                      'bg-plum-700 text-white shadow-plum-700/20 hover:scale-[1.02] active:scale-95'
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : saveStatus === 'success' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Profile Updated!
                      </>
                    ) : saveStatus === 'error' ? (
                      <>
                        <X className="w-4 h-4" />
                        Update Failed
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stories Section */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Stories</h2>
          <button className="text-[10px] font-black text-plum-600 uppercase tracking-widest flex items-center gap-1">
            View Archive <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
          <button className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-plum-700 hover:bg-plum-50 transition-all group">
              <Plus className="w-6 h-6 text-gray-300 group-hover:text-plum-700" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add</span>
          </button>
          {stories.map((story) => (
            <button key={story.id} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl p-0.5 ring-2 ring-plum-700 ring-offset-2">
                <img 
                  src={story.contentUrl} 
                  alt="" 
                  className="w-full h-full object-cover rounded-[0.9rem]" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate w-16 text-center">Story</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="px-6">
        <div className="flex items-center gap-8 border-b border-gray-100 mb-6">
          {[
            { id: 'posts', label: 'Posts', icon: Grid },
            { id: 'stories', label: 'Stories', icon: Clock },
            { id: 'saved', label: 'Saved', icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-all relative ${
                  isActive ? 'border-plum-700 text-plum-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm ring-1 ring-black/5">
                <img 
                  src={post.mediaUrls[0]} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1 text-white text-[10px] font-bold">
                    <Heart className="w-3 h-3 fill-white" />
                    {post.likesCount}
                  </div>
                  <div className="flex items-center gap-1 text-white text-[10px] font-bold">
                    <MessageCircle className="w-3 h-3 fill-white" />
                    {post.commentsCount}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-black/5">
                <Grid className="w-8 h-8 text-gray-200" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-charcoal tracking-tight">No posts yet</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Share your first moment with Zynochat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
