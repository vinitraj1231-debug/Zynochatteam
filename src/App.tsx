import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  User, 
  Bell, 
  Home, 
  MessageSquare, 
  Search, 
  Settings, 
  Plus, 
  ArrowLeft, 
  MoreVertical, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  CheckCheck, 
  Clock, 
  Image as ImageIcon, 
  File, 
  Users, 
  Megaphone, 
  Bot, 
  AlertTriangle, 
  HelpCircle, 
  Shield, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ZynoService } from './zynoService';
import { UserProfile, Message, Group, Channel, Story, Post, HelpTicket, Report, Banner } from './types';

// Components
import ZynoHeader from './components/ZynoHeader';
import ZynoBottomNav from './components/ZynoBottomNav';

// Screens
import HomeScreen from './components/screens/HomeScreen';
import ChatsScreen from './components/screens/ChatsScreen';
import SearchScreen from './components/screens/SearchScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import AuthScreen from './components/screens/AuthScreen';
import ChatDetailScreen from './components/screens/ChatDetailScreen';
import AIScreen from './components/screens/AIScreen';
import HelpScreen from './components/screens/HelpScreen';
import ReportScreen from './components/screens/ReportScreen';
import AdminScreen from './components/screens/AdminScreen';
import { 
  PrivacySettingsScreen, 
  NotificationSettingsScreen, 
  ThemeSettingsScreen, 
  ChatSettingsScreen 
} from './components/screens/SettingsSubScreens';

