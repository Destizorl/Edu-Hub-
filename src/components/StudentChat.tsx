import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage } from '../types';
import { 
  MessageSquare, 
  Search, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  Clock, 
  Check, 
  CheckCheck,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Lock,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Volume2,
  VolumeX,
  FastForward,
  ArrowLeft
} from 'lucide-react';
import { formatAudioDuration, createSyntheticVoiceBlob, generateWaveform } from '../utils/audio';

interface StudentChatProps {
  currentUser: User;
  allUsers: User[];
  messages: ChatMessage[];
  onSendMessage: (
    receiverId: string, 
    content: string, 
    voiceData?: { audioUrl: string; duration: number; waveform: number[] }
  ) => void;
}

// Voice Note Player Component
const VoiceMessagePlayer: React.FC<{
  audioUrl?: string;
  duration?: number;
  waveform?: number[];
  transcript?: string;
  isMe: boolean;
}> = ({ audioUrl, duration = 8, waveform, transcript, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Fallback sound if audioUrl isn't provided
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string>(audioUrl || '');

  useEffect(() => {
    if (!audioUrl) {
      const generated = createSyntheticVoiceBlob(duration);
      setResolvedAudioUrl(generated);
    } else {
      setResolvedAudioUrl(audioUrl);
    }
  }, [audioUrl, duration]);

  const defaultWaveform = waveform && waveform.length > 0 
    ? waveform 
    : [30, 45, 75, 90, 65, 50, 70, 85, 95, 80, 60, 45, 65, 85, 90, 70, 50, 35, 60, 75, 55, 30];

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          updateProgress();
        })
        .catch(() => {
          // If browser autoplay policy or sandbox error, simulate visual playback
          simulatePlayback();
        });
    }
  };

  const simulatePlayback = () => {
    setIsPlaying(true);
    const start = Date.now();
    const totalMs = duration * 1000;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) * playbackRate;
      const progressSec = Math.min(duration, elapsed / 1000);
      setCurrentTime(progressSec);

      if (progressSec >= duration) {
        clearInterval(interval);
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }, 100);
  };

  const updateProgress = () => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrentTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
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
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md ${
          isMe
            ? 'bg-white text-blue-700 hover:bg-slate-100'
            : 'bg-blue-600 text-white hover:bg-blue-500'
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
                      ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                      : 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]'
                    : isMe
                    ? 'bg-blue-300/40'
                    : 'bg-slate-600/60'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono opacity-90 px-0.5">
          <span>{formatAudioDuration(currentTime > 0 ? currentTime : duration)}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className={`px-1.5 py-0.2 rounded font-bold text-[9px] cursor-pointer transition-colors ${
                showTranscript
                  ? 'bg-blue-500 text-white'
                  : isMe
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {showTranscript ? 'Hide Text' : 'Transcript'}
            </button>
            <button
              type="button"
              onClick={toggleSpeed}
              className={`px-1.5 py-0.2 rounded font-bold text-[9px] cursor-pointer transition-colors ${
                playbackRate > 1
                  ? 'bg-amber-400 text-slate-950'
                  : isMe
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>

      {showTranscript && (
        <div className="w-full mt-2 pt-2 border-t border-white/10 text-[11px] italic text-slate-200 leading-snug">
          "{transcript || 'Spoken audio: Reviewing course requirements, agile sprints, and continuous assessment schedules.'}"
        </div>
      )}
    </div>
  );
};

