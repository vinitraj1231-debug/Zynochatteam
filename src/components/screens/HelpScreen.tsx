import React, { useState } from 'react';
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageSquare, 
  Book, 
  Shield, 
  ChevronRight, 
  Search, 
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    { q: 'How to create a Zyno Channel?', a: 'Go to the Chats tab, click the "+" button, and select "Channel". Fill in the details and you are ready to broadcast!' },
    { q: 'Is Zynochat secure?', a: 'Yes, Zynochat uses end-to-end encryption for private chats and robust security protocols for groups and channels.' },
    { q: 'How to use Zyno AI?', a: 'You can access Zyno AI from the Home screen or via the dedicated AI tab. Just ask anything!' },
    { q: 'Can I report a user?', a: 'Yes, use the Report feature from the Home screen or within a chat to report any violations.' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Help Header */}
      <header className="h-20 bg-plum-700 text-white flex items-center justify-between px-4 shadow-xl z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
              <HelpCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-black tracking-tight text-lg leading-tight">Help Center</h3>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Support & Documentation</p>
            </div>
          </div>
        </div>
      </header>

      {/* Help Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-plum-600 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-charcoal focus:ring-4 focus:ring-plum-500/20 transition-all shadow-sm placeholder:text-gray-400"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Guides', icon: Book, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Security', icon: Shield, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Community', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Contact', icon: Mail, color: 'text-plum-600', bg: 'bg-plum-50' },
          ].map((item, i) => (
            <button key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center gap-3 group hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-charcoal uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-2 group hover:shadow-md transition-shadow">
                <h4 className="font-black text-charcoal tracking-tight flex items-center justify-between">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-plum-600 transition-colors" />
                </h4>
                <p className="text-xs font-medium text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Banner */}
        <div className="bg-gradient-to-br from-plum-700 to-plum-900 p-8 rounded-[3rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center ring-1 ring-white/30 backdrop-blur-md">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-black text-2xl tracking-tight">Still need help?</h3>
              <p className="text-white/60 text-xs font-medium leading-relaxed">Our support team is available 24/7 to assist you with any issues.</p>
            </div>
            <button className="w-full bg-white text-plum-700 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
              Chat with Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
