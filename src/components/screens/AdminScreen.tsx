import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Users, 
  Flag, 
  HelpCircle, 
  Megaphone, 
  Settings, 
  Shield, 
  ChevronRight, 
  Search, 
  Sparkles,
  ArrowRight,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  Plus,
  Lock,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Report, HelpTicket, Banner } from '../../types';
import { ZynoService } from '../../zynoService';

interface AdminScreenProps {
  onBack: () => void;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports' | 'help' | 'banners'>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tickets, setTickets] = useState<HelpTicket[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  const ADMIN_PIN = '1234'; // In a real app, this would be stored securely or checked server-side

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setPinError(false);
    
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    if (index === 3 && value) {
      const fullPin = newPin.join('');
      if (fullPin === ADMIN_PIN) {
        setIsLocked(false);
      } else {
        setPinError(true);
        setPin(['', '', '', '']);
        document.getElementById('pin-0')?.focus();
      }
    }
  };

  useEffect(() => {
    if (!isLocked) {
      const unsubBanners = ZynoService.subscribeToBanners(setBanners);
      
      if (activeTab === 'users') {
        ZynoService.getAllUsers().then(setUsers);
      } else if (activeTab === 'reports') {
        ZynoService.getAllReports().then(setReports);
      } else if (activeTab === 'help') {
        ZynoService.getAllHelpTickets().then(setTickets);
      }

      return () => unsubBanners();
    }
  }, [isLocked, activeTab]);

  if (isLocked) {
    return (
      <div className="h-full flex flex-col bg-gray-900 items-center justify-center p-8 space-y-12">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-1 ring-white/20 backdrop-blur-md animate-float">
            <Lock className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tighter">Admin Access</h2>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Enter Security PIN</p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {pin.map((digit, i) => (
            <input
              key={i}
              id={`pin-${i}`}
              type="password"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(i, e.target.value)}
              className={`w-14 h-20 bg-white/5 border-2 rounded-2xl text-center text-3xl font-black text-white focus:ring-4 focus:ring-plum-500/20 focus:bg-white/10 transition-all shadow-inner ${
                pinError ? 'border-red-500 animate-shake' : 'border-white/10'
              }`}
            />
          ))}
        </div>

        {pinError && (
          <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Invalid PIN Code</p>
        )}

        <button 
          onClick={onBack}
          className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to App
        </button>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: users.length || '124.5K', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Reports', value: reports.filter(r => r.status === 'pending').length || '12', icon: Flag, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Open Tickets', value: tickets.filter(t => t.status === 'open').length || '45', icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Banners', value: banners.length, icon: Megaphone, color: 'text-plum-600', bg: 'bg-plum-50' },
  ];

  const [isAddBannerModalOpen, setIsAddBannerModalOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', description: '', imageUrl: '', link: '' });

  const handleAddBanner = async () => {
    if (!newBanner.title || !newBanner.imageUrl) return;
    await ZynoService.createBanner({
      ...newBanner,
      isActive: true,
      createdAt: Date.now()
    });
    setIsAddBannerModalOpen(false);
    setNewBanner({ title: '', description: '', imageUrl: '', link: '' });
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      await ZynoService.deleteBanner(id);
    }
  };

  const handleUpdateReportStatus = async (id: string, status: 'reviewed' | 'action_taken') => {
    await ZynoService.updateReportStatus(id, status);
    ZynoService.getAllReports().then(setReports);
  };

  const handleUpdateTicketStatus = async (id: string, status: 'resolved' | 'pending') => {
    await ZynoService.updateHelpTicketStatus(id, status);
    ZynoService.getAllHelpTickets().then(setTickets);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Admin Header */}
      <header className="h-20 bg-gray-900 text-white flex items-center justify-between px-4 shadow-xl z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner ring-1 ring-white/20 backdrop-blur-sm">
              <LayoutDashboard className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-black tracking-tight text-lg leading-tight">Admin Console</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'reports', label: 'Reports', icon: Flag },
          { id: 'help', label: 'Help', icon: HelpCircle },
          { id: 'banners', label: 'Banners', icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isActive ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Admin Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4 group hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-charcoal tracking-tight">{stat.value}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">System Health</h2>
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-charcoal">Firebase Connection</span>
                  <span className="flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-charcoal">Storage Usage</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">1.2 GB / 5 GB</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="w-[24%] h-full bg-plum-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">User Directory</h2>
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              {users.map((user) => (
                <div key={user.uid} className="p-5 flex items-center justify-between border-b border-gray-50 last:border-none group hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 overflow-hidden shadow-inner">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-charcoal tracking-tight">{user.displayName}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">@{user.username} • {user.role}</p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-300 hover:text-plum-700 transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Content Reports</h2>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-charcoal tracking-tight uppercase text-[10px] tracking-widest">{report.reason}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(report.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      report.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {report.status}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">{report.details}</p>
                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateReportStatus(report.id, 'action_taken')}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-700/20"
                      >
                        Action Taken
                      </button>
                      <button 
                        onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                        className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Support Tickets</h2>
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-charcoal tracking-tight">{ticket.title}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ticket #{ticket.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      ticket.status === 'open' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {ticket.status}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">{ticket.description}</p>
                  {ticket.status === 'open' && (
                    <button 
                      onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                      className="w-full py-3 bg-plum-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-plum-700/20"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Banners</h2>
              <button 
                onClick={() => setIsAddBannerModalOpen(true)}
                className="text-[10px] font-black text-plum-600 uppercase tracking-widest flex items-center gap-1"
              >
                Add New <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4 group hover:shadow-md transition-shadow">
                  <div className="h-32 rounded-3xl overflow-hidden relative">
                    <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <button className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/30 transition-colors">
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-3 bg-red-500/20 backdrop-blur-md rounded-2xl text-white hover:bg-red-500/40 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="px-2">
                    <h4 className="font-black text-charcoal tracking-tight">{banner.title}</h4>
                    <p className="text-xs font-medium text-gray-500 line-clamp-1">{banner.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Banner Modal */}
      <AnimatePresence>
        {isAddBannerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddBannerModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[3rem] p-8 relative z-10 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-charcoal tracking-tighter mb-6">Add New Banner</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Title</label>
                  <input 
                    type="text" 
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    placeholder="Banner Title"
                    className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-sm font-bold text-charcoal focus:ring-2 focus:ring-plum-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Description</label>
                  <textarea 
                    value={newBanner.description}
                    onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
                    placeholder="Banner Description"
                    className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-sm font-bold text-charcoal focus:ring-2 focus:ring-plum-500/20 transition-all resize-none"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Image URL</label>
                  <input 
                    type="text" 
                    value={newBanner.imageUrl}
                    onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-sm font-bold text-charcoal focus:ring-2 focus:ring-plum-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Link (Optional)</label>
                  <input 
                    type="text" 
                    value={newBanner.link}
                    onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                    placeholder="/chat/zyno-official"
                    className="w-full bg-gray-100 border-none rounded-2xl py-4 px-6 text-sm font-bold text-charcoal focus:ring-2 focus:ring-plum-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={() => setIsAddBannerModalOpen(false)}
                  className="w-full bg-gray-100 text-gray-500 py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddBanner}
                  className="w-full bg-plum-700 text-white py-4 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-plum-700/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Add Banner
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminScreen;
