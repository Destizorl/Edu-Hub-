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
  NotificationLog, 
  AuditLog, 
  SystemSettings 
} from '../types';
import { DatabaseService } from '../services/db';
import { StudentChat } from './StudentChat';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';
import uniportCrest from '../assets/images/university_crest_seal_1792405150065.jpg';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Layers, 
  Calendar, 
  Bell, 
  MessageSquare, 
  BarChart3, 
  History, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  Send, 
  Lock, 
  UserPlus, 
  Server, 
  Check, 
  X, 
  Menu, 
  Clock, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Activity,
  FileText,
  ChevronRight
} from 'lucide-react';

interface AdminDashboardProps {
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
  auditLogs: AuditLog[];
  settings: SystemSettings;
  onLogout: () => void;
  onUpdateUser: (updated: User) => void;
  triggerToast: (title: string, message: string, type?: 'sms' | 'email' | 'system') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
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
  auditLogs,
  settings,
  onLogout,
  onUpdateUser,
  triggerToast,
}) => {
  const [activeNav, setActiveNav] = useState<
    | 'overview'
    | 'student_management'
    | 'lecturer_management'
    | 'user_accounts'
    | 'roles_access'
    | 'faculty_dept'
    | 'course_management'
    | 'enrolment_management'
    | 'timetable_management'
    | 'announcements'
    | 'support_messages'
    | 'reports_analytics'
    | 'audit_logs'
    | 'system_settings'
  >('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'lecturer' | 'result_officer' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [selectedAnnouncementForDetail, setSelectedAnnouncementForDetail] = useState<Announcement | null>(null);

  // Create User Account Modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCampusId, setNewUserCampusId] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'lecturer' | 'result_officer' | 'admin'>('student');
  const [newUserFaculty, setNewUserFaculty] = useState('Faculty of Science');
  const [newUserDept, setNewUserDept] = useState('Computer Science');
  const [newUserLevel, setNewUserLevel] = useState('100L');
  const [newUserPassword, setNewUserPassword] = useState('password123');

  // Senate Broadcast Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadTitle, setBroadTitle] = useState('');
  const [broadContent, setBroadContent] = useState('');
  const [broadScope, setBroadScope] = useState<'all' | 'faculty' | 'level'>('all');
  const [broadFaculty, setBroadFaculty] = useState('Faculty of Science');
  const [broadLevel, setBroadLevel] = useState('300L');
  const [broadUrgency, setBroadUrgency] = useState<'normal' | 'high' | 'urgent'>('high');
  const [broadSms, setBroadSms] = useState(true);
  const [broadEmail, setBroadEmail] = useState(true);

  // Add Course Modal
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseUnits, setNewCourseUnits] = useState(3);
  const [newCourseLecturerId, setNewCourseLecturerId] = useState(allUsers.find((u) => u.role === 'lecturer')?.id || '');
  const [newCourseLevel, setNewCourseLevel] = useState('300L');
  const [newCourseSemester, setNewCourseSemester] = useState<1 | 2>(1);

  // Timetable Slot Modal
  const [showAddTimetableModal, setShowAddTimetableModal] = useState(false);
  const [ttCourseCode, setTtCourseCode] = useState('CSC 301');
  const [ttDay, setTtDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [ttStart, setTtStart] = useState('08:00 AM');
  const [ttEnd, setTtEnd] = useState('10:00 AM');
  const [ttVenue, setTtVenue] = useState('Lecture Hall A');

  // Compute stats
  const totalStudents = allUsers.filter((u) => u.role === 'student').length;
  const totalLecturers = allUsers.filter((u) => u.role === 'lecturer').length;
  const activeAccountsCount = allUsers.filter((u) => u.status === 'active').length;
  const suspendedAccountsCount = allUsers.filter((u) => u.status === 'suspended').length;
  const pendingAccountsCount = allUsers.filter((u) => u.status === 'pending').length;

  // Handle Account Status Toggle (Suspend / Reactivate)
  const handleToggleStatus = (targetUser: User) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      DatabaseService.setUserStatus(targetUser.id, nextStatus, currentUser);
      triggerToast(
        nextStatus === 'suspended' ? 'Account Suspended' : 'Account Reactivated',
        `${targetUser.name} (${targetUser.campusId}) status set to ${nextStatus.toUpperCase()}.`,
        'system'
      );
    } catch (err: any) {
      triggerToast('Operation Denied', err?.message || 'Failed to update user status.', 'system');
    }
  };

  // Handle Create User Account
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserCampusId.trim()) return;

    try {
      const created = DatabaseService.createUser(
        {
          campusId: newUserCampusId.trim().toUpperCase(),
          name: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          phone: '+234 800 000 0000',
          password: newUserPassword || 'password123',
          role: newUserRole,
          status: 'active',
          avatar:
            newUserRole === 'student'
              ? 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=250&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=250&auto=format&fit=crop&q=80',
          faculty: newUserFaculty,
          department: newUserDept,
          level: newUserRole === 'student' ? newUserLevel : undefined,
          matricNumber: newUserRole === 'student' ? newUserCampusId : undefined,
          staffId: newUserRole !== 'student' ? newUserCampusId : undefined,
          enrolledCourseCodes: newUserRole === 'student' ? ['CSC 301', 'CSC 303'] : undefined,
          coursesTaught: newUserRole === 'lecturer' ? ['CSC 301'] : undefined,
        },
        currentUser
      );

      triggerToast('Account Created', `Created ${created.role.toUpperCase()} account for ${created.name}.`, 'system');
      setShowCreateUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserCampusId('');
    } catch (err: any) {
      triggerToast('Creation Failed', err?.message || 'Could not create account.', 'system');
    }
  };

  // Handle Senate Broadcast
  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadTitle.trim() || !broadContent.trim()) return;

    try {
      DatabaseService.createAnnouncement(
        {
          title: broadTitle,
          content: broadContent,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: 'admin',
          authorTitle: 'Directorate of ICT & Academic Senate',
          category: broadUrgency === 'urgent' ? 'urgent' : 'circular',
          target:
            broadScope === 'all'
              ? { type: 'all' }
              : broadScope === 'faculty'
              ? { type: 'faculty', faculty: broadFaculty }
              : { type: 'level', level: broadLevel },
          urgency: broadUrgency,
          channels: { inApp: true, emailSent: broadEmail, smsSent: broadSms },
          attachments: [{ name: 'Senate_Gazette_Resolution.pdf', size: '1.4 MB', type: 'application/pdf' }],
        },
        currentUser
      );

      triggerToast('Senate Bulletin Dispatched', 'Broadcast transmitted across institutional channels.', 'system');
      setShowBroadcastModal(false);
      setBroadTitle('');
      setBroadContent('');
    } catch (err: any) {
      triggerToast('Broadcast Failed', err?.message || 'Failed to dispatch broadcast.', 'system');
    }
  };

  // Handle Add Course
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseTitle.trim()) return;

    try {
      const lecturer = allUsers.find((u) => u.id === newCourseLecturerId);
      DatabaseService.createCourse(
        {
          code: newCourseCode.trim().toUpperCase(),
          title: newCourseTitle.trim(),
          creditUnits: Number(newCourseUnits),
          faculty: 'Faculty of Science',
          department: 'Computer Science',
          level: newCourseLevel,
          semester: newCourseSemester,
          lecturerId: newCourseLecturerId,
          lecturerName: lecturer?.name || 'Dr. Kenneth Okonkwo',
          venue: 'Lecture Hall 1',
        },
        currentUser
      );

      triggerToast('Course Created', `Added ${newCourseCode} to accredited curriculum.`, 'system');
      setShowAddCourseModal(false);
      setNewCourseCode('');
      setNewCourseTitle('');
    } catch (err: any) {
      triggerToast('Course Error', err?.message || 'Failed to add course.', 'system');
    }
  };

  // Handle Timetable Slot Creation
  const handleAddTimetableSlot = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const course = courses.find((c) => c.code === ttCourseCode);
      DatabaseService.addTimetableSlot(
        {
          courseCode: ttCourseCode,
          courseTitle: course?.title || ttCourseCode,
          lecturerName: course?.lecturerName || 'Faculty Lecturer',
          day: ttDay,
          startTime: ttStart,
          endTime: ttEnd,
          venue: ttVenue,
          faculty: course?.faculty || 'Faculty of Science',
          department: course?.department || 'Computer Science',
          level: course?.level || '300L',
        },
        currentUser
      );

      triggerToast('Timetable Slot Added', `Scheduled ${ttCourseCode} on ${ttDay} at ${ttStart}.`, 'system');
      setShowAddTimetableModal(false);
    } catch (err: any) {
      triggerToast('Timetable Error', err?.message || 'Failed to schedule slot.', 'system');
    }
  };

  // Filter users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.campusId?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearch.toLowerCase());

    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ? true : u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const navItems = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'student_management', label: 'Student Management', icon: GraduationCap, badge: totalStudents },
    { id: 'lecturer_management', label: 'Lecturer Management', icon: Building2, badge: totalLecturers },
    { id: 'user_accounts', label: 'User Accounts', icon: Users, badge: allUsers.length },
    { id: 'roles_access', label: 'Role & Access Control', icon: Lock },
    { id: 'faculty_dept', label: 'Faculties & Departments', icon: Layers },
    { id: 'course_management', label: 'Course Catalog & Units', icon: BookOpen, badge: courses.length },
    { id: 'enrolment_management', label: 'Enrolment Management', icon: UserCheck },
    { id: 'timetable_management', label: 'Timetable Scheduling', icon: Calendar },
    { id: 'announcements', label: 'Senate Bulletins', icon: Bell, badge: announcements.length },
    { id: 'support_messages', label: 'Platform Messages', icon: MessageSquare },
    { id: 'reports_analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'audit_logs', label: 'Security Audit Logs', icon: History, badge: auditLogs.length },
    { id: 'system_settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row text-left">
      
      {/* Mobile Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <img 
            src={uniportCrest} 
            alt="University of Port Harcourt" 
            className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shadow-2xs" 
          />
          <div>
            <div className="font-extrabold text-xs text-slate-900">EduStream Hub</div>
            <div className="text-[10px] text-blue-700 font-mono font-bold">UNIPORT Senate Console</div>
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
                Senate Governance
              </span>
            </div>
          </div>

          {/* User Mini Card */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-[10px] font-mono text-blue-700 font-bold truncate">
                {currentUser.staffId || currentUser.campusId}
              </div>
              <div className="text-[9px] text-slate-500 truncate">Administrator · Senate</div>
            </div>
          </div>

          {/* Navigation Links */}
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

        {/* Logout */}
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
            
            {/* Executive Hero Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#ccf32f]/15 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-mono font-bold">
                      UNIVERSITY GOVERNANCE CONSOLE
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono">
                      SYSTEM NORMAL
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Administrator Master Console
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                    Full oversight over student registrations, faculty credentials, accredited curriculum catalog, and immutable audit logs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create User Account</span>
                  </button>
                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ccf32f] hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>Senate Broadcast</span>
                  </button>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Registered Students</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{totalStudents}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">{totalStudents} Active Cohorts</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Accredited Faculty</div>
                  <div className="text-xl font-bold font-mono text-[#ccf32f] mt-0.5">{totalLecturers}</div>
                  <div className="text-[10px] text-blue-300 font-semibold">Across Departments</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Courses in Catalog</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{courses.length}</div>
                  <div className="text-[10px] text-slate-300 font-semibold">100L - 500L Accredited</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Suspended Accounts</div>
                  <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">{suspendedAccountsCount}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">Security Safeguard</div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Audit Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Recent Audit Trail */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" />
                    <span>Live Security Audit Trail</span>
                  </h3>
                  <button
                    onClick={() => setActiveNav('audit_logs')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Full Log ({auditLogs.length})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] uppercase text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-900">{log.target}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">{log.details}</p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Actor: <strong className="text-slate-700">{log.actorName}</strong> ({log.actorRole.toUpperCase()})
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold font-mono text-[9px] uppercase ${
                            log.status === 'success'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          {log.status}
                        </span>
                        <div className="text-[9px] text-slate-400 font-mono mt-1">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Infrastructure Status */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <span>Institutional Node Status</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-600">SMS Gateway Pipe</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active · 12,480 Units
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-600">Email SMTP Delivery</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        99.4% Deliverability
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-600">Academic Session</span>
                      <span className="font-mono font-bold text-slate-900">{settings.currentAcademicSession} · Sem {settings.currentSemester}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Grading Scale</span>
                      <span className="font-mono font-black text-slate-950 bg-[#ccf32f] px-2 py-0.5 rounded border border-lime-400">
                        Senate 5.00 CGPA
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    <h4 className="font-extrabold text-sm text-slate-900">Curriculum & Course Management</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Add new courses, verify credit unit allocations, or reassign faculty lecturers.
                  </p>
                  <button
                    onClick={() => setActiveNav('course_management')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Open Course Catalog
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: STUDENT MANAGEMENT */}
        {activeNav === 'student_management' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Student Records & Enrolments</h2>
                <p className="text-xs sm:text-sm text-slate-500">Manage registered students, verify matric numbers, and control access permissions.</p>
              </div>

              <button
                onClick={() => {
                  setNewUserRole('student');
                  setShowCreateUserModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Student</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Campus ID</th>
                    <th className="px-5 py-3.5">Level & Dept</th>
                    <th className="px-5 py-3.5">Enrolled Courses</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers
                    .filter((u) => u.role === 'student')
                    .map((std) => (
                      <tr key={std.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={std.avatar}
                              alt={std.name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{std.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{std.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-blue-700 font-bold">{std.campusId}</td>
                        <td className="px-5 py-3.5 text-slate-600">{std.level} · {std.department}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-700 font-bold">{std.enrolledCourseCodes?.join(', ')}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              std.status === 'active'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {std.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleToggleStatus(std)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                              std.status === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {std.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: LECTURER MANAGEMENT */}
        {activeNav === 'lecturer_management' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Faculty & Lecturer Management</h2>
                <p className="text-xs sm:text-sm text-slate-500">Assign lecturers to curriculum courses and manage teaching designations.</p>
              </div>

              <button
                onClick={() => {
                  setNewUserRole('lecturer');
                  setShowCreateUserModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Faculty Member</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Faculty Member</th>
                    <th className="px-5 py-3.5">Staff / Campus ID</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Assigned Courses</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers
                    .filter((u) => u.role === 'lecturer')
                    .map((lec) => (
                      <tr key={lec.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={lec.avatar}
                              alt={lec.name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{lec.title} {lec.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{lec.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-lime-800 font-bold">{lec.campusId}</td>
                        <td className="px-5 py-3.5 text-slate-600">{lec.department}</td>
                        <td className="px-5 py-3.5 font-mono text-blue-700 font-bold">{lec.coursesTaught?.join(', ')}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              lec.status === 'active'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {lec.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleToggleStatus(lec)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                              lec.status === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {lec.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: USER ACCOUNTS (Unified Directory & Creation) */}
        {activeNav === 'user_accounts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Institutional User Directory</h2>
                <p className="text-xs sm:text-sm text-slate-500">Centralized database of students, faculty, and administrative accounts.</p>
              </div>

              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New User</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, campus ID, email, or dept..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="lecturer">Lecturers</option>
                  <option value="admin">Administrators</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Directory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 truncate">{u.name}</span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                            u.role === 'admin'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : u.role === 'lecturer'
                              ? 'bg-lime-100 text-lime-900 border-lime-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-blue-700 mt-0.5">{u.campusId}</div>
                      <div className="text-[11px] text-slate-500 truncate">{u.department}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        u.status === 'active'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {u.status}
                    </span>

                    {u.id !== currentUser.id && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs font-bold cursor-pointer hover:underline ${
                          u.status === 'active' ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend Account' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: ROLES & ACCESS CONTROL */}
        {activeNav === 'roles_access' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Role-Based Access Control (RBAC) Governance</h2>
              <p className="text-xs sm:text-sm text-slate-500">Security matrix and authorization privileges enforced across all endpoints.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Student Role */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <h3 className="font-extrabold text-base text-slate-900">Student Role</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {totalStudents} Users
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View enrolled course materials & syllabus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Submit assignment solutions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Receive announcements and grade notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct chat with assigned lecturers</span>
                  </div>
                  <div className="flex items-center gap-2 text-rose-700 font-semibold">
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cannot publish announcements or edit courses</span>
                  </div>
                </div>
              </div>

              {/* Lecturer Role */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-lime-700" />
                    <h3 className="font-extrabold text-base text-slate-900">Lecturer Role</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-lime-900 bg-lime-100 px-2 py-0.5 rounded">
                    {totalLecturers} Faculty
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Manage assigned courses only</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Publish course-targeted announcements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Compile course CA & exam scores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Submit result sheets to Result Officer</span>
                  </div>
                  <div className="flex items-center gap-2 text-rose-700 font-semibold">
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cannot access user accounts or other courses</span>
                  </div>
                </div>
              </div>

              {/* Result Officer Role */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-700" />
                    <h3 className="font-extrabold text-base text-slate-900">Result Officer</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                    Records
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Receive and audit course mark sheets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Approve or return results with revision notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Compile individual matric results & broadsheets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Safely add/remove carryover records</span>
                  </div>
                  <div className="flex items-center gap-2 text-rose-700 font-semibold">
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cannot alter credentials or system configs</span>
                  </div>
                </div>
              </div>

              {/* Admin Role */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                    <h3 className="font-extrabold text-base text-slate-900">Admin Role</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    Senate Gov
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Create & approve student and faculty accounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Suspend and reactivate institutional accounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Publish Senate-wide circulars with SMS/Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Audit logs inspection & system configuration</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Full institutional governance privileges</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: COURSE MANAGEMENT & CATALOG */}
        {activeNav === 'course_management' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Course Catalog & Credit Allocations</h2>
                <p className="text-xs sm:text-sm text-slate-500">Audit accredited curricula and reassign faculty lecturers.</p>
              </div>

              <button
                onClick={() => setShowAddCourseModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Course</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Course Title</th>
                    <th className="px-5 py-3.5">Level / Sem</th>
                    <th className="px-5 py-3.5">Assigned Lecturer</th>
                    <th className="px-5 py-3.5 text-center">Credit Points</th>
                    <th className="px-5 py-3.5 text-right">Lecturer Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-mono font-black text-blue-700">{c.code}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{c.title}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{c.level} · Sem {c.semester}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{c.lecturerName}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded font-mono font-bold bg-[#ccf32f] text-slate-950 border border-lime-400">
                          {c.creditUnits} Units
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select
                          value={c.lecturerId}
                          onChange={(e) => {
                            try {
                              DatabaseService.assignLecturerToCourse(c.code, e.target.value, currentUser);
                              triggerToast('Lecturer Assigned', `Assigned lecturer to ${c.code}.`, 'system');
                            } catch (err: any) {
                              triggerToast('Assignment Error', err?.message || 'Failed to assign lecturer.', 'system');
                            }
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          {allUsers
                            .filter((u) => u.role === 'lecturer')
                            .map((lec) => (
                              <option key={lec.id} value={lec.id}>
                                {lec.name}
                              </option>
                            ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 7: TIMETABLE MANAGEMENT */}
        {activeNav === 'timetable_management' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">University Timetable & Hall Allocations</h2>
                <p className="text-xs sm:text-sm text-slate-500">Configure lecture times, days, and hall venues across faculties.</p>
              </div>

              <button
                onClick={() => setShowAddTimetableModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Lecture Slot</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {timetable.map((slot) => (
                <div
                  key={slot.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                      {slot.courseCode}
                    </span>
                    <button
                      onClick={() => {
                        DatabaseService.deleteTimetableSlot(slot.id, currentUser);
                        triggerToast('Slot Removed', 'Removed slot from timetable.', 'system');
                      }}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{slot.courseTitle}</h3>

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                    <div>Day: <span className="font-semibold text-slate-900">{slot.day}</span></div>
                    <div>Hours: <span className="font-mono text-slate-800">{slot.startTime} - {slot.endTime}</span></div>
                    <div>Venue: <span className="font-semibold text-slate-800">{slot.venue}</span></div>
                    <div>Lecturer: <span className="text-slate-800">{slot.lecturerName}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 8: SENATE BULLETINS & ANNOUNCEMENTS */}
        {activeNav === 'announcements' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Senate Gazettes & Emergency Broadcasts</h2>
                <p className="text-xs sm:text-sm text-slate-500">Transmitted instantaneously via In-App Feed, SMS Gateway, and Email.</p>
              </div>

              <button
                onClick={() => setShowBroadcastModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Publish Senate Bulletin</span>
              </button>
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => {
                const authorUser = allUsers.find((u) => u.id === ann.authorId);
                const isUniOfficial = ann.verifiedOfficial || ann.authorRole === 'admin' || ann.authorName.toLowerCase().includes('registry') || ann.authorName.toLowerCase().includes('university');
                const avatarSrc = isUniOfficial ? uniportCrest : (authorUser?.avatar || currentUser.avatar);

                return (
                  <div
                    key={ann.id}
                    onClick={() => setSelectedAnnouncementForDetail(ann)}
                    className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {ann.isReminder && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                            REMINDER
                          </span>
                        )}
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {ann.target.type.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-800">
                          {ann.urgency}
                        </span>
                        {ann.imageUrl && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Attachment</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            DatabaseService.deleteAnnouncement(ann.id, currentUser);
                            triggerToast('Bulletin Removed', 'Deleted from campus feed.', 'system');
                          }}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                          title="Delete Bulletin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
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
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-700 transition-colors mt-0.5">
                          {ann.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed line-clamp-3">{ann.content}</p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-1">
                        <span>Click to read complete dispatch</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{ann.readBy.length} Student Confirmations</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 9: SECURITY AUDIT LOGS */}
        {activeNav === 'audit_logs' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Security & Operational Audit Logs</h2>
                <p className="text-xs sm:text-sm text-slate-500">Immutable chronological record of logins, grade assignments, and role mutations.</p>
              </div>

              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
                Live Audit Active
              </span>
            </div>

            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="font-mono text-[11px] text-blue-700 font-semibold">· {log.target}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{log.details}</p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Actor: <strong className="text-slate-700">{log.actorName}</strong> ({log.actorRole.toUpperCase()}) · ID: {log.actorId}
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] uppercase ${
                        log.status === 'success'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {log.status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 10: REPORTS & ANALYTICS */}
        {activeNav === 'reports_analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Academic Analytics & Institutional Reports</h2>
              <p className="text-xs sm:text-sm text-slate-500">Real-time cohort distribution, assignment submission turnaround, and delivery metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase font-mono">Enrolment Breakdown</div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono">{totalStudents} Students</div>
                <div className="space-y-1.5 text-xs pt-2">
                  <div className="flex justify-between text-slate-600"><span>Computer Science:</span><span className="font-bold font-mono">2,140</span></div>
                  <div className="flex justify-between text-slate-600"><span>Electrical Engineering:</span><span className="font-bold font-mono">820</span></div>
                  <div className="flex justify-between text-slate-600"><span>Medical Sciences:</span><span className="font-bold font-mono">460</span></div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase font-mono">Continuous Assessment Rate</div>
                <div className="text-3xl font-extrabold text-emerald-600 font-mono">92.4%</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Average student assignment completion rate across all 100L-500L faculties before deadlines.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase font-mono">Communication Deliverability</div>
                <div className="text-3xl font-extrabold text-blue-600 font-mono">99.4%</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  12,480 SMS alerts and 18,200 emails dispatched successfully with zero gateway downtime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 11: SYSTEM SETTINGS */}
        {activeNav === 'system_settings' && (
          <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Institutional Governance & System Configuration</h2>
              <p className="text-xs text-slate-500 mt-1">Configure university identity, active academic sessions, and emergency broadcast ticker.</p>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">University Name</label>
                <input
                  type="text"
                  value={settings.universityName}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Session</label>
                  <input
                    type="text"
                    value={settings.currentAcademicSession}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Semester</label>
                  <input
                    type="text"
                    value={`Semester ${settings.currentSemester}`}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 bg-slate-50"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900">Communication Gateway Toggles</div>
                <div className="flex items-center justify-between text-xs">
                  <span>SMS Gateway Integration</span>
                  <span className="font-mono text-emerald-700 font-bold">ENABLED</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Institutional Email SMTP Node</span>
                  <span className="font-mono text-emerald-700 font-bold">ENABLED</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal: Create User Account */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Register Institutional Account</h3>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-blue-700 bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="result_officer">Result Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unique Campus ID</label>
                  <input
                    type="text"
                    required
                    value={newUserCampusId}
                    onChange={(e) => setNewUserCampusId(e.target.value)}
                    placeholder={newUserRole === 'student' ? 'e.g. STU-2026-050' : 'e.g. LEC-2026-010'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Grace Emeka"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="g.emeka@student.edustream.edu"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Faculty</label>
                  <select
                    value={newUserFaculty}
                    onChange={(e) => setNewUserFaculty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Faculty of Science">Faculty of Science</option>
                    <option value="Faculty of Engineering">Faculty of Engineering</option>
                    <option value="Faculty of Medical Sciences">Faculty of Medical Sciences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {newUserRole === 'student' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Level</label>
                  <select
                    value={newUserLevel}
                    onChange={(e) => setNewUserLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  >
                    <option value="100L">100L</option>
                    <option value="200L">200L</option>
                    <option value="300L">300L</option>
                    <option value="400L">400L</option>
                    <option value="500L">500L</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Temporary Password</label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Confirm & Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Senate Broadcast */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Senate Official Broadcast</h3>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishBroadcast} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Broadcast Target</label>
                  <select
                    value={broadScope}
                    onChange={(e) => setBroadScope(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  >
                    <option value="all">Entire University Community</option>
                    <option value="faculty">Specific Faculty</option>
                    <option value="level">Specific Academic Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Priority</label>
                  <select
                    value={broadUrgency}
                    onChange={(e) => setBroadUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  >
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Siren Alert</option>
                    <option value="normal">Standard Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Circular Headline</label>
                <input
                  type="text"
                  required
                  value={broadTitle}
                  onChange={(e) => setBroadTitle(e.target.value)}
                  placeholder="e.g. Official Senate Resolution on Harmattan Examination Protocols"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gazette Body Text</label>
                <textarea
                  rows={4}
                  required
                  value={broadContent}
                  onChange={(e) => setBroadContent(e.target.value)}
                  placeholder="Type the authoritative institutional communication..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-700 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={broadSms}
                    onChange={(e) => setBroadSms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Dispatch SMS Gateway ({totalStudents} students)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={broadEmail}
                    onChange={(e) => setBroadEmail(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Institutional Email</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Publish & Transmit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Course */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Add Course to Accredited Catalog</h3>
              </div>
              <button onClick={() => setShowAddCourseModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g. CSC 312"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credit Weight</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newCourseUnits}
                    onChange={(e) => setNewCourseUnits(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="e.g. Distributed Cloud Computing & Microservices"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Level</label>
                  <select
                    value={newCourseLevel}
                    onChange={(e) => setNewCourseLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  >
                    <option value="100L">100L</option>
                    <option value="200L">200L</option>
                    <option value="300L">300L</option>
                    <option value="400L">400L</option>
                    <option value="500L">500L</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={newCourseSemester}
                    onChange={(e) => setNewCourseSemester(parseInt(e.target.value) as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Faculty Lecturer</label>
                <select
                  value={newCourseLecturerId}
                  onChange={(e) => setNewCourseLecturerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  {allUsers
                    .filter((u) => u.role === 'lecturer')
                    .map((lec) => (
                      <option key={lec.id} value={lec.id}>
                        {lec.name} ({lec.department})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Save to Curriculum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Timetable Slot */}
      {showAddTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Schedule Timetable Slot</h3>
              </div>
              <button onClick={() => setShowAddTimetableModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTimetableSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course</label>
                <select
                  value={ttCourseCode}
                  onChange={(e) => setTtCourseCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold text-blue-700 bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lecture Day</label>
                  <select
                    value={ttDay}
                    onChange={(e) => setTtDay(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lecture Venue</label>
                  <input
                    type="text"
                    required
                    value={ttVenue}
                    onChange={(e) => setTtVenue(e.target.value)}
                    placeholder="e.g. Science Complex Hall 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={ttStart}
                    onChange={(e) => setTtStart(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={ttEnd}
                    onChange={(e) => setTtEnd(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTimetableModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Detail Modal */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncementForDetail}
        onClose={() => setSelectedAnnouncementForDetail(null)}
        allUsers={allUsers}
      />

    </div>
  );
};
