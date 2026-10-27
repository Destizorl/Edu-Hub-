import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage } from '../types';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Search, 
  Volume2, 
  ShieldAlert, 
  Lock, 
  CheckCheck,
  Sparkles,
  ShieldCheck,
  FileText,
  UserCheck,
  FastForward,
  ArrowLeft
} from 'lucide-react';

interface StudentChatProps {
  currentUser: User;
  allUsers: User[];
  messages: ChatMessage[];
  onSendMessage: (receiverId: string, content: string, voiceData?: { audioUrl: string; duration: number; waveform: number[] }) => void;
}

// Sub-component: Audio message player
const VoiceMessagePlayer: React.FC<{
  audioUrl?: string;
  duration: number;
  waveform?: number[];
  transcript?: string;
  isMe: boolean;
}> = ({ audioUrl, duration, waveform, transcript, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const defaultWaveform = waveform && waveform.length > 0 
    ? waveform 
    : [20, 45, 75, 30, 90, 60, 40, 80, 50, 100, 70, 35, 85, 60, 40, 25];

  const resolvedAudioUrl = audioUrl && audioUrl.length > 10 ? audioUrl : 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        trackProgress();
      }).catch((e) => {
        console.warn('Simulated audio play', e);
        setIsPlaying(true);
        simulatePlayback();
      });
    }
  };

  const simulatePlayback = () => {
    let start = Date.now() - (currentTime * 1000) / playbackRate;
    const interval = setInterval(() => {
      const elapsed = ((Date.now() - start) / 1000) * playbackRate;
      if (elapsed >= duration) {
        clearInterval(interval);
        setIsPlaying(false);
        setCurrentTime(0);
      } else {
        setCurrentTime(elapsed);
      }
    }, 100);
  };

  const trackProgress = () => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(trackProgress);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const toggleSpeed = () => {
    const nextSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 py-1 min-w-[190px] sm:min-w-[240px] max-w-full sm:max-w-[320px]">
      <audio
        ref={audioRef}
        src={resolvedAudioUrl}
        onEnded={handleEnded}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        preload="metadata"
      />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
          isMe
            ? 'bg-slate-950 text-lime-400 hover:bg-slate-900'
            : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform and Progress Bar */}
      <div className="flex-1 flex flex-col justify-center space-y-1">
        <div className="flex items-center gap-[2.5px] h-7 px-1">
          {defaultWaveform.map((amp, idx) => {
            const barPercent = (idx / defaultWaveform.length) * 100;
            const isPlayed = barPercent <= progressPercent;

            return (
              <div
                key={idx}
                style={{ height: `${Math.max(15, amp)}%` }}
                className={`w-[3px] rounded-full transition-colors duration-150 ${
                  isPlayed
                    ? isMe
                      ? 'bg-slate-950'
                      : 'bg-lime-600'
                    : isMe
                    ? 'bg-slate-700/40'
                    : 'bg-slate-300'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono opacity-90 px-0.5">
          <span className="font-bold">{formatAudioDuration(currentTime > 0 ? currentTime : duration)}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className={`px-1.5 py-0.2 rounded font-bold text-[9px] cursor-pointer transition-colors ${
                showTranscript
                  ? 'bg-slate-900 text-white'
                  : isMe
                  ? 'bg-slate-900/10 text-slate-950 hover:bg-slate-900/20'
                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              }`}
            >
              {showTranscript ? 'Hide' : 'Text'}
            </button>
            <button
              type="button"
              onClick={toggleSpeed}
              className={`px-1.5 py-0.2 rounded font-bold text-[9px] cursor-pointer transition-colors ${
                playbackRate > 1
                  ? 'bg-slate-950 text-lime-400'
                  : isMe
                  ? 'bg-slate-900/10 text-slate-950 hover:bg-slate-900/20'
                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              }`}
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>

      {showTranscript && transcript && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 z-20 shadow-md">
          {transcript}
        </div>
      )}
    </div>
  );
};

const formatAudioDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const StudentChat: React.FC<StudentChatProps> = ({
  currentUser,
  allUsers,
  messages,
  onSendMessage,
}) => {
  const [activePartnerId, setActivePartnerId] = useState<string | null>('user-std-2');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showRepRestrictionModal, setShowRepRestrictionModal] = useState(false);
  const [attemptedLecturerName, setAttemptedLecturerName] = useState('');

  const recordingTimerRef = useRef<number | null>(null);

  const students = allUsers.filter((u) => u.role === 'student' && u.id !== currentUser.id);
  const lecturers = allUsers.filter((u) => u.role === 'lecturer');
  const classCourseRep = allUsers.find((u) => u.role === 'student' && u.isCourseRep);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = s.name.toLowerCase().includes(q);
    const matchMatric = s.matricNumber?.toLowerCase().includes(q);
    return matchName || matchMatric;
  });

  const activePartner = allUsers.find((u) => u.id === activePartnerId);

  const conversation = messages.filter(
    (m) =>
      (m.senderId === currentUser.id && m.receiverId === activePartnerId) ||
      (m.senderId === activePartnerId && m.receiverId === currentUser.id)
  );

  const handleSelectPartner = (partner: User) => {
    if (partner.role === 'lecturer') {
      if (!currentUser.isCourseRep && currentUser.role === 'student') {
        setAttemptedLecturerName(partner.name);
        setShowRepRestrictionModal(true);
        return;
      }
    }
    setActivePartnerId(partner.id);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activePartner) return;
    onSendMessage(activePartner.id, inputContent.trim());
    setInputContent('');
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (!activePartner) return;

    const duration = Math.max(3, recordingSeconds);
    const waveform = Array.from({ length: 16 }, () => Math.floor(Math.random() * 70) + 25);
    
    onSendMessage(activePartner.id, `Voice Note (${duration}s)`, {
      audioUrl: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      duration,
      waveform,
    });

    setIsRecording(false);
    setRecordingSeconds(0);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-8 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-lime-100 text-lime-900 border border-lime-300 font-bold">
                Voice & Text Peer Messaging
              </span>
              {currentUser.isCourseRep ? (
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#ccf32f] text-slate-950 border border-lime-400 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-lime-800" /> Course Rep Liaison Enabled
                </span>
              ) : (
                <span className="text-xs text-slate-500 font-mono">
                  Matric & Name Search Enabled
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-lime-700" />
              Student Academic Communication & Voice Messaging
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Exchange text messages and recorded voice notes with fellow students. Official direct messages and voice notes to lecturers are handled exclusively by your appointed Course Representative.
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500">Your Identity</div>
            <div className="text-sm font-bold text-slate-900">{currentUser.name}</div>
            <div className="text-xs font-mono text-lime-800 font-bold">{currentUser.matricNumber || currentUser.staffId}</div>
          </div>
        </div>
      </div>

      {/* Split Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden min-h-[580px]">
        
        {/* Left Sidebar: Contacts & Search (4 cols) */}
        <div className={`lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50 ${activePartner ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Search Box */}
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Matric No (CSC/...) or Name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[520px]">
            
            {/* Lecturer Section */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
                <span>Course Lecturers</span>
                {!currentUser.isCourseRep && currentUser.role === 'student' && (
                  <span className="text-amber-700 flex items-center gap-1 text-[9px] font-bold">
                    <Lock className="w-3 h-3" /> Rep Access Only
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {lecturers.map((lec) => {
                  const isSelected = activePartner?.id === lec.id;
                  const canMessage = currentUser.isCourseRep || currentUser.role !== 'student';

                  return (
                    <button
                      key={lec.id}
                      onClick={() => handleSelectPartner(lec)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#ccf32f]/30 border border-lime-400 text-slate-950 font-bold shadow-2xs'
                          : 'hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img
                            src={lec.avatar}
                            alt={lec.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-lime-500 rounded-full border border-white" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <span>{lec.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {lec.coursesTaught?.join(', ')}
                          </div>
                        </div>
                      </div>

                      {canMessage ? (
                        <span className="text-[10px] text-slate-950 font-mono font-bold px-1.5 py-0.5 rounded bg-[#ccf32f] border border-lime-400">
                          REP
                        </span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Students Section */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
                <span>Enrolled Peer Students</span>
                <span className="font-mono text-[10px]">{filteredStudents.length} Students</span>
              </div>

              <div className="space-y-1">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No students match your query.
                  </div>
                ) : (
                  filteredStudents.map((std) => {
                    const isSelected = activePartner?.id === std.id;
                    return (
                      <button
                        key={std.id}
                        onClick={() => handleSelectPartner(std)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ccf32f]/30 border border-lime-400 text-slate-950 font-bold shadow-2xs'
                            : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <img
                              src={std.avatar}
                              alt={std.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-lime-500 rounded-full border border-white" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                              <span>{std.name}</span>
                              {std.isCourseRep && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                                  REP
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {std.matricNumber}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Chat Viewport (8 cols) */}
        <div className={`lg:col-span-8 flex flex-col bg-white ${activePartner ? 'flex' : 'hidden lg:flex'}`}>
          
          {activePartner ? (
            <>
              {/* Partner Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* Mobile Back Button to Contacts */}
                  <button
                    type="button"
                    onClick={() => setActivePartnerId(null)}
                    className="lg:hidden p-1.5 -ml-1 rounded-xl bg-slate-200 text-slate-800 hover:text-slate-950 transition-colors cursor-pointer"
                    title="Back to contacts list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <img
                    src={activePartner.avatar}
                    alt={activePartner.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        {activePartner.name}
                      </h3>
                      {activePartner.matricNumber && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-lime-100 text-lime-900 border border-lime-300 font-bold">
                          {activePartner.matricNumber}
                        </span>
                      )}
                      {activePartner.isCourseRep && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                          Course Rep
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {activePartner.department} · {activePartner.level || 'Academic Staff'}
                    </div>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-mono text-lime-800 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-lime-500" /> Voice & Text Ready
                  </span>
                </div>
              </div>

              {/* Message Thread History */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[440px]">
                {conversation.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs">
                      No previous messages with <strong>{activePartner.name}</strong>.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Type a message or record a voice note below to start academic collaboration.
                    </p>
                  </div>
                ) : (
                  conversation.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isVoice = msg.messageType === 'voice';

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-lg object-cover border border-slate-200 mb-1"
                          />
                        )}

                        <div className={`max-w-[82%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 px-1">
                            <span>{msg.senderName}</span>
                            {msg.senderMatric && (
                              <span className="text-slate-700">({msg.senderMatric})</span>
                            )}
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-[#ccf32f] text-slate-950 rounded-br-none border border-lime-400 shadow-2xs font-medium'
                                : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                            }`}
                          >
                            {isVoice ? (
                              <VoiceMessagePlayer
                                audioUrl={msg.audioUrl}
                                duration={msg.audioDuration || 8}
                                waveform={msg.waveform}
                                transcript={msg.transcript || msg.content}
                                isMe={isMe}
                              />
                            ) : (
                              msg.content
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 font-mono px-1 flex items-center gap-1 justify-end">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-lime-700" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Form / Voice Recording Bar */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                {isRecording ? (
                  /* Active Voice Recording Bar */
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50 border border-rose-200 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rose-600 animate-pulse ml-2" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-rose-800">
                          {formatAudioDuration(recordingSeconds)}
                        </span>
                        <span className="text-[11px] text-slate-600 font-mono hidden sm:inline">
                          Recording voice message...
                        </span>
                      </div>

                      {/* Animated Soundwave Visualizer while recording */}
                      <div className="hidden sm:flex items-center gap-1 h-5 ml-2">
                        {[40, 80, 50, 95, 60, 90, 45, 70, 85, 30].map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className="w-[2.5px] rounded-full bg-rose-500 animate-pulse"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="p-2 rounded-xl bg-white hover:bg-rose-100 text-slate-700 hover:text-rose-700 transition-colors cursor-pointer border border-slate-200"
                        title="Cancel voice recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={sendRecording}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition-all cursor-pointer"
                        title="Send voice note"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Note</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Text & Mic Input */
                  <form onSubmit={handleSendText} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      placeholder={`Message ${activePartner.name}...`}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-400 transition-colors"
                    />

                    {/* Microphone Record Button */}
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 rounded-xl bg-white hover:bg-lime-50 text-slate-700 hover:text-slate-950 border border-slate-200 hover:border-lime-400 transition-all cursor-pointer"
                      title="Hold / Click to record voice note"
                    >
                      <Mic className="w-4 h-4 text-lime-700" />
                    </button>

                    {/* Send Text Button */}
                    <button
                      type="submit"
                      disabled={!inputContent.trim()}
                      className="p-2.5 rounded-xl bg-[#ccf32f] hover:bg-[#bfe628] disabled:opacity-40 text-slate-950 font-bold border border-lime-400 transition-all cursor-pointer shadow-2xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-slate-500 text-xs">
              Select a peer student or course rep from the list to start messaging.
            </div>
          )}

        </div>

      </div>

      {/* Course Rep Restriction Modal */}
      {showRepRestrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">
              Official Course Representative Policy
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              To prevent lecturer inbox congestion and ensure structured academic governance, direct messages and voice notes to course lecturers (<strong className="text-slate-900">{attemptedLecturerName}</strong>) are restricted to your cohort's appointed Course Representative:
            </p>

            {classCourseRep ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={classCourseRep.avatar}
                    alt={classCourseRep.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{classCourseRep.name}</div>
                    <div className="text-[11px] text-amber-800 font-mono font-semibold">
                      Matric: {classCourseRep.matricNumber} (Course Rep)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRepRestrictionModal(false);
                    setActivePartnerId(classCourseRep.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#ccf32f] text-slate-950 text-xs font-bold border border-lime-400 hover:bg-[#bfe628] cursor-pointer shadow-2xs"
                >
                  Message Rep
                </button>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRepRestrictionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
