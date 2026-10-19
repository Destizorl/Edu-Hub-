import React, { useState } from 'react';
import { User, Course, Announcement, AcademicMaterial } from '../types';
import { 
  BookOpen, 
  CheckCircle, 
  Circle, 
  FileText, 
  Search, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  MessageSquare, 
  Calculator, 
  Clock, 
  AlertTriangle,
  Building,
  GraduationCap,
  Sparkles,
  Share2,
  ChevronRight,
  Filter
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  courses: Course[];
  announcements: Announcement[];
  materials: AcademicMaterial[];
  onToggleRead: (announcementId: string) => void;
  onNavigateTab: (tab: string) => void;
  onStartChatWithPeer: (studentId?: string) => void;
  onStartChatWithLecturer: (lecturerId?: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  courses,
  announcements,
  materials,
  onToggleRead,
  onNavigateTab,
  onStartChatWithPeer,
  onStartChatWithLecturer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');

  // Filter announcements for current student based on target
  const studentAnnouncements = announcements.filter((a) => {
    // Check target match
    if (a.target.type === 'all') return true;
    if (a.target.type === 'faculty' && a.target.faculty === currentUser.faculty) {
      if (a.target.level && a.target.level !== currentUser.level) return false;
      return true;
    }
    if (a.target.type === 'course' && a.target.courseCode) {
      return currentUser.enrolledCourseCodes?.includes(a.target.courseCode);
    }
    return true;
  });

  // Separate into Department/Registrar Official Circulars vs Lecturer Announcements
  const officialCirculars = studentAnnouncements.filter(
    (a) => a.authorRole === 'registrar' || a.category === 'circular' || a.category === 'department'
  );

  const lecturerAnnouncements = studentAnnouncements.filter(
    (a) => a.authorRole === 'lecturer' || a.category === 'lecture'
  );

  // Filter based on read status and search
  const filterList = (list: Announcement[]) => {
    return list.filter((a) => {
      const isRead = a.readBy.includes(currentUser.id);
      if (filterReadStatus === 'unread' && isRead) return false;
      if (filterReadStatus === 'read' && !isRead) return false;

      if (selectedCourseFilter !== 'all') {
        if (a.target.courseCode !== selectedCourseFilter) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(query);
        const matchContent = a.content.toLowerCase().includes(query);
        const matchAuthor = a.authorName.toLowerCase().includes(query);
        const matchCourse = a.target.courseCode?.toLowerCase().includes(query);
        return matchTitle || matchContent || matchAuthor || matchCourse;
      }
      return true;
    });
  };

  const filteredCirculars = filterList(officialCirculars);
  const filteredLecturerAnnouncements = filterList(lecturerAnnouncements);

  const enrolledCoursesList = courses.filter((c) =>
    currentUser.enrolledCourseCodes?.includes(c.code)
  );

  const unreadTotal = studentAnnouncements.filter(
    (a) => !a.readBy.includes(currentUser.id)
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Welcome & Student Identification Panel */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass p-5 sm:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full lg:w-auto">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-xl"
              />
              {currentUser.isCourseRep && (
                <div 
                  title="Appointed Course Representative"
                  className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold shadow-lg border border-slate-900"
                >
                  REP
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {currentUser.name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {currentUser.matricNumber}
                </span>
                {currentUser.isCourseRep && (
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Appointed Course Rep
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{currentUser.department}</span>
                <span className="text-slate-500">·</span>
                <span>{currentUser.faculty}</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-cyan-300 font-semibold">{currentUser.level}</span>
                <span className="text-slate-500">·</span>
                <span>2026/2027 Academic Session</span>
              </div>

              {currentUser.isCourseRep ? (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Course Rep Privilege Active:</strong> You are authorized to initiate direct official communication with lecturers on behalf of your class cohort.
                  </span>
                </div>
              ) : (
                <div className="mt-2.5 text-xs text-slate-400">
                  Direct lecturer liaison is managed by Course Rep <strong className="text-slate-200">Chukwuebuka Obi (CSC/2021/042)</strong> to maintain organized communications.
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
                {enrolledCoursesList.length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400">Enrolled Courses</div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xl sm:text-2xl font-bold text-rose-400 font-mono tabular-nums">
                {unreadTotal}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400">Unread Updates</div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
                {materials.length}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400">Course Materials</div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onNavigateTab('calculator')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Compute CGPA</span>
            </button>

            <button
              onClick={() => onNavigateTab('chat')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Peer Student Chat</span>
            </button>

            <button
              onClick={() => onNavigateTab('materials')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Materials Library</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Registration: <strong className="text-emerald-400 font-normal">Active & Verified</strong></span>
          </div>
        </div>
      </div>

      {/* Courses Registered Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              Registered Courses ({enrolledCoursesList.length})
            </h2>
            <p className="text-xs text-slate-400">
              Curriculum credit points fixed and managed by course lecturers
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('calculator')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>Open CGPA Calculator</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledCoursesList.map((course) => (
            <div
              key={course.code}
              className="p-5 rounded-2xl liquid-glass liquid-glass-interactive flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    {course.code}
                  </span>
                  <span className="text-xs font-mono font-semibold text-amber-300 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    {course.creditUnits} Units
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-2">
                  {course.title}
                </h3>

                <div className="text-xs text-slate-400 mb-3">
                  Lecturer: <span className="text-slate-200">{course.lecturerName}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedCourseFilter(course.code);
                    window.scrollTo({ top: 500, behavior: 'smooth' });
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                >
                  View Announcements
                </button>
                <button
                  onClick={() => onNavigateTab('materials')}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Materials</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Search & Read Status Filter Controls */}
      <div className="p-4 rounded-2xl liquid-glass flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars, course notes, lecturer updates, or course codes..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setFilterReadStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterReadStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterReadStatus('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterReadStatus === 'unread'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread ({unreadTotal})
            </button>
            <button
              onClick={() => setFilterReadStatus('read')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterReadStatus === 'read'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Read
            </button>
          </div>

          {selectedCourseFilter !== 'all' && (
            <button
              onClick={() => setSelectedCourseFilter('all')}
              className="text-xs text-cyan-400 hover:underline px-2 cursor-pointer font-mono"
            >
              Clear course filter [{selectedCourseFilter}]
            </button>
          )}
        </div>
      </div>

      {/* Two Distinct Information Sections as explicitly requested */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AREA 1: Departmental & Registry Official Bulletins */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                Department & Senate Circulars
              </h2>
              <p className="text-xs text-slate-400">
                Official institutional notices from the Registrar and HOD
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {filteredCirculars.length} Bulletins
            </span>
          </div>

          <div className="space-y-3">
            {filteredCirculars.length === 0 ? (
              <div className="p-8 rounded-2xl liquid-glass text-center text-slate-400 text-xs">
                No official circulars match your current filter.
              </div>
            ) : (
              filteredCirculars.map((circ) => {
                const isRead = circ.readBy.includes(currentUser.id);
                return (
                  <div
                    key={circ.id}
                    className={`p-5 rounded-2xl border transition-all text-left ${
                      isRead
                        ? 'border-white/10 bg-slate-900/60 opacity-90'
                        : 'border-amber-500/40 bg-amber-500/[0.04] shadow-lg shadow-amber-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {circ.authorTitle || 'Official'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(circ.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <button
                        onClick={() => onToggleRead(circ.id)}
                        className={`text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                          isRead ? 'text-slate-500 hover:text-slate-300' : 'text-amber-400 hover:text-amber-300 font-semibold'
                        }`}
                      >
                        {isRead ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 fill-current" />
                            <span>Mark Read</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                      {circ.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {circ.content}
                    </p>

                    {circ.attachments && circ.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                        {circ.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            <span className="truncate max-w-[180px]">{att.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Issued by: {circ.authorName}</span>
                      <span className="font-mono text-emerald-400">Disseminated to All Students</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AREA 2: Lecturer Course Announcements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Lecturer Course Announcements
              </h2>
              <p className="text-xs text-slate-400">
                Lecture notes, venue reschedules, deadlines, and project briefs
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {filteredLecturerAnnouncements.length} Updates
            </span>
          </div>

          <div className="space-y-3">
            {filteredLecturerAnnouncements.length === 0 ? (
              <div className="p-8 rounded-2xl liquid-glass text-center text-slate-400 text-xs">
                No lecturer announcements found for the selected course or filter.
              </div>
            ) : (
              filteredLecturerAnnouncements.map((ann) => {
                const isRead = ann.readBy.includes(currentUser.id);
                const isUrgent = ann.urgency === 'urgent';

                return (
                  <div
                    key={ann.id}
                    className={`p-5 rounded-2xl border transition-all text-left ${
                      isUrgent
                        ? 'border-rose-500/40 bg-rose-500/[0.04] shadow-lg shadow-rose-500/5'
                        : isRead
                        ? 'border-white/10 bg-slate-900/60 opacity-90'
                        : 'border-blue-500/40 bg-blue-500/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {ann.target.courseCode && (
                          <span className="font-mono text-xs font-bold text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
                            {ann.target.courseCode}
                          </span>
                        )}
                        {isUrgent && (
                          <span className="text-[10px] font-bold text-rose-300 px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" /> URGENT
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(ann.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <button
                        onClick={() => onToggleRead(ann.id)}
                        className={`text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                          isRead ? 'text-slate-500 hover:text-slate-300' : 'text-blue-400 hover:text-blue-300 font-semibold'
                        }`}
                      >
                        {isRead ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 fill-current" />
                            <span>Mark Read</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                      {ann.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {ann.content}
                    </p>

                    {ann.attachments && ann.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                        {ann.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span className="truncate max-w-[180px]">{att.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Lecturer: {ann.authorName}</span>
                      <div className="flex items-center gap-2">
                        {ann.channels.smsSent && (
                          <span className="text-emerald-400 font-mono">SMS Sent</span>
                        )}
                        {ann.channels.emailSent && (
                          <span className="text-indigo-400 font-mono">Email Sent</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