export const StudentChat: React.FC<StudentChatProps> = ({
  currentUser,
  allUsers,
  messages,
  onSendMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [showRepRestrictionModal, setShowRepRestrictionModal] = useState(false);
  const [attemptedLecturerName, setAttemptedLecturerName] = useState('');
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts');

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Course Rep of the class cohort
  const classCourseRep = allUsers.find(
    (u) => u.role === 'student' && u.isCourseRep && u.department === currentUser.department
  );

  // Available students to chat with (excluding oneself)
  const peerStudents = allUsers.filter(
    (u) => u.role === 'student' && u.id !== currentUser.id
  );

  // Available lecturers
  const lecturers = allUsers.filter((u) => u.role === 'lecturer');

  // Selected chat partner
  const [activePartnerId, setActivePartnerId] = useState<string>(
    peerStudents[0]?.id || ''
  );

  const activePartner = allUsers.find((u) => u.id === activePartnerId) || peerStudents[0];

  // Filter messages between current user and active partner
  const conversation = messages.filter(
    (m) =>
      (m.senderId === currentUser.id && m.receiverId === activePartner?.id) ||
      (m.senderId === activePartner?.id && m.receiverId === currentUser.id)
  );

  // Filter student peers by matric number or name
  const filteredStudents = peerStudents.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = s.name.toLowerCase().includes(q);
    const matchMatric = s.matricNumber?.toLowerCase().includes(q);
    return matchName || matchMatric;
  });

  const handleSelectPartner = (targetUser: User) => {
    if (targetUser.role === 'lecturer' && !currentUser.isCourseRep && currentUser.role === 'student') {
      setAttemptedLecturerName(targetUser.name);
      setShowRepRestrictionModal(true);
      return;
    }

    setActivePartnerId(targetUser.id);
    setMobileView('chat');
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activePartner) return;

    onSendMessage(activePartner.id, inputContent.trim());
    setInputContent('');
  };

  // Start Voice Recording
  const startRecording = async () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    // Start timer counter
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Try acquiring real microphone
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start();
      }
    } catch (err) {
      // Sandbox fallback: MediaRecorder may be blocked by iframe permissions policy,
      // fallback smoothly to synthetic voice recording mode!
      console.log('Using synthetic voice recording fallback mode.');
    }
  };

  // Cancel Voice Recording
  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // Finish and Send Voice Recording
  const sendRecording = () => {
    if (!activePartner) return;
    const duration = Math.max(2, recordingSeconds);
    const waveform = generateWaveform(26);

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        let audioUrl = '';
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioUrl = URL.createObjectURL(audioBlob);
        } else {
          audioUrl = createSyntheticVoiceBlob(duration);
        }

        onSendMessage(activePartner.id, `Voice message (${duration}s)`, {
          audioUrl,
          duration,
          waveform,
        });

        setIsRecording(false);
        setRecordingSeconds(0);
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    } else {
      // Fallback synthetic voice blob
      const audioUrl = createSyntheticVoiceBlob(duration);
      onSendMessage(activePartner.id, `Voice message (${duration}s)`, {
        audioUrl,
        duration,
        waveform,
      });

      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Voice & Text Peer Messaging
              </span>
              {currentUser.isCourseRep ? (
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Course Rep Liaison Enabled
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-mono">
                  Matric & Name Search Enabled
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              Student Academic Communication & Voice Messaging
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Exchange text messages and recorded voice notes with fellow students. Official direct messages and voice notes to lecturers are handled exclusively by your appointed Course Representative.
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">Your Identity</div>
            <div className="text-sm font-bold text-white">{currentUser.name}</div>
            <div className="text-xs font-mono text-cyan-300">{currentUser.matricNumber || currentUser.staffId}</div>
          </div>
        </div>
      </div>

      {/* Split Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl liquid-glass overflow-hidden min-h-[580px] border border-slate-800 shadow-xl">
        
        {/* Left Sidebar: Contacts & Search (4 cols) */}
        <div className={`lg:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/50 ${activePartner ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Search Box */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Matric No (CSC/...) or Name..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[520px]">
            
            {/* Lecturer Section */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Course Lecturers</span>
                {!currentUser.isCourseRep && currentUser.role === 'student' && (
                  <span className="text-amber-400 flex items-center gap-1 text-[9px]">
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
                          ? 'bg-blue-600/25 border border-blue-500/40 text-white'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img
                            src={lec.avatar}
                            alt={lec.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover border border-white/15"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1">
                            <span>{lec.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {lec.coursesTaught?.join(', ')}
                          </div>
                        </div>
                      </div>

                      {canMessage ? (
                        <span className="text-[10px] text-amber-300 font-mono px-1.5 py-0.5 rounded bg-amber-500/20">
                          REP
                        </span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Students Section */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Enrolled Peer Students</span>
                <span className="font-mono text-[10px]">{filteredStudents.length} Students</span>
              </div>

              <div className="space-y-1">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No students match "{searchQuery}"
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
                            ? 'bg-blue-600/25 border border-blue-500/40 text-white'
                            : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <img
                              src={std.avatar}
                              alt={std.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-xl object-cover border border-white/15"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                              <span>{std.name}</span>
                              {std.isCourseRep && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Course Rep
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-cyan-300 font-mono">
                              {std.matricNumber}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {std.level}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Chat Viewport (8 cols) */}
        <div className={`lg:col-span-8 flex flex-col bg-slate-900/60 ${activePartner ? 'flex' : 'hidden lg:flex'}`}>
          
          {activePartner ? (
            <>
              {/* Partner Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* Mobile Back Button to Contacts */}
                  <button
                    type="button"
                    onClick={() => setActivePartnerId(null)}
                    className="lg:hidden p-1.5 -ml-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Back to contacts list"
                  >
                    <ArrowLeft className="w-4 h-4 text-indigo-400" />
                  </button>
                  <img
                    src={activePartner.avatar}
                    alt={activePartner.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        {activePartner.name}
                      </h3>
                      {activePartner.matricNumber && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {activePartner.matricNumber}
                        </span>
                      )}
                      {activePartner.isCourseRep && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Course Rep
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {activePartner.department} · {activePartner.level || 'Academic Staff'}
                    </div>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Voice & Text Ready
                  </span>
                </div>
              </div>

              {/* Message Thread History */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[440px]">
                {conversation.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="text-xs">
                      No previous messages with <strong>{activePartner.name}</strong>.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
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
                            className="w-7 h-7 rounded-lg object-cover border border-white/10 mb-1"
                          />
                        )}

                        <div className={`max-w-[82%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 px-1">
                            <span>{msg.senderName}</span>
                            {msg.senderMatric && (
                              <span className="text-cyan-400">({msg.senderMatric})</span>
                            )}
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-lg shadow-blue-600/20'
                                : 'bg-slate-800/90 text-slate-100 rounded-bl-none border border-white/10'
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
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Form / Voice Recording Bar */}
              <div className="p-4 border-t border-white/10 bg-slate-950/50">
                {isRecording ? (
                  /* Active Voice Recording Bar */
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse ml-2" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-rose-300">
                          {formatAudioDuration(recordingSeconds)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                          Recording voice message...
                        </span>
                      </div>

                      {/* Animated Soundwave Visualizer while recording */}
                      <div className="hidden sm:flex items-center gap-1 h-5 ml-2">
                        {[40, 80, 50, 95, 60, 90, 45, 70, 85, 30].map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className="w-[2.5px] rounded-full bg-rose-400 animate-pulse"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Cancel voice recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={sendRecording}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
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
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                    />

                    {/* Microphone Record Button */}
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-white/15 transition-all cursor-pointer"
                      title="Hold / Click to record voice note"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Send Text Button */}
                    <button
                      type="submit"
                      disabled={!inputContent.trim()}
                      className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all cursor-pointer shadow-md shadow-blue-500/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-slate-400 text-xs">
              Select a peer student or course rep from the list to start messaging.
            </div>
          )}

        </div>

      </div>

      {/* Course Rep Restriction Modal */}
      {showRepRestrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl text-slate-100 text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">
              Official Course Representative Policy
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              To prevent lecturer inbox congestion and ensure structured academic governance, direct messages and voice notes to course lecturers (<strong className="text-white">{attemptedLecturerName}</strong>) are restricted to your cohort's appointed Course Representative:
            </p>

            {classCourseRep ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={classCourseRep.avatar}
                    alt={classCourseRep.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-xl object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{classCourseRep.name}</div>
                    <div className="text-[11px] text-amber-300 font-mono">
                      Matric: {classCourseRep.matricNumber} (Course Rep)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRepRestrictionModal(false);
                    setActivePartnerId(classCourseRep.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
                >
                  Message Rep
                </button>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRepRestrictionModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 cursor-pointer"
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
