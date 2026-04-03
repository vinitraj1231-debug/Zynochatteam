import React, { useState } from 'react';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Shield, 
  Flag, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  Info,
  Lock,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportScreenProps {
  onBack: () => void;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ onBack }) => {
  const [step, setStep] = useState<'reason' | 'details' | 'success'>('reason');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const reasons = [
    { id: 'spam', label: 'Spam or Misleading', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'harassment', label: 'Harassment or Bullying', icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'hate', label: 'Hate Speech', icon: Flag, color: 'text-plum-600', bg: 'bg-plum-50' },
    { id: 'other', label: 'Other Violations', icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Report Header */}
      <header className="h-20 bg-plum-700 text-white flex items-center justify-between px-4 shadow-xl z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-black tracking-tight text-lg leading-tight">Report Issue</h3>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Safety & Community</p>
            </div>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 'reason' && (
            <motion.div
              key="reason"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-charcoal tracking-tight">What's the issue?</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select the reason for your report</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {reasons.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setReason(item.id);
                      setStep('details');
                    }}
                    className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="font-black text-charcoal tracking-tight">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-plum-600 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.form
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-charcoal tracking-tight">Tell us more</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Provide additional details about the issue</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Description</label>
                <textarea 
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  className="w-full bg-white border-none rounded-[2.5rem] py-6 px-8 text-sm font-bold text-charcoal focus:ring-4 focus:ring-plum-500/20 transition-all shadow-sm min-h-[200px] placeholder:text-gray-400"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-plum-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-plum-700/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Submit Report
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => setStep('reason')}
                className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-plum-700 transition-colors"
              >
                Go Back
              </button>
            </motion.form>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-8"
            >
              <div className="w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center shadow-xl ring-1 ring-green-200 animate-float">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-charcoal tracking-tighter">Report Submitted</h2>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto">Thank you for helping us keep Zynochat safe. Our team will review your report shortly.</p>
              </div>
              <button 
                onClick={onBack}
                className="w-full bg-plum-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-plum-700/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportScreen;
