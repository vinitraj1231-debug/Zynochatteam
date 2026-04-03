import React from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Lock, 
  Globe, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Smartphone, 
  Palette, 
  Database, 
  Info,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { UserProfile } from '../../types';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
  user: UserProfile;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate, user }) => {
  const isAdmin = user.role === 'admin';

  const sections = [
    {
      title: 'Account',
      items: [
        { id: 'profile', label: 'Edit Profile', icon: User, color: 'text-blue-600', bg: 'bg-blue-50', action: () => onNavigate('profile') },
        { id: 'privacy', label: 'Privacy & Security', icon: Shield, color: 'text-green-600', bg: 'bg-green-50', action: () => onNavigate('privacy_settings') },
        { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50', action: () => onNavigate('notification_settings') },
      ]
    },
    {
      title: 'Appearance',
      items: [
        { id: 'theme', label: 'Themes & Colors', icon: Palette, color: 'text-purple-600', bg: 'bg-purple-50', action: () => onNavigate('theme_settings') },
        { id: 'chat', label: 'Chat Settings', icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50', action: () => onNavigate('chat_settings') },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'data', label: 'Data & Storage', icon: Database, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { id: 'help', label: 'Help & Support', icon: HelpCircle, color: 'text-plum-600', bg: 'bg-plum-50', action: () => onNavigate('help') },
        { id: 'about', label: 'About Zynochat', icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' },
      ]
    }
  ];

  if (isAdmin) {
    sections.push({
      title: 'Administration',
      items: [
        { id: 'admin', label: 'Admin Console', icon: LayoutDashboard, color: 'text-red-600', bg: 'bg-red-50', action: () => onNavigate('admin') },
      ]
    });
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20 overflow-y-auto custom-scrollbar">
      <div className="p-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-charcoal tracking-tighter">Settings</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage your Zyno experience</p>
        </div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={i} className="space-y-4">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{section.title}</h2>
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                {section.items.map((item, j) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full p-5 flex items-center justify-between group hover:bg-gray-50 transition-colors ${
                        j !== section.items.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-black text-charcoal tracking-tight">{item.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-plum-600 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => signOut(auth)}
          className="w-full bg-red-50 text-red-600 p-6 rounded-[2.5rem] flex items-center justify-between group hover:bg-red-100 transition-all border border-red-100 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <LogOut className="w-6 h-6" />
            </div>
            <span className="font-black tracking-tight">Sign Out</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-300 group-hover:text-red-600 transition-colors" />
        </button>

        <div className="text-center py-6">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Zynochat v1.0.0 • Made with ❤️</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
