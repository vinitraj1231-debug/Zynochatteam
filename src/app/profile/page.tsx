"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  User, 
  MessageSquare, 
  Settings, 
  LayoutDashboard, 
  Bell, 
  Search, 
  Edit3, 
  Camera, 
  Grid, 
  Play, 
  X,
  Check,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, query, collection, where, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'stories'>('posts');
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    username: '',
    bio: '',
    photoURL: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [stats, setStats] = useState({ totalMessages: 0, activeChats: 0 });

  useEffect(() => {
    if (!user?.uid) return;

    // Fetch active chats count
    const chatsQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );
    const unsubChats = onSnapshot(chatsQuery, (snap) => {
      setStats(prev => ({ ...prev, activeChats: snap.size }));
    });

    // Fetch total messages count
    const messagesQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', user.uid)
    );
    const unsubMessages = onSnapshot(messagesQuery, (snap) => {
      setStats(prev => ({ ...prev, totalMessages: snap.size }));
    });

    return () => {
      unsubChats();
      unsubMessages();
    };
  }, [user?.uid]);

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser(data);
            setEditForm({
              displayName: data.displayName || '',
              username: data.username || '',
              bio: data.bio || '',
              photoURL: data.photoURL || ''
            });
          } else {
            router.push('/auth/signup');
          }
          setLoading(false);
        }, (err) => {
          console.error("Error fetching user doc:", err);
          setLoading(false);
        });
      } else {
        if (unsubDoc) {
          unsubDoc();
          unsubDoc = null;
        }
        router.push('/auth/signup');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/signup');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const newUsername = editForm.username.startsWith('@') ? editForm.username.toLowerCase() : `@${editForm.username.toLowerCase()}`;
      const oldUsername = user.username;

      if (newUsername !== oldUsername) {
        // 1. Try to reserve the new username
        try {
          await setDoc(doc(db, 'usernames', newUsername), { uid: user.uid });
        } catch (err: any) {
          if (err.message?.includes('insufficient permissions')) {
            throw new Error('This username is already taken. Please choose another one.');
          }
          throw err;
        }

        // 2. Delete the old username
        try {
          await deleteDoc(doc(db, 'usernames', oldUsername));
        } catch (err) {
          console.error("Error deleting old username:", err);
          // Continue anyway, it's not critical if the old one stays reserved for a bit
        }
      }

      await updateDoc(userRef, {
        ...editForm,
        username: newUsername
      });
      
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveSuccess(false);
      }, 1500);
    } catch (err: any) {
      if (err.message?.includes('already taken')) {
        alert(err.message);
      } else {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="font-black tracking-tight text-slate-900">ZYNOCHAT</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
          >
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <MessageSquare className="w-5 h-5" />
            Messages
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold bg-indigo-50 text-indigo-600 transition-all">
            <User className="w-5 h-5" />
            Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <LayoutDashboard className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-widest">Profile</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-200">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8">
          {/* Profile Header Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="h-32 md:h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
              <button className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-all">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 md:px-12 pb-8 md:pb-12 relative">
              <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12 md:-mt-16 mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2rem] p-1 shadow-xl relative z-10">
                    <div className="w-full h-full bg-slate-100 rounded-[1.8rem] flex items-center justify-center overflow-hidden border border-slate-100">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 md:w-16 md:h-16 text-slate-300" />
                      )}
                    </div>
                  </div>
                  <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-xl shadow-lg z-20 hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{user?.displayName}</h2>
                      <p className="text-sm font-bold text-indigo-600">{user?.username}</p>
                    </div>
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {user?.bio ? (
                  <p className="text-slate-600 font-medium leading-relaxed max-w-2xl">
                    {user.bio}
                  </p>
                ) : (
                  <p className="text-slate-400 italic font-medium">No bio added yet. Tell the world about yourself!</p>
                )}

                <div className="flex items-center gap-8 border-t border-slate-50 pt-6">
                  <div className="text-center md:text-left">
                    <p className="text-xl font-black text-slate-900">{stats.totalMessages}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Messages Sent</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-xl font-black text-slate-900">{stats.activeChats}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Chats</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="space-y-6">
            <div className="flex items-center gap-8 border-b border-slate-200">
              <button 
                onClick={() => setActiveTab('posts')}
                className={cn(
                  "pb-4 text-sm font-black uppercase tracking-widest transition-all relative",
                  activeTab === 'posts' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  Posts
                </div>
                {activeTab === 'posts' && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('stories')}
                className={cn(
                  "pb-4 text-sm font-black uppercase tracking-widest transition-all relative",
                  activeTab === 'stories' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Stories
                </div>
                {activeTab === 'stories' && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />
                )}
              </button>
            </div>

            {/* Grid Content */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center space-y-4 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                {activeTab === 'posts' ? <Grid className="w-10 h-10 text-slate-200" /> : <Play className="w-10 h-10 text-slate-200" />}
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-900 uppercase tracking-widest text-xs">No {activeTab} yet</p>
                <p className="text-xs font-bold text-slate-400">Share your first {activeTab === 'posts' ? 'post' : 'story'} with the world!</p>
              </div>
              <button className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                Create {activeTab === 'posts' ? 'Post' : 'Story'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Edit Profile</h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 md:p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Display Name</label>
                    <input 
                      type="text" 
                      value={editForm.displayName}
                      onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Username</label>
                    <input 
                      type="text" 
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Bio</label>
                    <textarea 
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows={3}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Photo URL</label>
                    <input 
                      type="url" 
                      value={editForm.photoURL}
                      onChange={(e) => setEditForm({...editForm, photoURL: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className={cn(
                    "w-full py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3",
                    saveSuccess 
                      ? "bg-green-500 text-white shadow-green-500/30" 
                      : "bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700 hover:translate-y-[-2px] active:translate-y-[0px]"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving Changes...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-5 h-5" />
                      Profile Updated!
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