type AppMode = 'main' | 'chat_detail' | 'help' | 'report' | 'ai' | 'admin' | 'auth' | 'profile_view' | 'privacy_settings' | 'notification_settings' | 'theme_settings' | 'chat_settings';
type TabId = 'home' | 'chats' | 'search' | 'profile' | 'settings';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AppMode>('auth');
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const [error, setError] = useState<string | null>(null);

  const initializeUser = async (firebaseUser: any) => {
    try {
      setError(null);
      const profile = await ZynoService.getUserProfile(firebaseUser.uid);
      if (profile) {
        setUser(profile);
        setMode('main');
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Anonymous',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          username: firebaseUser.email?.split('@')[0] || `user_${Math.floor(Math.random() * 10000)}`,
          bio: 'New to Zynochat!',
          role: 'user',
          createdAt: Date.now(),
          isOnline: true,
          lastSeen: Date.now()
        };
        await ZynoService.createUserProfile(newProfile);
        setUser(newProfile);
        setMode('main');
      }
    } catch (err: any) {
      console.error("Error fetching user profile:", err);
      try {
        const errInfo = JSON.parse(err.message);
        if (errInfo.error.includes('offline')) {
          setError("You are currently offline. Please check your connection.");
        } else {
          setError("Failed to load profile. Please try again.");
        }
      } catch {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await initializeUser(firebaseUser);
      } else {
        setUser(null);
        setMode('auth');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = () => {
    if (auth.currentUser) {
      setLoading(true);
      initializeUser(auth.currentUser);
    }
  };

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { isOnline: true });
      
      const handleVisibilityChange = () => {
        updateDoc(userRef, { isOnline: document.visibilityState === 'visible' });
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        updateDoc(userRef, { isOnline: false });
      };
    }
  }, [user]);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  const handleNavigate = (screen: string, data?: any) => {
    if (screen === 'chat_detail') {
      setSelectedChat(data);
      setMode('chat_detail');
    } else if (screen === 'help') {
      setMode('help');
    } else if (screen === 'report') {
      setMode('report');
    } else if (screen === 'ai') {
      setMode('ai');
    } else if (screen === 'privacy_settings') {
      setMode('privacy_settings');
    } else if (screen === 'notification_settings') {
      setMode('notification_settings');
    } else if (screen === 'theme_settings') {
      setMode('theme_settings');
    } else if (screen === 'chat_settings') {
      setMode('chat_settings');
    } else if (screen === 'admin') {
      if (user?.role === 'admin') {
        setMode('admin');
      } else {
        alert("Access Denied: Admin privileges required.");
      }
    } else {
      setMode('main');
      setActiveTab(screen as TabId);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-plum-700/10 animate-pulse overflow-hidden ring-1 ring-black/5">
          <img 
            src="https://ais-pre-jf6oraeqfibrthrnginvim-354886298737.asia-east1.run.app/api/attachments/8pPLC35JiGehVSMet5YkBf1VFDM2/zyno_logo.png" 
            alt="Zyno Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="mt-8 space-y-4 text-center max-w-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-charcoal">ZYNOCHAT</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Initializing Ecosystem...</p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-xs font-medium text-red-600 leading-relaxed">{error}</p>
              </div>
              <button 
                onClick={handleRetry}
                className="w-full py-3 bg-charcoal text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-charcoal/90 transition-colors active:scale-95"
              >
                Retry Connection
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden flex flex-col font-sans antialiased">
      <AnimatePresence mode="wait">
        {mode === 'auth' ? (
          <motion.div 
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            <AuthScreen onSignIn={handleSignIn} />
          </motion.div>
        ) : (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full flex flex-col"
          >
            {mode === 'main' && (
              <>
                <ZynoHeader user={user} onProfileClick={() => setActiveTab('profile')} />
                <main className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    {activeTab === 'home' && (
                      <motion.div key="home" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
                        <HomeScreen onNavigate={handleNavigate} />
                      </motion.div>
                    )}
                    {activeTab === 'chats' && (
                      <motion.div key="chats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
                        <ChatsScreen onSelectChat={(chat) => handleNavigate('chat_detail', chat)} />
                      </motion.div>
                    )}
                    {activeTab === 'search' && (
                      <motion.div key="search" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
                        <SearchScreen onSelectResult={(res) => handleNavigate('chat_detail', res)} />
                      </motion.div>
                    )}
                    {activeTab === 'profile' && user && (
                      <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
                        <ProfileScreen user={user} />
                      </motion.div>
                    )}
                    {activeTab === 'settings' && (
                      <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
                        <SettingsScreen onNavigate={handleNavigate} user={user!} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </main>
                <ZynoBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
              </>
            )}

            {mode === 'chat_detail' && selectedChat && (
              <motion.div key="chat_detail" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <ChatDetailScreen 
                  chat={selectedChat} 
                  onBack={() => setMode('main')} 
                  onNavigateToProfile={async (uid) => {
                    const profile = await ZynoService.getUserProfile(uid);
                    if (profile) {
                      setSelectedProfile(profile);
                      setMode('profile_view');
                    }
                  }}
                />
              </motion.div>
            )}

            {mode === 'profile_view' && selectedProfile && (
              <motion.div key="profile_view" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <div className="h-full w-full bg-white relative">
                  <button 
                    onClick={() => setMode('chat_detail')}
                    className="absolute top-4 left-4 z-50 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-charcoal hover:bg-white transition-all active:scale-90"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <ProfileScreen user={selectedProfile} />
                </div>
              </motion.div>
            )}

            {mode === 'ai' && (
              <motion.div key="ai" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <AIScreen onBack={() => setMode('main')} />
              </motion.div>
            )}

            {mode === 'help' && (
              <motion.div key="help" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <HelpScreen onBack={() => setMode('main')} />
              </motion.div>
            )}

            {mode === 'report' && (
              <motion.div key="report" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <ReportScreen onBack={() => setMode('main')} />
              </motion.div>
            )}

            {mode === 'admin' && (
              <motion.div key="admin" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <AdminScreen onBack={() => setMode('main')} />
              </motion.div>
            )}

            {mode === 'privacy_settings' && user && (
              <motion.div key="privacy" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <PrivacySettingsScreen onBack={() => setMode('main')} user={user} />
              </motion.div>
            )}

            {mode === 'notification_settings' && user && (
              <motion.div key="notifications" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <NotificationSettingsScreen onBack={() => setMode('main')} user={user} />
              </motion.div>
            )}

            {mode === 'theme_settings' && user && (
              <motion.div key="theme" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <ThemeSettingsScreen onBack={() => setMode('main')} user={user} />
              </motion.div>
            )}

            {mode === 'chat_settings' && user && (
              <motion.div key="chat_settings" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 z-[60]">
                <ChatSettingsScreen onBack={() => setMode('main')} user={user} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
