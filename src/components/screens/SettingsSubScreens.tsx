import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Shield, 
  Bell, 
  Palette, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  Moon, 
  Sun, 
  Monitor,
  MessageSquare,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../../types';
import { ZynoService } from '../../zynoService';

interface SubScreenProps {
  onBack: () => void;
  user: UserProfile;
}

export const PrivacySettingsScreen: React.FC<SubScreenProps> = ({ onBack, user }) => {
  const [privacy, setPrivacy] = useState(user.privacy || {
    showProfile: 'all',
    canMessage: 'all',
    showLastSeen: true
  });

  const handleSave = async (updates: any) => {
    const newPrivacy = { ...privacy, ...updates };
    setPrivacy(newPrivacy);
    await ZynoService.updateProfile(user.uid, { privacy: newPrivacy });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black tracking-tight">Privacy & Security</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Who can see my profile</h2>
          <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
            {['all', 'contacts', 'none'].map((option) => (
              <button 
                key={option}
                onClick={() => handleSave({ showProfile: option })}
                className="w-full p-5 flex items-center justify-between hover:bg-white transition-colors border-b border-gray-100 last:border-0"
              >
                <span className="text-sm font-bold capitalize">{option}</span>
                {privacy.showProfile === option && <Check className="w-5 h-5 text-plum-600" />}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Security Options</h2>
          <div className="bg-gray-50 rounded-3xl p-2 border border-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-plum-100 text-plum-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Show Last Seen</p>
                  <p className="text-[10px] text-gray-400 font-medium">Let others see when you were online</p>
                </div>
              </div>
              <button 
                onClick={() => handleSave({ showLastSeen: !privacy.showLastSeen })}
                className={`w-12 h-6 rounded-full transition-all relative ${privacy.showLastSeen ? 'bg-plum-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${privacy.showLastSeen ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export const NotificationSettingsScreen: React.FC<SubScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    messages: true,
    groups: true,
    mentions: true,
    reactions: false
  });

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black tracking-tight">Notifications</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-sm font-bold capitalize">{key} Notifications</span>
            <button 
              onClick={() => setSettings(prev => ({ ...prev, [key]: !value }))}
              className={`w-12 h-6 rounded-full transition-all relative ${value ? 'bg-plum-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ThemeSettingsScreen: React.FC<SubScreenProps> = ({ onBack }) => {
  const [theme, setTheme] = useState('system');

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black tracking-tight">Themes & Colors</h1>
      </div>
      
      <div className="p-6 grid grid-cols-3 gap-4">
        {[
          { id: 'light', icon: Sun, label: 'Light' },
          { id: 'dark', icon: Moon, label: 'Dark' },
          { id: 'system', icon: Monitor, label: 'System' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setTheme(item.id)}
            className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${
              theme === item.id ? 'border-plum-600 bg-plum-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <item.icon className={`w-6 h-6 ${theme === item.id ? 'text-plum-600' : 'text-gray-400'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ChatSettingsScreen: React.FC<SubScreenProps> = ({ onBack }) => {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-6 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black tracking-tight">Chat Settings</h1>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Message Text Size</p>
          <input type="range" className="w-full accent-plum-600" min="12" max="24" defaultValue="16" />
        </div>

        <button className="w-full p-5 flex items-center justify-between bg-red-50 text-red-600 rounded-3xl border border-red-100">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5" />
            <span className="text-sm font-bold">Clear All Chats</span>
          </div>
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
};
