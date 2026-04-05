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
  Users, 
  Globe, 
  Shield, 
  Lock, 
  Moon, 
  HelpCircle, 
  ChevronRight,
  Camera,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import Link from 'next/link';

// Chat Components
import BottomNav, { TabType } from '@/components/chat/BottomNav';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
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
            setUser(docSnap.data());
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chats':
      case 'groups':
      case 'channels':
        return (
          <div className="flex h-full overflow-hidden">
            <div className={cn(
              "flex-shrink-0 h-full transition-all duration-300",
              activeChatId ? "hidden lg:block" : "w-full lg:w-96"
            )}>
              <ChatList 
                type={activeTab as 'chats' | 'groups' | 'channels'} 
                onChatSelect={setActiveChatId} 
                activeChatId={activeChatId || undefined}
              />
            </div>
            <div className={cn(
              "flex-1 h-full",
              !activeChatId ? "hidden lg:flex items-center justify-center bg-slate-50/30" : "block"
            )}>
              {activeChatId ? (
                <ChatWindow chatId={activeChatId} onBack={() => setActiveChatId(null)} />
              ) : (
                <div className="text-center space-y-6 p-8">
                  <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-indigo-500/5 border border-slate-100 mx-auto animate-float">
                    <MessageSquare className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Select a Conversation</h3>
                    <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto">
                      Choose a chat from the list to start messaging. Your conversations are secure and private.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 md:p-8 pb-24 lg:pb-8">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Settings</h2>
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Settings className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'privacy', icon: Shield, label: 'Privacy & Security', desc: 'Manage your security settings', color: 'indigo' },
                  { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Custom alerts and sounds', color: 'purple' },
                  { id: 'appearance', icon: Moon, label: 'Appearance', desc: isDarkMode ? 'Dark Mode On' : 'Light Mode On', color: 'blue', onClick: toggleDarkMode },
                  { id: 'language', icon: Globe, label: 'Language', desc: 'English (US)', color: 'emerald' },
                  { id: 'help', icon: HelpCircle, label: 'Help & Support', desc: 'FAQs and contact us', color: 'amber' },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={item.onClick}
                    className="w-full bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                        `bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110`
                      )}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{item.label}</p>
                        <p className="text-xs font-bold text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-all" />
                  </button>
                ))}
              </div>

              <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 space-y-4">
                <h3 className="text-xs font-black text-red-600 uppercase tracking-widest">Danger Zone</h3>
                <button 
                  onClick={handleLogout}
                  className="w-full bg-white text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm hover:bg-red-600 hover:text-white transition-all border border-red-100"
                >
                  Logout Account
                </button>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 md:p-8 pb-24 lg:pb-8">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                  <button className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-all">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-8 pb-8 relative">
                  <div className="flex items-end gap-6 -mt-12 mb-6">
                    <div className="w-24 h-24 bg-white rounded-[2rem] p-1 shadow-xl relative z-10">
                      <div className="w-full h-full bg-slate-100 rounded-[1.8rem] flex items-center justify-center overflow-hidden border border-slate-100">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-slate-300" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">{user?.displayName}</h2>
                      <p className="text-xs font-bold text-indigo-600">{user?.username}</p>
                    </div>
                    <Link 
                      href="/profile"
                      className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 mb-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      View Full Profile
                    </Link>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-2xl">
                        <p className="text-lg font-black text-slate-900">{stats.totalMessages}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Messages Sent</p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-2xl">
                        <p className="text-lg font-black text-slate-900">{stats.activeChats}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Chats</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-20 xl:w-64 bg-white border-r border-slate-100 flex-col transition-all duration-300">
        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 flex-shrink-0">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="font-black tracking-tight text-slate-900 hidden xl:block">ZYNOCHAT</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-4">
          {[
            { id: 'chats', icon: MessageSquare, label: 'Chats' },
            { id: 'groups', icon: Users, label: 'Groups' },
            { id: 'channels', icon: Globe, label: 'Channels' },
            { id: 'settings', icon: Settings, label: 'Settings' },
            { id: 'profile', icon: User, label: 'Profile' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-[1.5rem] text-sm font-bold transition-all group",
                activeTab === item.id 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              <span className="hidden xl:block uppercase tracking-widest text-[10px] font-black">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-[1.5rem] text-sm font-bold text-red-500 hover:bg-red-50 transition-all group"
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            <span className="hidden xl:block uppercase tracking-widest text-[10px] font-black">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {renderContent()}
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
