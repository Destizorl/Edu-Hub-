import React from 'react';
import { Announcement, User } from '../types';
import { 
  X, 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  BellRing, 
  GraduationCap, 
  User as UserIcon,
  CheckCircle2,
  Share2
} from 'lucide-react';
import uniportCrest from '../assets/images/university_crest_seal_1792405150065.jpg';

interface AnnouncementDetailModalProps {
  announcement: Announcement | null;
  onClose: () => void;
  currentUser?: User | null;
  allUsers?: User[];
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  announcement,
  onClose,
  allUsers = [],
}) => {
  if (!announcement) return null;

  // Determine avatar and badge according to institutional rules:
  // 1. Official university / admin announcements or reminders -> UNIPORT Logo
  // 2. Lecturer announcements -> Lecturer's actual profile image
  // 3. Course Representative announcements -> Course Rep's actual profile image
  const authorUser = allUsers.find((u) => u.id === announcement.authorId);
  const isOfficial = announcement.authorRole === 'admin' || announcement.authorRole === 'registrar' || announcement.verifiedOfficial;
  const isReminder = announcement.isReminder || announcement.urgency === 'urgent';
  const isCourseRep = authorUser?.isCourseRep || announcement.authorTitle?.toLowerCase().includes('course representative');
  const isLecturer = announcement.authorRole === 'lecturer';

  // Determine avatar source
  let avatarSrc = uniportCrest;
  let avatarAlt = 'University of Port Harcourt Official Crest';
  let roleLabel = 'University Administration';

  if (isReminder || isOfficial) {
    avatarSrc = uniportCrest;
    avatarAlt = 'University of Port Harcourt Logo';
    roleLabel = announcement.authorTitle || 'University Administration';
  } else if (isLecturer && authorUser?.avatar) {
    avatarSrc = authorUser.avatar;
    avatarAlt = authorUser.name;
    roleLabel = `Lecturer · ${authorUser.department || 'Academic Faculty'}`;
  } else if (isCourseRep && authorUser?.avatar) {
    avatarSrc = authorUser.avatar;
    avatarAlt = authorUser.name;
    roleLabel = `Course Representative · ${authorUser.level || ''} ${authorUser.department || ''}`;
  } else if (authorUser?.avatar) {
    avatarSrc = authorUser.avatar;
    avatarAlt = authorUser.name;
    roleLabel = announcement.authorRole.toUpperCase();
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden my-auto text-left flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            {isReminder && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                <BellRing className="w-3 h-3" />
                <span>REMINDER</span>
              </span>
            )}
            {announcement.verifiedOfficial && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-700" />
                <span>Verified Official Notice</span>
              </span>
            )}
            <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
              {announcement.target.courseCode || announcement.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Author Meta Block with Institutional Avatar */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <img
                  src={avatarSrc}
                  alt={avatarAlt}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 shadow-xs bg-white"
                  onError={(e) => {
                    // Fallback to crest if external avatar fails
                    (e.target as HTMLImageElement).src = uniportCrest;
                  }}
                />
                {isOfficial && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    {announcement.authorName}
                  </h4>
                  {isOfficial && (
                    <span className="text-[9px] font-mono px-2 py-0.2 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      UNIPORT
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium">{roleLabel}</div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-mono font-bold text-slate-700 flex items-center justify-end gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{new Date(announcement.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{new Date(announcement.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {announcement.title}
            </h2>
          </div>

          {/* Optional Supporting Flyer / Image */}
          {announcement.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
              <img
                src={announcement.imageUrl}
                alt={announcement.title}
                className="w-full h-auto max-h-72 object-cover object-center hover:scale-[1.01] transition-transform"
              />
            </div>
          )}

          {/* Complete Announcement Text (with preserved line breaks) */}
          <div className="prose prose-slate max-w-none">
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line font-normal space-y-4">
              {announcement.content}
            </div>
          </div>

          {/* Additional Institutional Notes / Gazettes */}
          {announcement.additionalNotes && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Institutional Reference & Gazetted Notice:</span>
                <span className="text-blue-800">{announcement.additionalNotes}</span>
              </div>
            </div>
          )}

          {/* Supporting Attachments & Documents */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Official Documents & Circular Attachments ({announcement.attachments.length})
              </div>
              <div className="space-y-2">
                {announcement.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-white text-blue-700 border border-slate-200 shadow-2xs shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{att.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{att.size} · PDF Document</div>
                      </div>
                    </div>

                    <a
                      href={att.url || '#'}
                      onClick={(e) => {
                        if (!att.url) {
                          e.preventDefault();
                          alert(`Downloading authenticated official document: ${att.name}`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-blue-700 hover:text-blue-800 hover:border-blue-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {announcement.externalLink && (
            <div className="pt-2">
              <a
                href={announcement.externalLink.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <span>{announcement.externalLink.label}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Published via EduStream Campus Hub & Senate Broadcast Engine
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
          >
            Close Notice
          </button>
        </div>

      </div>
    </div>
  );
};
