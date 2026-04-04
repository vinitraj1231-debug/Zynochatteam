import React, { useEffect, useRef, useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Maximize2, 
  Minimize2,
  User,
  Users,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';

interface VideoCallOverlayProps {
  isActive: boolean;
  onLeave: () => void;
  participants: string[];
  currentUser: UserProfile;
  chatName: string;
}

const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({ 
  isActive, 
  onLeave, 
  participants, 
  currentUser,
  chatName
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isActive && !isVideoOff) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive, isVideoOff]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(mediaStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  if (!isActive) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed inset-0 z-[200] bg-gray-900 flex flex-col ${isFullscreen ? 'p-0' : 'p-4 md:p-8'}`}
    >
      {/* Call Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-wa-teal rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-black tracking-tight text-lg">{chatName}</h3>
            <p className="text-wa-green text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-wa-green rounded-full animate-pulse" />
              Active Group Call • {participants.length} Participants
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar p-2">
        {/* Local Participant */}
        <div className="relative aspect-video bg-gray-800 rounded-[2.5rem] overflow-hidden group shadow-2xl ring-1 ring-white/10">
          {isVideoOff ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-500" />
              </div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Your Video is Off</p>
            </div>
          ) : (
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover mirror"
            />
          )}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
            <span className="text-white text-[10px] font-black uppercase tracking-widest">You</span>
            {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
          </div>
        </div>

        {/* Remote Participants (Mocked for UI) */}
        {participants.filter(p => p !== currentUser.uid).map((p, i) => (
          <div key={i} className="relative aspect-video bg-gray-800 rounded-[2.5rem] overflow-hidden group shadow-2xl ring-1 ring-white/10">
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="w-24 h-24 bg-plum-700/20 rounded-full flex items-center justify-center ring-1 ring-plum-500/30">
                <User className="w-12 h-12 text-plum-500" />
              </div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Participant {i + 1}</p>
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
              <span className="text-white text-[10px] font-black uppercase tracking-widest">User {p.slice(0, 4)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Call Controls */}
      <div className="h-32 flex items-center justify-center gap-6 px-8">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-xl ${
            isMuted ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>

        <button 
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-xl ${
            isVideoOff ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isVideoOff ? <VideoOff className="w-7 h-7" /> : <Video className="w-7 h-7" />}
        </button>

        <button 
          onClick={() => setIsSpeakerOff(!isSpeakerOff)}
          className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-xl ${
            isSpeakerOff ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isSpeakerOff ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
        </button>

        <button 
          onClick={onLeave}
          className="w-20 h-20 bg-red-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-red-600/40 hover:scale-110 active:scale-95 transition-all"
        >
          <PhoneOff className="w-9 h-9" />
        </button>
      </div>
    </motion.div>
  );
};

export default VideoCallOverlay;
