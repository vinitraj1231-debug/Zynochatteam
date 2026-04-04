import React from 'react';
import { Sparkles, User, Bell } from 'lucide-react';
import { UserProfile } from '../types';

interface ZynoHeaderProps {
  user: UserProfile | null;
  onProfileClick: () => void;
}

const ZynoHeader: React.FC<ZynoHeaderProps> = ({ user, onProfileClick }) => {
  return (
    <header className="h-16 bg-wa-dark-teal text-white flex items-center justify-between px-4 shadow-lg z-50">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg ring-1 ring-black/5 overflow-hidden">
          <img 
            src="https://ais-pre-jf6oraeqfibrthrnginvim-354886298737.asia-east1.run.app/api/attachments/8pPLC35JiGehVSMet5YkBf1VFDM2/zyno_logo.png" 
            alt="Zyno Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-xl font-black tracking-tighter">ZYNO</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-wa-dark-teal"></span>
        </button>
        <button 
          onClick={onProfileClick}
          className="w-9 h-9 rounded-full bg-white/20 border border-white/30 overflow-hidden hover:scale-105 transition-transform"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}
        </button>
      </div>
    </header>
  );
};

export default ZynoHeader;
