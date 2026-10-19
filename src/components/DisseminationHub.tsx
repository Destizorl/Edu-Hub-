import React, { useState } from 'react';
import { User, Announcement, Course, NotificationLog } from '../types';
import { LecturerDashboard } from './LecturerDashboard';
import { RegistrarDashboard } from './RegistrarDashboard';
import { 
  Send, 
  Building, 
  FileText, 
  Search, 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Smartphone, 
  Mail, 
  Layers,
  GraduationCap
} from 'lucide-react';

interface DisseminationHubProps {
  currentUser: User;
  courses: Course[];
  announcements: Announcement[];
  notificationLogs: NotificationLog[];
  allUsers: User[];
  onToggleRead: (id: string) => void;
  onSendAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>) => void;
  onUpdateCourseUnits: (code: string, units: number) => void;
  onUploadMaterial: (mat: any) => void;
}

export const DisseminationHub: React.FC<DisseminationHubProps> = ({
  currentUser,
  courses,
  announcements,
  notificationLogs,
  allUsers,
  onToggleRead,
  onSendAnnouncement,
  onUpdateCourseUnits,
  onUploadMaterial,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'composer'>('feed');

  // If user is Lecturer or Registrar, they can switch between the Feed and the Composer
  const canCompose = currentUser.role === 'lecturer' || currentUser.role === 'registrar' || currentUser.role === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Sub navigation if staff */}
      {canCompose && (
        <div className="flex items-center justify-between p-1 rounded-2xl liquid-glass max-w-md mx-auto">
          <button
            onClick={() => setActiveSubTab('feed')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'feed'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Broadcasts Feed ({announcements.length})
          </button>
          <button
            onClick={() => setActiveSubTab('composer')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'composer'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {currentUser.role === 'registrar' ? 'Senate Gazette Dispatcher' : 'Course Broadcast Dispatcher'}
          </button>
        </div>
      )}

      {/* Render Composer or Feed */}
      {canCompose && activeSubTab === 'composer' ? (
        currentUser.role === 'registrar' ? (
          <RegistrarDashboard
            currentUser={currentUser}
            onSendAnnouncement={onSendAnnouncement}
            allUsers={allUsers}
            announcements={announcements}
            notificationLogs={notificationLogs}
          />
        ) : (
          <LecturerDashboard
            currentUser={currentUser}
            courses={courses}
            onUpdateCourseUnits={onUpdateCourseUnits}
            onSendAnnouncement={onSendAnnouncement}
            onUploadMaterial={onUploadMaterial}
            allUsers={allUsers}
            materials={[]}
          />
        )
      ) : (
        /* Comprehensive Feed of all Announcements */
        <div className="space-y-6">
          <div className="p-6 rounded-3xl liquid-glass flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Live Dissemination Stream & Circular Registry
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Real-time chronological archive of official senate circulars, departmental directives, and course updates
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> SMS Gateway Online
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> SMTP Relay Online
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => {
              const isRead = ann.readBy.includes(currentUser.id);
              const isUrgent = ann.urgency === 'urgent';
              const isRegistrar = ann.authorRole === 'registrar';

              return (
                <div
                  key={ann.id}
                  className={`p-6 rounded-3xl border transition-all text-left ${
                    isUrgent
                      ? 'border-rose-500/40 bg-rose-500/[0.04]'
                      : isRegistrar
                      ? 'border-amber-500/40 bg-amber-500/[0.03]'
                      : 'border-white/10 liquid-glass'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-lg border font-bold ${
                        isRegistrar 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {ann.authorRole.toUpperCase()} · {ann.category.toUpperCase()}
                      </span>

                      {ann.target.courseCode && (
                        <span className="font-mono text-xs font-bold text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          {ann.target.courseCode}
                        </span>
                      )}

                      {ann.target.faculty && (
                        <span className="text-xs text-amber-300 font-mono">
                          [{ann.target.faculty} · {ann.target.level}]
                        </span>
                      )}

                      {ann.target.type === 'all' && (
                        <span className="text-xs text-emerald-400 font-mono">
                          [All University Students]
                        </span>
                      )}

                      {isUrgent && (
                        <span className="text-[10px] font-bold text-rose-300 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30">
                          URGENT ALERT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(ann.createdAt).toLocaleString()}
                      </span>
                      {currentUser.role === 'student' && (
                        <button
                          onClick={() => onToggleRead(ann.id)}
                          className={`text-xs flex items-center gap-1 font-medium cursor-pointer ${
                            isRead ? 'text-slate-500 hover:text-slate-300' : 'text-blue-400 hover:text-blue-300 font-bold'
                          }`}
                        >
                          {isRead ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 fill-current" />}
                          <span>{isRead ? 'Read' : 'Mark Read'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 leading-snug">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {ann.content}
                  </p>

                  {ann.attachments && ann.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ann.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span>{att.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      Author: <strong className="text-slate-200">{ann.authorName}</strong> ({ann.authorTitle || ann.authorRole})
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      {ann.channels.smsSent && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> SMS Dispatched
                        </span>
                      )}
                      {ann.channels.emailSent && (
                        <span className="text-indigo-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Email Dispatched
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
