import React, { useState } from 'react';
import { 
  User, 
  Course, 
  Announcement, 
  AcademicMaterial, 
  Assignment, 
  AssignmentSubmission, 
  TimetableSlot, 
  ChatMessage, 
  NotificationLog 
} from '../types';
import { DatabaseService } from '../services/db';
import { CGPACalculator } from './CGPACalculator';
import { StudentChat } from './StudentChat';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';
import uniportCrest from '../assets/images/university_crest_seal_1792405150065.jpg';
import { 
  GraduationCap, 
  BookOpen, 
  Bell, 
  Calendar, 
  FileCheck, 
  FolderArchive, 
  MessageSquare, 
  Users, 
  UserCheck, 
  Settings, 
  LogOut, 
  Download, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  Send, 
  Calculator, 
  Sparkles, 
  Smartphone, 
  Mail, 
  Layers,
  ArrowRight,
  TrendingUp,
  FileText,
  ShieldCheck,
  Check
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  courses: Course[];
  announcements: Announcement[];
  materials: AcademicMaterial[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  timetable: TimetableSlot[];
  messages: ChatMessage[];
  notifications: NotificationLog[];
  allUsers: User[];
  onLogout: () => void;
  onUpdateUser: (updated: User) => void;
  triggerToast: (title: string, message: string, type?: 'sms' | 'email' | 'system') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  courses,
  announcements,
  materials,
  assignments,
  submissions,
  timetable,
  messages,
  notifications,
  allUsers,
  onLogout,
  onUpdateUser,
  triggerToast,
}) => {
  // Navigation Tabs for Student
  const [activeNav, setActiveNav] = useState<
    'overview' | 'courses' | 'announcements' | 'timetable' | 'assignments' | 'materials' | 'messages' | 'lecturers' | 'notifications' | 'profile' | 'settings' | 'cgpa'
  >('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Assignment Submission Modal state
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState('');

  // Course filter / search state
  const [courseSearch, setCourseSearch] = useState('');
  const [announcementFilter, setAnnouncementFilter] = useState<'all' | 'unread'>('all');
  const [timetableDay, setTimetableDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [selectedAnnouncementForDetail, setSelectedAnnouncementForDetail] = useState<Announcement | null>(null);

  // Profile edit state
  const [editPhone, setEditPhone] = useState(currentUser.phone);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Student specific data
  const enrolledCourses = courses.filter((c) => currentUser.enrolledCourseCodes?.includes(c.code));
  const studentAnnouncements = DatabaseService.getAnnouncementsForStudent(currentUser);
  const relevantAssignments = assignments.filter((a) => currentUser.enrolledCourseCodes?.includes(a.courseCode));
  const studentSubmissions = submissions.filter((s) => s.studentId === currentUser.id);
  const studentTimetable = timetable.filter(
    (t) => currentUser.enrolledCourseCodes?.includes(t.courseCode) || t.level === currentUser.level
  );
  const lecturersList = allUsers.filter((u) => u.role === 'lecturer');

  // Count unread
  const unreadAnnouncements = studentAnnouncements.filter((a) => !a.readBy.includes(currentUser.id)).length;
  const unreadMessagesCount = messages.filter((m) => m.receiverId === currentUser.id && !m.read).length;

  // Handle Assignment Submission
  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment || !submissionText.trim()) return;

    try {
      DatabaseService.submitAssignment(
        {
          assignmentId: submittingAssignment.id,
          courseCode: submittingAssignment.courseCode,
          studentId: currentUser.id,
          studentName: currentUser.name,
          studentMatric: currentUser.matricNumber || currentUser.campusId,
          content: submissionText,
          attachmentName: submissionFile || `${submittingAssignment.courseCode}_Submission.pdf`,
        },
        currentUser
      );

      triggerToast('Assignment Submitted', `Successfully submitted work for ${submittingAssignment.courseCode}.`, 'system');
      setSubmittingAssignment(null);
      setSubmissionText('');
      setSubmissionFile('');
    } catch (err: any) {
      triggerToast('Submission Error', err?.message || 'Failed to submit work.', 'system');
    }
  };

  // Handle Announcement Read Toggle
  const handleMarkRead = (id: string) => {
    DatabaseService.markAnnouncementRead(id, currentUser.id);
  };

  // Handle Material Download
  const handleDownload = (material: AcademicMaterial) => {
    DatabaseService.incrementDownload(material.id);
    triggerToast('Download Started', `Downloading ${material.title} (${material.fileSize})`, 'system');
  };

  // Handle Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = DatabaseService.updateUser(currentUser.id, { phone: editPhone, bio: editBio }, currentUser);
      onUpdateUser(updated);
      setProfileSuccess(true);
      triggerToast('Profile Updated', 'Your contact details and bio were updated successfully.', 'system');
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      triggerToast('Update Failed', err?.message || 'Could not update profile.', 'system');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: GraduationCap },
    { id: 'courses', label: 'My Courses', icon: BookOpen, badge: enrolledCourses.length },
    { id: 'announcements', label: 'Announcements', icon: Bell, badge: unreadAnnouncements > 0 ? unreadAnnouncements : undefined },
    { id: 'timetable', label: 'Academic Timetable', icon: Calendar },
    { id: 'assignments', label: 'Assignments', icon: FileCheck, badge: relevantAssignments.length },
    { id: 'materials', label: 'Learning Materials', icon: FolderArchive },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'lecturers', label: 'Lecturer Directory', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Smartphone },
    { id: 'cgpa', label: 'CGPA Engine', icon: Calculator },
    { id: 'profile', label: 'My Profile', icon: UserCheck },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row text-left">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <img 
            src={uniportCrest} 
            alt="University of Port Harcourt" 
            className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shadow-2xs" 
          />
          <div>
            <div className="font-extrabold text-xs text-slate-900">EduStream Hub</div>
            <div className="text-[10px] text-blue-700 font-mono font-semibold">UNIPORT Student Portal</div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between z-30 transition-transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-slate-100">
            <img 
              src={uniportCrest} 
              alt="University of Port Harcourt" 
              className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-1 shadow-2xs" 
            />
            <div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight block">
                EduStream Hub
              </span>
              <span className="text-[10px] font-mono text-blue-700 font-bold uppercase block -mt-0.5">
                UNIPORT Student
              </span>
            </div>
          </div>

          {/* User Mini Card */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-[10px] font-mono text-blue-700 truncate font-semibold">
                {currentUser.matricNumber || currentUser.campusId}
              </div>
              <div className="text-[9px] text-slate-500 truncate">{currentUser.level} · {currentUser.department}</div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-mono font-black rounded-full ${
                        isActive
                          ? 'bg-[#ccf32f] text-slate-950'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout */}
        <div className="pt-3 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* VIEW 1: OVERVIEW */}
        {activeNav === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Student Hero Header */}
            <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#ccf32f]/15 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ccf32f] text-slate-950 text-xs font-black font-mono">
                      {currentUser.level || '400L'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-mono">
                      {currentUser.campusId}
                    </span>
                    {currentUser.isCourseRep && (
                      <span className="px-2 py-0.5 rounded bg-lime-400/20 text-lime-300 border border-lime-400/30 text-[10px] font-bold">
                        Appointed Course Rep
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Welcome back, {currentUser.name}!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                    {currentUser.department} · {currentUser.faculty}. You have {enrolledCourses.length} active registered courses this semester.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveNav('cgpa')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ccf32f] hover:bg-lime-400 text-slate-950 font-extrabold text-xs shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    <Calculator className="w-4 h-4 text-slate-950" />
                    <span>Calculate CGPA</span>
                  </button>
                </div>
              </div>

              {/* Quick Status Cards */}
              <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Enrolled Courses</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{enrolledCourses.length}</div>
                  <div className="text-[10px] text-blue-300">{enrolledCourses.reduce((sum, c) => sum + (c.creditUnits || 0), 0)} Total Credit Units</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Active Assignments</div>
                  <div className="text-xl font-bold font-mono text-[#ccf32f] mt-0.5">{relevantAssignments.length}</div>
                  <div className="text-[10px] text-lime-300">{studentSubmissions.length} Submitted</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Unread Notices</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{unreadAnnouncements}</div>
                  <div className="text-[10px] text-slate-300">Senate & Lecturer</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Direct Messages</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{unreadMessagesCount} unread</div>
                  <div className="text-[10px] text-blue-300">Peer & Faculty</div>
                </div>
              </div>
            </div>

            {/* Grid: Recent Announcements & Today's Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Recent Course Announcements */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span>Recent Academic Bulletins</span>
                  </h3>
                  <button
                    onClick={() => setActiveNav('announcements')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {studentAnnouncements.slice(0, 3).map((ann) => {
                    const isRead = ann.readBy.includes(currentUser.id);
                    const authorUser = allUsers.find((u) => u.id === ann.authorId);
                    const isUniOfficial = ann.verifiedOfficial || ann.authorRole === 'admin' || ann.authorName.toLowerCase().includes('registry') || ann.authorName.toLowerCase().includes('university');
                    const avatarSrc = isUniOfficial ? uniportCrest : (authorUser?.avatar || currentUser.avatar);

                    return (
                      <div
                        key={ann.id}
                        onClick={() => {
                          setSelectedAnnouncementForDetail(ann);
                          if (!isRead) handleMarkRead(ann.id);
                        }}
                        className={`p-4 rounded-2xl border transition-all text-left cursor-pointer hover:border-blue-400 hover:shadow-xs group ${
                          isRead ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/40 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {ann.isReminder && (
                              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                                REMINDER
                              </span>
                            )}
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              {ann.target.courseCode || (ann.target.type === 'all' ? 'University' : ann.category)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 mt-2">
                          <img
                            src={avatarSrc}
                            alt={ann.authorName}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                              {ann.title}
                            </h4>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-0.5">
                              {ann.content}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">
                            {ann.authorTitle ? `${ann.authorTitle} ` : ''}{ann.authorName}
                          </span>
                          <span className="text-blue-700 font-bold group-hover:underline flex items-center gap-0.5">
                            <span>Read Full Notice</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Today's Timetable & Upcoming Deadlines */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Timetable Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Class Timetable (Monday)</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('timetable')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Full Week
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {studentTimetable.filter((t) => t.day === 'Monday').map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-mono font-bold text-blue-700">{slot.courseCode}</div>
                          <div className="font-semibold text-slate-900 truncate max-w-[170px]">{slot.courseTitle}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{slot.venue}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded font-mono font-bold bg-white text-slate-800 border border-slate-200 block">
                            {slot.startTime}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{slot.lecturerName.split(' ')[1]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deadlines Widget */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-lime-700" />
                      <span>Upcoming Deadlines</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('assignments')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      All Tasks
                    </button>
                  </div>

                  <div className="space-y-2">
                    {relevantAssignments.slice(0, 2).map((asg) => {
                      const submission = studentSubmissions.find((s) => s.assignmentId === asg.id);
                      return (
                        <div
                          key={asg.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white text-xs flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-blue-700">{asg.courseCode}</span>
                            <div className="font-bold text-slate-900 truncate max-w-[180px]">{asg.title}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Due: {new Date(asg.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div>
                            {submission ? (
                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>{submission.status === 'graded' ? `${submission.score}/${asg.maxScore}` : 'Submitted'}</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSubmittingAssignment(asg);
                                  setActiveNav('assignments');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                              >
                                Submit
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: MY COURSES */}
        {activeNav === 'courses' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Registered Courses</h2>
                <p className="text-xs sm:text-sm text-slate-500">Official Senate accredited courses for your current academic session.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Filter by course code or title..."
                  className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrolledCourses
                .filter((c) => c.code.toLowerCase().includes(courseSearch.toLowerCase()) || c.title.toLowerCase().includes(courseSearch.toLowerCase()))
                .map((course) => {
                  const courseMaterials = materials.filter((m) => m.courseCode === course.code);
                  const courseAssignments = assignments.filter((a) => a.courseCode === course.code);

                  return (
                    <div
                      key={course.code}
                      className="rounded-3xl bg-white border border-slate-200 p-6 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-extrabold text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            {course.code}
                          </span>
                          <span className="font-mono font-black text-xs bg-[#ccf32f] text-slate-950 px-2.5 py-0.5 rounded-lg border border-lime-300">
                            {course.creditUnits} Units
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 leading-snug">{course.title}</h3>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{course.description || 'Core departmental syllabus and lectures.'}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Assigned Lecturer:</span>
                          <span className="font-semibold text-slate-900">{course.lecturerName}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Lecture Venue:</span>
                          <span className="font-mono text-slate-800">{course.venue || 'Lecture Theatre 1'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Materials Available:</span>
                          <span className="font-mono text-blue-700 font-bold">{courseMaterials.length} documents</span>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => setActiveNav('materials')}
                            className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
                          >
                            Materials
                          </button>
                          <button
                            onClick={() => setActiveNav('assignments')}
                            className="flex-1 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer transition-colors"
                          >
                            Tasks ({courseAssignments.length})
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* VIEW 3: ANNOUNCEMENTS */}
        {activeNav === 'announcements' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Official Announcements & Circulars</h2>
                <p className="text-xs sm:text-sm text-slate-500">Live verified dispatches from Senate and course lecturers.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAnnouncementFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    announcementFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  All ({studentAnnouncements.length})
                </button>
                <button
                  onClick={() => setAnnouncementFilter('unread')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    announcementFilter === 'unread' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  Unread ({unreadAnnouncements})
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {studentAnnouncements
                .filter((a) => (announcementFilter === 'unread' ? !a.readBy.includes(currentUser.id) : true))
                .map((ann) => {
                  const isRead = ann.readBy.includes(currentUser.id);
                  const authorUser = allUsers.find((u) => u.id === ann.authorId);
                  const isUniOfficial = ann.verifiedOfficial || ann.authorRole === 'admin' || ann.authorName.toLowerCase().includes('registry') || ann.authorName.toLowerCase().includes('university');
                  const avatarSrc = isUniOfficial ? uniportCrest : (authorUser?.avatar || currentUser.avatar);

                  return (
                    <div
                      key={ann.id}
                      onClick={() => {
                        setSelectedAnnouncementForDetail(ann);
                        if (!isRead) handleMarkRead(ann.id);
                      }}
                      className={`p-6 rounded-3xl border transition-all cursor-pointer hover:border-blue-400 hover:shadow-md group ${
                        isRead ? 'bg-white border-slate-200 shadow-2xs' : 'bg-blue-50/50 border-blue-200 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {ann.isReminder && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                              REMINDER
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${
                              ann.urgency === 'urgent'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : ann.urgency === 'high'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-blue-100 text-blue-900 border border-blue-300'
                            }`}
                          >
                            {ann.urgency}
                          </span>
                          <span className="font-mono text-xs text-blue-700 font-bold">
                            {ann.target.courseCode || (ann.target.type === 'all' ? 'University Senate Notice' : ann.category.toUpperCase())}
                          </span>
                          {ann.imageUrl && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>Flyer / Media</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {new Date(ann.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5 my-2">
                        <img
                          src={avatarSrc}
                          alt={ann.authorName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{ann.authorTitle ? `${ann.authorTitle} ` : ''}{ann.authorName}</span>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">({ann.authorRole})</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors mt-0.5">
                            {ann.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed line-clamp-3">
                        {ann.content}
                      </p>

                      {ann.attachments && ann.attachments.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                          {ann.attachments.map((att, i) => (
                            <div
                              key={i}
                              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2 shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>{att.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-1">
                          <span>Click to open full bulletin & attachments</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                        {!isRead ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(ann.id);
                            }}
                            className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-2xs"
                          >
                            Mark Read
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Read</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* VIEW 4: TIMETABLE */}
        {activeNav === 'timetable' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Academic Timetable</h2>
                <p className="text-xs sm:text-sm text-slate-500">Official scheduled lectures and venue allocation for {currentUser.level}.</p>
              </div>

              {/* Day Selector */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map((day) => (
                  <button
                    key={day}
                    onClick={() => setTimetableDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      timetableDay === day
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentTimetable.filter((t) => t.day === timetableDay).length === 0 ? (
                <div className="col-span-2 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm">No scheduled lectures on {timetableDay}.</p>
                  <p className="text-xs text-slate-400 mt-1">Enjoy your study and project revision time.</p>
                </div>
              ) : (
                studentTimetable
                  .filter((t) => t.day === timetableDay)
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 text-xs">
                            {slot.courseCode}
                          </span>
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{slot.courseTitle}</h4>
                        <div className="text-xs text-slate-500 mt-1">Venue: <span className="font-semibold text-slate-800">{slot.venue}</span></div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <span>Lecturer: {slot.lecturerName}</span>
                        <span className="font-mono text-slate-400">{slot.department}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: ASSIGNMENTS & SUBMISSIONS */}
        {activeNav === 'assignments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Assignments & Submissions</h2>
              <p className="text-xs sm:text-sm text-slate-500">View tasks set by your course lecturers, submit work, and view grades & feedback.</p>
            </div>

            <div className="space-y-4">
              {relevantAssignments.map((asg) => {
                const submission = studentSubmissions.find((s) => s.assignmentId === asg.id);
                return (
                  <div
                    key={asg.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                          {asg.courseCode}
                        </span>
                        <span className="font-bold text-xs text-slate-500">Max Score: {asg.maxScore} marks</span>
                      </div>
                      <div className="text-xs font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 self-start">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Deadline: {new Date(asg.dueDate).toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{asg.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{asg.description}</p>
                    </div>

                    {/* Submission status or Form */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      {submission ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Submission on Record</span>
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] ${
                                submission.status === 'graded'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {submission.status === 'graded' ? `Graded: ${submission.score} / ${asg.maxScore}` : 'Pending Evaluation'}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 leading-relaxed">
                            {submission.content}
                          </div>

                          {submission.feedback && (
                            <div className="p-3 rounded-xl bg-lime-50 border border-lime-300 text-slate-900 space-y-1">
                              <div className="font-bold text-lime-900">Lecturer Feedback ({asg.lecturerName}):</div>
                              <p className="text-slate-800">{submission.feedback}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-medium">You have not submitted work for this task yet.</span>
                          <button
                            onClick={() => setSubmittingAssignment(asg)}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                          >
                            Submit Assignment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 6: LEARNING MATERIALS */}
        {activeNav === 'materials' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Learning Materials & Handouts</h2>
              <p className="text-xs sm:text-sm text-slate-500">Official syllabi, slides, code repositories, and past questions uploaded by your lecturers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {materials
                .filter((m) => currentUser.enrolledCourseCodes?.includes(m.courseCode))
                .map((mat) => (
                  <div
                    key={mat.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                          {mat.courseCode}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded">
                          {mat.fileType} · {mat.fileSize}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{mat.title}</h3>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{mat.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Lecturer: {mat.lecturerName}</span>
                        <span>{mat.downloadCount} downloads</span>
                      </div>

                      <button
                        onClick={() => handleDownload(mat)}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Handout</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW 7: MESSAGES */}
        {activeNav === 'messages' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Academic Direct Messaging</h2>
              <p className="text-xs sm:text-sm text-slate-500">End-to-end communication with your lecturers, course representatives, and peers.</p>
            </div>

            <StudentChat
              currentUser={currentUser}
              allUsers={allUsers}
              messages={messages}
              onSendMessage={(receiverId, content, voiceData) => {
                try {
                  DatabaseService.sendMessage(receiverId, content, currentUser, voiceData);
                  triggerToast('Message Sent', 'Your message has been delivered to recipient.', 'system');
                } catch (err: any) {
                  triggerToast('Error Sending', err?.message || 'Could not send message.', 'system');
                }
              }}
            />
          </div>
        )}

        {/* VIEW 8: LECTURER DIRECTORY */}
        {activeNav === 'lecturers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Faculty & Lecturer Directory</h2>
              <p className="text-xs sm:text-sm text-slate-500">Contact information, office consultation locations, and assigned courses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lecturersList.map((lec) => (
                <div
                  key={lec.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={lec.avatar}
                      alt={lec.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                    />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">
                        {lec.title} {lec.name}
                      </h3>
                      <div className="text-xs text-blue-700 font-mono font-bold mt-0.5">{lec.staffId}</div>
                      <div className="text-[11px] text-slate-500 truncate">{lec.department}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{lec.bio || 'Departmental faculty advisor.'}</p>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="text-slate-600">
                      Office: <span className="font-semibold text-slate-800">{lec.officeLocation || 'Faculty Building'}</span>
                    </div>
                    <div className="text-slate-600 truncate">
                      Email: <span className="font-mono text-blue-700">{lec.email}</span>
                    </div>

                    <button
                      onClick={() => setActiveNav('messages')}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Start Academic Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 9: NOTIFICATIONS */}
        {activeNav === 'notifications' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Notification Logs & Alerts</h2>
              <p className="text-xs sm:text-sm text-slate-500">Record of SMS broadcasts, institutional emails, and grade alerts dispatched to you.</p>
            </div>

            <div className="space-y-3">
              {notifications
                .filter((n) => n.recipientId === currentUser.id)
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3.5"
                  >
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {log.type === 'sms' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{log.subject}</span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.preview}</p>
                      <div className="mt-2 text-[10px] font-mono text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Dispatched to {log.recipientContact}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW 10: CGPA CALCULATOR */}
        {activeNav === 'cgpa' && (
          <div className="animate-in fade-in duration-200">
            <CGPACalculator
              currentUser={currentUser}
              courses={courses}
              savedCalculations={DatabaseService.getSavedCalculations(currentUser.id)}
              onSaveCalculation={(calc) => DatabaseService.saveCalculation(calc)}
              onDeleteCalculation={(id) => DatabaseService.deleteCalculation(id)}
            />
          </div>
        )}

        {/* VIEW 11: PROFILE */}
        {activeNav === 'profile' && (
          <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
              />
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h2>
                <div className="text-xs font-mono font-bold text-blue-700 mt-0.5">
                  Campus ID: {currentUser.campusId} · Matric: {currentUser.matricNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {currentUser.level} · {currentUser.department} ({currentUser.faculty})
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Email (Read Only)</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-mono text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs font-medium text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Bio / Research Interests</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 outline-none leading-relaxed"
                />
              </div>

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Profile updated and persisted successfully!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 12: SETTINGS */}
        {activeNav === 'settings' && (
          <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Account & Notification Settings</h2>
              <p className="text-xs text-slate-500 mt-1">Manage communication dispatch preferences for urgent campus circulars.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">SMS Gateway Alerts</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Receive immediate SMS messages when lecture venues change</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Institutional Email Digests</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Receive official Senate calendar circulars and CA grade notifications</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">In-App Assignment Feedback</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Push notification toast whenever a lecturer grades submitted tasks</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Assignment Submission Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {submittingAssignment.courseCode}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                  Submit: {submittingAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Solution Write-up / Implementation Notes
                </label>
                <textarea
                  rows={4}
                  required
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Provide your solution summary, implementation details, repository links, or mathematical proofs..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Attachment Name (Simulated Upload)
                </label>
                <input
                  type="text"
                  value={submissionFile}
                  onChange={(e) => setSubmissionFile(e.target.value)}
                  placeholder="e.g. CSC301_Assignment1_Kalango_Destiny.pdf"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                <strong>Submission Policy:</strong> Your work will be timestamped and submitted directly to {submittingAssignment.lecturerName}. You can view marks and lecturer feedback here once graded.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Confirm & Submit Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Detailed Modal */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncementForDetail}
        onClose={() => setSelectedAnnouncementForDetail(null)}
        allUsers={allUsers}
      />

    </div>
  );
};
