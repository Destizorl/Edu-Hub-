import React, { useState } from 'react';
import { User, Announcement, NotificationLog } from '../types';
import { 
  Building2, 
  Send, 
  Users, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  ShieldCheck,
  Search,
  Layers,
  History
} from 'lucide-react';

interface RegistrarDashboardProps {
  currentUser: User;
  onSendAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>) => void;
  allUsers: User[];
  announcements: Announcement[];
  notificationLogs: NotificationLog[];
}

export const RegistrarDashboard: React.FC<RegistrarDashboardProps> = ({
  currentUser,
  onSendAnnouncement,
  allUsers,
  announcements,
  notificationLogs,
}) => {
  const [targetScope, setTargetScope] = useState<'all' | 'faculty_level'>('all');
  const [selectedFaculty, setSelectedFaculty] = useState('Faculty of Science');
  const [selectedLevel, setSelectedLevel] = useState('300L');
  const [circularTitle, setCircularTitle] = useState('');
  const [circularContent, setCircularContent] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'high' | 'urgent'>('high');
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [attachmentName, setAttachmentName] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const faculties = [
    'Faculty of Science',
    'Faculty of Engineering',
    'Faculty of Medical Sciences',
    'Faculty of Law',
    'Faculty of Social Sciences',
    'Faculty of Environmental Studies',
  ];

  const levels = ['100L', '200L', '300L', '400L', '500L'];

  // Calculate target recipients count
  const allStudents = allUsers.filter((u) => u.role === 'student');
  const targetedStudents = allStudents.filter((s) => {
    if (targetScope === 'all') return true;
    if (s.faculty !== selectedFaculty) return false;
    if (selectedLevel !== 'all' && s.level !== selectedLevel) return false;
    return true;
  });

  const handlePublishCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circularTitle.trim() || !circularContent.trim()) return;

    onSendAnnouncement({
      title: circularTitle,
      content: circularContent,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: 'registrar',
      authorTitle: 'Registrar & Academic Affairs',
      category: 'circular',
      target: targetScope === 'all' 
        ? { type: 'all' } 
        : { type: 'faculty', faculty: selectedFaculty, level: selectedLevel },
      urgency,
      attachments: attachmentName 
        ? [{ name: attachmentName, size: '1.8 MB', type: 'application/pdf' }] 
        : [{ name: 'Official_Senate_Gazette.pdf', size: '1.2 MB', type: 'application/pdf' }],
      channels: {
        inApp: true,
        smsSent: sendSms,
        emailSent: sendEmail,
      },
    });

    const targetDesc = targetScope === 'all' 
      ? 'Entire Student Body' 
      : `${selectedFaculty} (${selectedLevel})`;

    setSuccessMessage(`Official Circular published and broadcasted to ${targetDesc} (${targetedStudents.length} recipients) via SMS & Email.`);
    setCircularTitle('');
    setCircularContent('');
    setAttachmentName('');
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const registrarAnnouncements = announcements.filter((a) => a.authorRole === 'registrar');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Registrar Seal & Authority Header */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-700 p-0.5 shadow-xl">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-[14px] object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {currentUser.title} {currentUser.name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Office of the Registrar
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Registry Directorate · Academic Affairs & Senate Secretariat
              </div>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                Staff Authority ID: {currentUser.staffId} · Novalis University
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xl font-bold text-white font-mono tabular-nums">
                {allStudents.length * 1250}+
              </div>
              <div className="text-[10px] text-slate-400">Total University Students</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                {notificationLogs.length}
              </div>
              <div className="text-[10px] text-slate-400">Dispatches Logged</div>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-300">DISPATCHED</span>
          </div>
        )}
      </div>

      {/* Official Circular Composer */}
      <div className="rounded-3xl liquid-glass p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Senate & University-Wide Circular Dispatcher
          </h2>
          <p className="text-xs text-slate-400">
            Publish official academic gazettes, senate directives, and targeted faculty notices with instant SMS/Email alerts
          </p>
        </div>

        <form onSubmit={handlePublishCircular} className="space-y-5 text-left">
          
          {/* Target Audience Scope Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Dissemination Target Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <button
                type="button"
                onClick={() => setTargetScope('all')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  targetScope === 'all'
                    ? 'border-amber-500/50 bg-amber-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>All Students (University-Wide)</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Reaches all undergraduate & postgraduate faculties
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('faculty_level')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  targetScope === 'faculty_level'
                    ? 'border-amber-500/50 bg-amber-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Target by Faculty & Level</span>
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Target specific college and year of study cohort
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Faculty & Level Selectors */}
          {targetScope === 'faculty_level' && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                  Select Target Faculty
                </label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {faculties.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                  Select Academic Level
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Levels (100L - 500L)</option>
                  {levels.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Circular Title & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Official Circular Title
              </label>
              <input
                type="text"
                required
                value={circularTitle}
                onChange={(e) => setCircularTitle(e.target.value)}
                placeholder="e.g. Official Senate Circular 343: Matriculation Ceremony & Portal Closure"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gazette Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="normal">Standard Gazette</option>
                <option value="high">High Priority Circular</option>
                <option value="urgent">Urgent Statutory Notice</option>
              </select>
            </div>
          </div>

          {/* Circular Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Official Directive Content
            </label>
            <textarea
              required
              rows={4}
              value={circularContent}
              onChange={(e) => setCircularContent(e.target.value)}
              placeholder="This is to notify all registered students and members of the University community that..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Gazette PDF Document (Official Senate Memo)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="e.g. Senate_Gazette_Vol_12_Approved.pdf"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setAttachmentName('Senate_Circular_Approved_Calendar.pdf')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 cursor-pointer"
              >
                Default Memo PDF
              </button>
            </div>
          </div>

          {/* Dispatch Channels */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">
                Institutional Transmission Gateways
              </div>
              <div className="text-[11px] text-slate-400">
                Direct SMS delivery to registered parent/student SIMs and institutional mailboxes
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="rounded bg-slate-800 border-white/20 text-emerald-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  SMS Broadcast
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded bg-slate-800 border-white/20 text-indigo-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Email Circular
                </span>
              </label>
            </div>
          </div>

          {/* Dispatch Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400">
              Scope: {targetScope === 'all' ? (
                <span className="text-white font-semibold">Entire University Student Population</span>
              ) : (
                <span className="text-amber-300 font-semibold">{selectedFaculty} · {selectedLevel}</span>
              )}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Publish & Broadcast Circular</span>
            </button>
          </div>

        </form>
      </div>

      {/* Dispatched Gazettes History */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Registry Circulars Published ({registrarAnnouncements.length})
          </h2>
          <p className="text-xs text-slate-400">
            Historical record of gazettes published by the Registrar
          </p>
        </div>

        <div className="space-y-3">
          {registrarAnnouncements.map((circ) => (
            <div
              key={circ.id}
              className="p-5 rounded-2xl liquid-glass border border-white/10 text-left"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Senate Gazette
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(circ.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  Target: {circ.target.type === 'all' ? 'University-Wide' : `${circ.target.faculty} (${circ.target.level})`}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">
                {circ.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {circ.content}
              </p>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Signatory: {circ.authorName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> SMS Dispatched
                  </span>
                  <span className="text-indigo-400 font-mono flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email Sent
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
