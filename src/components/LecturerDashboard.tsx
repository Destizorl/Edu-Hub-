import React, { useState, useMemo } from 'react';
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
  CourseResultSheet,
  StudentScoreEntry,
  GradeLetter
} from '../types';
import { DatabaseService } from '../services/db';
import { StudentChat } from './StudentChat';
import { CGPACalculator } from './CGPACalculator';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';
import uniportCrest from '../assets/images/university_crest_seal_1792405150065.jpg';
import { 
  Building2, 
  BookOpen, 
  FileText, 
  Upload, 
  FileCheck, 
  Users, 
  MessageSquare, 
  Calendar, 
  Bell, 
  UserCheck, 
  Settings, 
  LogOut, 
  Plus, 
  Send, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Menu, 
  X, 
  Clock, 
  Sparkles, 
  Download, 
  Smartphone, 
  Mail, 
  Check, 
  Award,
  ChevronRight,
  ShieldCheck,
  Calculator,
  RotateCcw,
  Eye,
  Printer,
  AlertTriangle
} from 'lucide-react';

interface LecturerDashboardProps {
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

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
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
  const [activeNav, setActiveNav] = useState<
    | 'overview'
    | 'my_courses'
    | 'course_management'
    | 'results_compilation'
    | 'announcements'
    | 'materials'
    | 'assignments'
    | 'submissions'
    | 'student_directory'
    | 'messages'
    | 'timetable'
    | 'cgpa_calculator'
    | 'notifications'
    | 'profile'
    | 'settings'
  >('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter lecturer's authorized courses only
  const myCourses = courses.filter(
    (c) => c.lecturerId === currentUser.id || currentUser.coursesTaught?.includes(c.code)
  );

  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(myCourses[0]?.code || 'CSC 301.1');

  // Announcement Detailed View State
  const [selectedAnnouncementForDetail, setSelectedAnnouncementForDetail] = useState<Announcement | null>(null);

  // Result Compilation State
  const [compilingCourseCode, setCompilingCourseCode] = useState<string>(myCourses[0]?.code || 'CSC 301.1');
  const [resultSheetVersion, setResultSheetVersion] = useState(0);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Active Result Sheet for the selected course
  const activeResultSheet = useMemo(() => {
    const existing = DatabaseService.getResultSheetByCourse(compilingCourseCode);
    if (existing) return existing;

    const courseObj = courses.find((c) => c.code === compilingCourseCode);
    const enrolledStudentsForCourse = allUsers.filter(
      (u) => u.role === 'student' && u.enrolledCourseCodes?.includes(compilingCourseCode)
    );

    const initialScores: StudentScoreEntry[] = enrolledStudentsForCourse.map((std) => ({
      studentId: std.id,
      matricNumber: std.matricNumber || std.campusId,
      studentName: std.name,
      caScore: 24,
      examScore: 54,
      totalScore: 78,
      grade: 'A',
      gradePoint: 5,
      creditUnits: courseObj?.creditUnits || 3,
      status: 'complete',
    }));

    return {
      id: `sheet-${compilingCourseCode.replace(/[^a-zA-Z0-9]/g, '')}-2026-1`,
      courseCode: compilingCourseCode,
      courseTitle: courseObj?.title || compilingCourseCode,
      creditUnits: courseObj?.creditUnits || 3,
      faculty: courseObj?.faculty || currentUser.faculty,
      department: courseObj?.department || currentUser.department,
      level: courseObj?.level || '300L',
      semester: courseObj?.semester || 1,
      academicSession: '2026/2027',
      lecturerId: currentUser.id,
      lecturerName: currentUser.name,
      maxCaScore: 30,
      maxExamScore: 70,
      status: 'draft' as const,
      studentScores: initialScores,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [compilingCourseCode, courses, allUsers, currentUser, resultSheetVersion]);

  // Score Calculation helper according to 5.00 grading scale
  const calculateGrade = (total: number): { grade: GradeLetter; gradePoint: number } => {
    if (total >= 70) return { grade: 'A', gradePoint: 5 };
    if (total >= 60) return { grade: 'B', gradePoint: 4 };
    if (total >= 50) return { grade: 'C', gradePoint: 3 };
    if (total >= 45) return { grade: 'D', gradePoint: 2 };
    if (total >= 40) return { grade: 'E', gradePoint: 1 };
    return { grade: 'F', gradePoint: 0 };
  };

  // Handle score change in compilation table
  const handleScoreChange = (matricNumber: string, field: 'ca' | 'exam', val: number) => {
    if (!activeResultSheet) return;
    const updatedScores = activeResultSheet.studentScores.map((sc) => {
      if (sc.matricNumber === matricNumber) {
        const ca = field === 'ca' ? Math.max(0, Math.min(activeResultSheet.maxCaScore, val)) : (sc.caScore ?? 0);
        const exam = field === 'exam' ? Math.max(0, Math.min(activeResultSheet.maxExamScore, val)) : (sc.examScore ?? 0);
        const total = Math.min(100, ca + exam);
        const { grade, gradePoint } = calculateGrade(total);
        return {
          ...sc,
          caScore: ca,
          examScore: exam,
          totalScore: total,
          grade,
          gradePoint,
        };
      }
      return sc;
    });

    const updatedSheet: CourseResultSheet = {
      ...activeResultSheet,
      studentScores: updatedScores,
    };
    DatabaseService.saveResultSheet(updatedSheet, currentUser);
    setResultSheetVersion((v) => v + 1);
  };

  // Save Draft
  const handleSaveDraft = () => {
    if (!activeResultSheet) return;
    DatabaseService.saveResultSheet({ ...activeResultSheet, status: 'draft' }, currentUser);
    setResultSheetVersion((v) => v + 1);
    triggerToast('Draft Saved', `Saved score entries for ${activeResultSheet.courseCode}.`, 'system');
  };

  // Submit to Result Officer
  const handleSubmitToOfficer = () => {
    if (!activeResultSheet) return;
    try {
      DatabaseService.submitResultSheet(activeResultSheet.id, currentUser);
      setResultSheetVersion((v) => v + 1);
      setShowSubmitConfirmModal(false);
      triggerToast(
        'Result Sheet Submitted',
        `Result sheet for ${activeResultSheet.courseCode} has been submitted to the Result Officer for review.`,
        'system'
      );
    } catch (err: any) {
      triggerToast('Submission Error', err.message, 'system');
    }
  };

  // Announcement Composer State
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCourse, setAnnCourse] = useState(selectedCourseCode);
  const [annUrgency, setAnnUrgency] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [annSms, setAnnSms] = useState(true);
  const [annEmail, setAnnEmail] = useState(true);

  // Material Upload State
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matCourse, setMatCourse] = useState(selectedCourseCode);
  const [matType, setMatType] = useState<'pdf' | 'slide' | 'doc' | 'code' | 'zip'>('pdf');
  const [matTags, setMatTags] = useState('Lecture, Revision');

  // Assignment Creator State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgCourse, setAsgCourse] = useState(selectedCourseCode);
  const [asgDueDate, setAsgDueDate] = useState('');
  const [asgMaxScore, setAsgMaxScore] = useState(30);

  // Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(25);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Course Credit Unit Editing
  const [editingCreditCourse, setEditingCreditCourse] = useState<string | null>(null);
  const [creditInput, setCreditInput] = useState<number>(3);

  // Relevant announcements for this lecturer (university-wide notices, faculty, and their courses)
  const myAnnouncements = announcements.filter(
    (a) =>
      a.target.type === 'all' ||
      a.authorId === currentUser.id ||
      myCourses.some((c) => c.code === a.target.courseCode) ||
      (a.target.type === 'faculty' && a.target.faculty === currentUser.faculty)
  );
  const myMaterials = materials.filter(
    (m) => m.lecturerId === currentUser.id || myCourses.some((c) => c.code === m.courseCode)
  );
  const myAssignments = assignments.filter(
    (a) => a.lecturerId === currentUser.id || myCourses.some((c) => c.code === a.courseCode)
  );
  const mySubmissions = submissions.filter((s) => myCourses.some((c) => c.code === s.courseCode));
  const myTimetable = timetable.filter(
    (t) => t.lecturerName.toLowerCase().includes(currentUser.name.toLowerCase()) || myCourses.some((c) => c.code === t.courseCode)
  );

  // Enrolled students across my courses
  const enrolledStudents = allUsers.filter(
    (u) => u.role === 'student' && u.enrolledCourseCodes?.some((code) => myCourses.some((mc) => mc.code === code))
  );

  const pendingSubmissionsCount = mySubmissions.filter((s) => s.status === 'submitted').length;
  const unreadMessagesCount = messages.filter((m) => m.receiverId === currentUser.id && !m.read).length;

  // Publish Announcement
  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    try {
      DatabaseService.createAnnouncement(
        {
          title: annTitle,
          content: annContent,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: 'lecturer',
          authorTitle: currentUser.title || 'Dr.',
          category: 'lecture',
          target: { type: 'course', courseCode: annCourse },
          urgency: annUrgency,
          channels: { inApp: true, emailSent: annEmail, smsSent: annSms },
        },
        currentUser
      );

      triggerToast('Announcement Published', `Broadcasted to enrolled students in ${annCourse}.`, 'system');
      setShowAnnounceModal(false);
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      triggerToast('Publish Failed', err?.message || 'Failed to publish announcement.', 'system');
    }
  };

  // Upload Material
  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;

    try {
      const course = courses.find((c) => c.code === matCourse);
      DatabaseService.createMaterial(
        {
          title: matTitle,
          description: matDesc,
          courseCode: matCourse,
          courseTitle: course?.title || matCourse,
          lecturerId: currentUser.id,
          lecturerName: currentUser.name,
          fileType: matType,
          fileSize: '3.4 MB',
          academicSession: '2026/2027',
          tags: matTags.split(',').map((t) => t.trim()),
        },
        currentUser
      );

      triggerToast('Material Uploaded', `Document added to ${matCourse} archive.`, 'system');
      setShowMaterialModal(false);
      setMatTitle('');
      setMatDesc('');
    } catch (err: any) {
      triggerToast('Upload Failed', err?.message || 'Failed to upload material.', 'system');
    }
  };

  // Create Assignment
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle.trim()) return;

    try {
      const course = courses.find((c) => c.code === asgCourse);
      DatabaseService.createAssignment(
        {
          courseCode: asgCourse,
          courseTitle: course?.title || asgCourse,
          lecturerId: currentUser.id,
          lecturerName: currentUser.name,
          title: asgTitle,
          description: asgDesc,
          dueDate: asgDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxScore: asgMaxScore,
          status: 'active',
        },
        currentUser
      );

      triggerToast('Assignment Created', `Assignment published for ${asgCourse}.`, 'system');
      setShowAssignmentModal(false);
      setAsgTitle('');
      setAsgDesc('');
    } catch (err: any) {
      triggerToast('Creation Failed', err?.message || 'Failed to create assignment.', 'system');
    }
  };

  // Grade Submission
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      DatabaseService.gradeSubmission(gradingSubmission.id, Number(gradeScore), gradeFeedback, currentUser);
      triggerToast('Grade Submitted', `Awarded ${gradeScore} marks to ${gradingSubmission.studentName}.`, 'system');
      setGradingSubmission(null);
      setGradeFeedback('');
    } catch (err: any) {
      triggerToast('Grading Error', err?.message || 'Could not record grade.', 'system');
    }
  };

  // Update Course Credit Units
  const handleSaveCreditUnits = (code: string) => {
    try {
      DatabaseService.updateCourseUnits(code, creditInput, currentUser);
      triggerToast('Course Updated', `Credit units for ${code} set to ${creditInput} units.`, 'system');
      setEditingCreditCourse(null);
    } catch (err: any) {
      triggerToast('Update Denied', err?.message || 'Could not update units.', 'system');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'my_courses', label: 'My Courses', icon: BookOpen, badge: myCourses.length },
    { id: 'course_management', label: 'Course Management', icon: Settings },
    { id: 'results_compilation', label: 'Score Compilation', icon: Calculator, badge: activeResultSheet?.status === 'returned' ? 'Action Needed' : undefined },
    { id: 'cgpa_calculator', label: 'CGPA Simulator', icon: Award },
    { id: 'announcements', label: 'Announcements', icon: FileText, badge: myAnnouncements.length },
    { id: 'materials', label: 'Learning Materials', icon: Upload, badge: myMaterials.length },
    { id: 'assignments', label: 'Assignments', icon: FileCheck, badge: myAssignments.length },
    { id: 'submissions', label: 'Student Submissions', icon: Award, badge: pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined },
    { id: 'student_directory', label: 'Student Directory', icon: Users, badge: enrolledStudents.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { id: 'timetable', label: 'Teaching Timetable', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row text-left">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <img 
            src={uniportCrest} 
            alt="University of Port Harcourt" 
            className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shadow-2xs" 
          />
          <div>
            <div className="font-extrabold text-xs text-slate-900">EduStream Hub</div>
            <div className="text-[10px] text-lime-800 font-mono font-bold">UNIPORT Faculty Portal</div>
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
              <span className="text-[10px] font-mono text-lime-800 font-bold uppercase block -mt-0.5">
                Faculty Console
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
              <div className="text-xs font-bold text-slate-900 truncate">{currentUser.title} {currentUser.name}</div>
              <div className="text-[10px] font-mono text-lime-800 font-bold truncate">
                {currentUser.staffId || currentUser.campusId}
              </div>
              <div className="text-[9px] text-slate-500 truncate">{currentUser.department}</div>
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
                      ? 'bg-slate-900 text-[#ccf32f] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ccf32f]' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] font-mono font-black rounded-full ${
                        isActive
                          ? 'bg-[#ccf32f] text-slate-950'
                          : 'bg-lime-50 text-lime-900 border border-lime-300'
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

      {/* Main Viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* VIEW 1: OVERVIEW */}
        {activeNav === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Lecturer Hero Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ccf32f] text-slate-950 text-xs font-black font-mono">
                      Faculty Member
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/20 text-xs font-mono">
                      {currentUser.staffId || currentUser.campusId}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {currentUser.title} {currentUser.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                    {currentUser.department} · {currentUser.faculty}. You are actively assigned {myCourses.length} accredited courses.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setShowAnnounceModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Broadcast Notice</span>
                  </button>
                  <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ccf32f] hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>Create Assignment</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Assigned Courses</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{myCourses.length}</div>
                  <div className="text-[10px] text-lime-300">100% Accredited</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Enrolled Students</div>
                  <div className="text-xl font-bold font-mono text-[#ccf32f] mt-0.5">{enrolledStudents.length}</div>
                  <div className="text-[10px] text-blue-300">Across Cohorts</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Pending Reviews</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{pendingSubmissionsCount}</div>
                  <div className="text-[10px] text-slate-300">Requires Grading</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-300">Student Inquiries</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{unreadMessagesCount} unread</div>
                  <div className="text-[10px] text-blue-300">Direct Chat</div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Submissions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Submissions to Grade */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>Recent Student Submissions ({mySubmissions.length})</span>
                  </h3>
                  <button
                    onClick={() => setActiveNav('submissions')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {mySubmissions.slice(0, 4).map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            {sub.courseCode}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{sub.studentName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({sub.studentMatric})</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">{sub.content}</p>
                      </div>

                      <div className="text-right shrink-0">
                        {sub.status === 'graded' ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 block">
                            Graded: {sub.score} marks
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setGradingSubmission(sub);
                              setGradeScore(25);
                              setGradeFeedback('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
                          >
                            Grade Work
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Teaching Timetable & Quick Publishing */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Teaching Schedule Widget */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Upcoming Lecture Schedule</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('timetable')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Full Schedule
                    </button>
                  </div>

                  <div className="space-y-2">
                    {myTimetable.slice(0, 3).map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <span className="font-mono font-bold text-blue-700">{slot.courseCode} · {slot.day}</span>
                          <div className="font-semibold text-slate-900 truncate max-w-[170px]">{slot.courseTitle}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{slot.venue}</div>
                        </div>
                        <span className="px-2 py-1 rounded font-mono font-bold text-[11px] bg-white text-slate-800 border border-slate-200 shrink-0">
                          {slot.startTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Upload Action */}
                <div className="p-6 rounded-3xl bg-lime-50/60 border border-lime-300 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-lime-900" />
                    <h4 className="font-extrabold text-sm text-slate-900">Upload Learning Material</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Upload course slides, syllabus, or past questions directly to your enrolled students.
                  </p>
                  <button
                    onClick={() => setShowMaterialModal(true)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#ccf32f] font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Launch Material Uploader
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: MY COURSES */}
        {activeNav === 'my_courses' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Assigned Courses & Curriculum</h2>
              <p className="text-xs sm:text-sm text-slate-500">Accredited courses you are authorized to manage and examine.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myCourses.map((c) => {
                const countEnrolled = allUsers.filter((u) => u.enrolledCourseCodes?.includes(c.code)).length;
                const countMaterials = materials.filter((m) => m.courseCode === c.code).length;
                const countTasks = assignments.filter((a) => a.courseCode === c.code).length;

                return (
                  <div
                    key={c.code}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        {c.code}
                      </span>
                      <span className="font-mono font-bold text-xs bg-[#ccf32f] text-slate-950 px-2.5 py-0.5 rounded-lg border border-lime-400">
                        {c.creditUnits} Units
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{c.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.description || 'Core departmental syllabus and lectures.'}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-mono font-bold text-slate-900 text-sm">{countEnrolled}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Students</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-mono font-bold text-slate-900 text-sm">{countMaterials}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Handouts</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="font-mono font-bold text-slate-900 text-sm">{countTasks}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Assignments</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono">Level: {c.level} · Sem {c.semester}</span>
                      <button
                        onClick={() => {
                          setSelectedCourseCode(c.code);
                          setActiveNav('course_management');
                        }}
                        className="text-blue-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Manage Course</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: COURSE MANAGEMENT */}
        {activeNav === 'course_management' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Course Administration & Units</h2>
              <p className="text-xs sm:text-sm text-slate-500">Configure accredited credit points and inspect student enrolments.</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Course to Administer</label>
                  <select
                    value={selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-xs text-blue-700 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    {myCourses.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Current Credit Points:</span>
                  <span className="px-3 py-1 rounded-xl bg-[#ccf32f] text-slate-950 font-black font-mono text-xs border border-lime-400">
                    {courses.find((c) => c.code === selectedCourseCode)?.creditUnits || 3} Units
                  </span>
                </div>
              </div>

              {/* Modify Credit Units Form */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">Adjust Accredited Credit Weight</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Updates are verified on the backend and saved to institutional transcript records.</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={creditInput}
                    onChange={(e) => setCreditInput(parseInt(e.target.value) || 1)}
                    className="w-16 px-3 py-1.5 rounded-xl border border-slate-300 text-center font-mono font-bold text-xs bg-white"
                  />
                  <button
                    onClick={() => handleSaveCreditUnits(selectedCourseCode)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Save Units
                  </button>
                </div>
              </div>

              {/* Enrolled Students for this course */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900">
                  Enrolled Students in {selectedCourseCode} ({allUsers.filter((u) => u.enrolledCourseCodes?.includes(selectedCourseCode)).length})
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Matric / Campus ID</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {allUsers
                        .filter((u) => u.enrolledCourseCodes?.includes(selectedCourseCode))
                        .map((std) => (
                          <tr key={std.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-bold text-slate-900">{std.name}</td>
                            <td className="px-4 py-3 font-mono text-blue-700 font-semibold">{std.matricNumber || std.campusId}</td>
                            <td className="px-4 py-3 text-slate-600">{std.department}</td>
                            <td className="px-4 py-3 font-mono text-slate-600">{std.level}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setActiveNav('messages')}
                                className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                              >
                                Message
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ANNOUNCEMENTS (Full CRUD) */}
        {activeNav === 'announcements' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Course Broadcasts & Bulletins</h2>
                <p className="text-xs sm:text-sm text-slate-500">Publish urgent venue notices and lecture circulars with SMS & email dispatch.</p>
              </div>

              <button
                onClick={() => setShowAnnounceModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Announcement</span>
              </button>
            </div>

            <div className="space-y-4">
              {myAnnouncements.map((ann) => {
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
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {ann.target.courseCode || (ann.target.type === 'all' ? 'University Notice' : 'Faculty Notice')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          ann.urgency === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
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
                        {ann.authorId === currentUser.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              DatabaseService.deleteAnnouncement(ann.id, currentUser);
                              triggerToast('Announcement Deleted', 'Removed from student feed.', 'system');
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed line-clamp-3">
                      {ann.content}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{ann.readBy.length} Students Read</span>
                      </span>
                      <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-1">
                        <span>Click to read full bulletin</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 5: LEARNING MATERIALS (Full CRUD) */}
        {activeNav === 'materials' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Learning Materials & Handouts</h2>
                <p className="text-xs sm:text-sm text-slate-500">Manage lecture slides, code repositories, and past questions accessible to students.</p>
              </div>

              <button
                onClick={() => setShowMaterialModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Material</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        {mat.courseCode}
                      </span>
                      <button
                        onClick={() => {
                          DatabaseService.deleteMaterial(mat.id, currentUser);
                          triggerToast('Material Removed', 'Handout deleted from course archive.', 'system');
                        }}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{mat.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{mat.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono text-[10px] uppercase font-bold">{mat.fileType} · {mat.fileSize}</span>
                    <span>{mat.downloadCount} Downloads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 6: ASSIGNMENTS */}
        {activeNav === 'assignments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Course Assignments</h2>
                <p className="text-xs sm:text-sm text-slate-500">Create continuous assessment tasks with deadlines and maximum marks.</p>
              </div>

              <button
                onClick={() => setShowAssignmentModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Assignment</span>
              </button>
            </div>

            <div className="space-y-4">
              {myAssignments.map((asg) => {
                const countSubmissions = submissions.filter((s) => s.assignmentId === asg.id).length;
                return (
                  <div
                    key={asg.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded border border-blue-200">
                          {asg.courseCode}
                        </span>
                        <span className="text-xs font-bold text-slate-600">Max Score: {asg.maxScore} marks</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Due: {new Date(asg.dueDate).toLocaleDateString()}</span>
                        </span>
                        <button
                          onClick={() => {
                            DatabaseService.deleteAssignment(asg.id, currentUser);
                            triggerToast('Assignment Deleted', 'Removed from student views.', 'system');
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900">{asg.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{asg.description}</p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-700">{countSubmissions} Student Submissions on Record</span>
                      <button
                        onClick={() => setActiveNav('submissions')}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                      >
                        Review Submissions
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 7: STUDENT SUBMISSIONS (Grading Studio) */}
        {activeNav === 'submissions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Student Submissions & Grading</h2>
              <p className="text-xs sm:text-sm text-slate-500">Review student solutions, assign continuous assessment marks, and provide feedback.</p>
            </div>

            <div className="space-y-4">
              {mySubmissions.map((sub) => {
                const asg = assignments.find((a) => a.id === sub.assignmentId);
                const max = asg?.maxScore || 30;

                return (
                  <div
                    key={sub.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            {sub.courseCode}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900">{sub.studentName}</span>
                          <span className="font-mono text-xs text-slate-500">({sub.studentMatric})</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Task: <strong>{asg?.title || 'Course Assignment'}</strong>
                        </div>
                      </div>

                      <div className="self-start sm:self-center">
                        {sub.status === 'graded' ? (
                          <span className="px-3 py-1 rounded-xl font-bold font-mono text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Graded: {sub.score} / {max}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl font-bold font-mono text-xs bg-amber-50 text-amber-800 border border-amber-200">
                            Awaiting Assessment
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="font-bold text-slate-700">Submitted Work:</div>
                      <p className="text-slate-800 leading-relaxed">{sub.content}</p>
                      {sub.attachmentName && (
                        <div className="pt-2 text-[11px] text-blue-700 font-mono font-semibold flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Attachment: {sub.attachmentName}</span>
                        </div>
                      )}
                    </div>

                    {sub.feedback && (
                      <div className="p-3.5 rounded-xl bg-lime-50 border border-lime-300 text-xs space-y-1">
                        <div className="font-bold text-lime-900">Recorded Feedback:</div>
                        <p className="text-slate-800">{sub.feedback}</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setGradingSubmission(sub);
                          setGradeScore(sub.score !== undefined ? sub.score : 25);
                          setGradeFeedback(sub.feedback || '');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        {sub.status === 'graded' ? 'Update Grade & Feedback' : 'Evaluate & Award Grade'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 8: STUDENT DIRECTORY */}
        {activeNav === 'student_directory' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Enrolled Student Cohort Directory</h2>
              <p className="text-xs sm:text-sm text-slate-500">Students registered in your courses across 100L-500L.</p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Campus ID / Matric</th>
                    <th className="px-5 py-3.5">Level & Dept</th>
                    <th className="px-5 py-3.5">Enrolled Courses</th>
                    <th className="px-5 py-3.5 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={std.avatar}
                            alt={std.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <div className="font-bold text-slate-900">{std.name}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-blue-700 font-semibold">{std.matricNumber || std.campusId}</td>
                      <td className="px-5 py-3.5 text-slate-600">{std.level} · {std.department}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-700 font-bold">
                        {std.enrolledCourseCodes?.filter((c) => myCourses.some((mc) => mc.code === c)).join(', ')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setActiveNav('messages')}
                          className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
                        >
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 9: MESSAGES */}
        {activeNav === 'messages' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Faculty Messaging & Consultations</h2>
              <p className="text-xs sm:text-sm text-slate-500">Communicate directly with course representatives, students, and administration.</p>
            </div>

            <StudentChat
              currentUser={currentUser}
              allUsers={allUsers}
              messages={messages}
              onSendMessage={(receiverId, content, voiceData) => {
                try {
                  DatabaseService.sendMessage(receiverId, content, currentUser, voiceData);
                  triggerToast('Message Delivered', 'Dispatched to recipient.', 'system');
                } catch (err: any) {
                  triggerToast('Error Sending', err?.message || 'Failed to send message.', 'system');
                }
              }}
            />
          </div>
        )}

        {/* VIEW 10: TIMETABLE */}
        {activeNav === 'timetable' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Teaching & Lecture Schedule</h2>
              <p className="text-xs sm:text-sm text-slate-500">Weekly room assignments and official hours for your courses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myTimetable.map((slot) => (
                <div
                  key={slot.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                      {slot.courseCode}
                    </span>
                    <span className="font-mono font-bold text-xs bg-lime-100 text-lime-900 px-2.5 py-0.5 rounded-lg border border-lime-300">
                      {slot.day}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{slot.courseTitle}</h3>
                  
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                    <div>Time: <span className="font-mono font-bold text-slate-800">{slot.startTime} - {slot.endTime}</span></div>
                    <div>Venue: <span className="font-semibold text-slate-800">{slot.venue}</span></div>
                    <div>Target Level: <span className="font-mono text-slate-800">{slot.level}</span></div>
                  </div>
                </div>
              ))}
            </div>
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
                <h2 className="text-xl font-extrabold text-slate-900">{currentUser.title} {currentUser.name}</h2>
                <div className="text-xs font-mono font-bold text-lime-800 mt-0.5">
                  Staff ID: {currentUser.staffId} · {currentUser.campusId}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {currentUser.department} · {currentUser.faculty}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Institutional Email</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Office Consultation Location</label>
                <input
                  type="text"
                  value={currentUser.officeLocation || 'Faculty of Science Complex, Room 314'}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Academic Bio</label>
                <p className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {currentUser.bio || 'Senior Lecturer in Systems Architecture & Distributed Systems.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 12: SETTINGS */}
        {activeNav === 'settings' && (
          <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Lecturer Consultation & Notification Preferences</h2>
              <p className="text-xs text-slate-500 mt-1">Configure student submission alerts and automatic email notices.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Student Submission Alerts</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Receive immediate notification when students submit tasks</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Direct Chat Alerts</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Notify when course reps or students send inquiry messages</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: RESULT COMPILATION & SUBMISSION */}
        {activeNav === 'results_compilation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ccf32f] text-slate-950 uppercase border border-lime-400">
                    Grading & Compilation
                  </span>
                  <span className="text-xs text-slate-500 font-mono">NUC 5.00 Scale</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Course Result Compilation & Submission</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Input Continuous Assessment (max 30) and Examination (max 70) scores. Submit compiled sheet to the Result Officer.
                </p>
              </div>

              {/* Course Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 shrink-0">Course:</label>
                <select
                  value={compilingCourseCode}
                  onChange={(e) => setCompilingCourseCode(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs text-blue-700 bg-white shadow-2xs outline-none"
                >
                  {myCourses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Return Reason Alert Banner */}
            {activeResultSheet?.status === 'returned' && (
              <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-300 space-y-2">
                <div className="flex items-center gap-2.5 text-rose-800">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <h4 className="font-extrabold text-sm">Action Required: Result Sheet Returned by Result Officer</h4>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed bg-white/70 p-3 rounded-xl border border-rose-200 font-medium">
                  <span className="font-bold">Officer Note:</span> {activeResultSheet.returnReason || 'Inconsistencies detected. Please review student marks and re-submit.'}
                </p>
                <div className="text-[11px] text-rose-700 flex items-center gap-3">
                  <span>Reviewed By: {activeResultSheet.reviewedBy || 'Result Officer'}</span>
                  {activeResultSheet.reviewedAt && (
                    <span>Date: {new Date(activeResultSheet.reviewedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
            )}

            {/* Status & Action Bar */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Status</div>
                  <div className="mt-0.5">
                    {activeResultSheet?.status === 'draft' && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Draft (Unsubmitted)
                      </span>
                    )}
                    {activeResultSheet?.status === 'submitted' && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Submitted to Result Officer</span>
                      </span>
                    )}
                    {activeResultSheet?.status === 'approved' && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved by Result Officer</span>
                      </span>
                    )}
                    {activeResultSheet?.status === 'published' && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Published to Senate Broadsheet</span>
                      </span>
                    )}
                    {activeResultSheet?.status === 'returned' && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Returned for Correction</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Enrolled Candidates</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5 font-mono">
                    {activeResultSheet?.studentScores.length || 0} Students
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Course Units</div>
                  <div className="text-sm font-extrabold text-blue-700 mt-0.5 font-mono">
                    {activeResultSheet?.creditUnits || 3} Units
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Sheet</span>
                </button>

                {activeResultSheet?.status !== 'published' && activeResultSheet?.status !== 'submitted' && (
                  <>
                    <button
                      onClick={handleSaveDraft}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => setShowSubmitConfirmModal(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{activeResultSheet?.status === 'returned' ? 'Re-Submit to Result Officer' : 'Submit to Result Officer'}</span>
                    </button>
                  </>
                )}

                {activeResultSheet?.status === 'submitted' && (
                  <span className="text-xs font-medium text-amber-700 italic">
                    Scores are locked during Result Officer review.
                  </span>
                )}
                {activeResultSheet?.status === 'published' && (
                  <span className="text-xs font-medium text-blue-700 italic">
                    Sheet is locked and published to Senate records.
                  </span>
                )}
              </div>
            </div>

            {/* Scores Table */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700">
                  Continuous Assessment (CA max 30) + Examination (max 70) = Total (100)
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Grading: A(70-100), B(60-69), C(50-59), D(45-49), E(40-44), F(0-39)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">S/N</th>
                      <th className="px-4 py-3">Matric No.</th>
                      <th className="px-4 py-3">Student Full Name</th>
                      <th className="px-3 py-3 text-center w-28">CA (/30)</th>
                      <th className="px-3 py-3 text-center w-28">Exam (/70)</th>
                      <th className="px-3 py-3 text-center w-24">Total (/100)</th>
                      <th className="px-3 py-3 text-center w-20">Grade</th>
                      <th className="px-3 py-3 text-center w-16">GP</th>
                      <th className="px-4 py-3 text-center">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeResultSheet?.studentScores.map((score, idx) => {
                      const isLocked = activeResultSheet.status === 'submitted' || activeResultSheet.status === 'published';
                      const isCarryover = score.grade === 'F';

                      return (
                        <tr key={score.matricNumber} className={`hover:bg-slate-50/70 ${isCarryover ? 'bg-rose-50/30' : ''}`}>
                          <td className="px-3 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {score.matricNumber}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                            {score.studentName}
                          </td>
                          
                          {/* CA Score Input */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={30}
                              disabled={isLocked}
                              value={score.caScore ?? ''}
                              onChange={(e) => handleScoreChange(score.matricNumber, 'ca', parseFloat(e.target.value) || 0)}
                              className={`w-20 text-center py-1.5 px-2 rounded-lg border font-mono font-bold text-xs ${
                                isLocked
                                  ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                                  : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none'
                              }`}
                            />
                          </td>

                          {/* Exam Score Input */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={70}
                              disabled={isLocked}
                              value={score.examScore ?? ''}
                              onChange={(e) => handleScoreChange(score.matricNumber, 'exam', parseFloat(e.target.value) || 0)}
                              className={`w-20 text-center py-1.5 px-2 rounded-lg border font-mono font-bold text-xs ${
                                isLocked
                                  ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                                  : 'bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none'
                              }`}
                            />
                          </td>

                          {/* Computed Total */}
                          <td className="px-3 py-3 text-center font-mono font-black text-sm text-slate-900">
                            {score.totalScore ?? '-'}
                          </td>

                          {/* Grade Letter */}
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-black text-xs inline-block ${
                                score.grade === 'A'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : score.grade === 'B'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : score.grade === 'C'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : score.grade === 'D'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : score.grade === 'E'
                                  ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {score.grade}
                            </span>
                          </td>

                          {/* Grade Point */}
                          <td className="px-3 py-3 text-center font-mono font-bold text-xs text-slate-700">
                            {score.gradePoint}.00
                          </td>

                          {/* Remark */}
                          <td className="px-4 py-3 text-center">
                            {isCarryover ? (
                              <span className="text-[11px] font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                Carryover (F)
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-emerald-700">
                                Pass
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CGPA SIMULATOR / ADVISORY ENGINE */}
        {activeNav === 'cgpa_calculator' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ccf32f] text-slate-950 uppercase border border-lime-400">
                  Advisory & Simulation
                </span>
                <span className="text-xs text-slate-500 font-mono">Faculty & Student Engine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Academic CGPA Calculator & Projection Engine</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Interactive tool for estimating Cumulative Grade Point Averages and student academic advising.
              </p>
            </div>

            {/* Official Advisory Banner */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Official Academic Simulation Tool:</span>
                Estimations and grade projections calculated here are for academic guidance and semester planning. 
                Official transcripts and graduation honors are certified exclusively by the Departmental Result Officer and ratified by the University Senate.
              </div>
            </div>

            {/* Embedded CGPA Calculator Component */}
            <CGPACalculator />
          </div>
        )}

      </main>

      {/* Modal: Broadcast Announcement */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Publish Course Announcement</h3>
              </div>
              <button onClick={() => setShowAnnounceModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
                <select
                  value={annCourse}
                  onChange={(e) => setAnnCourse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-blue-700 bg-white"
                >
                  {myCourses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bulletin Headline</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Venue Rescheduled for Monday 8AM Session"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Body</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Type the message for enrolled students..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urgency</label>
                  <select
                    value={annUrgency}
                    onChange={(e) => setAnnUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={annSms}
                        onChange={(e) => setAnnSms(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>SMS Alert</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={annEmail}
                        onChange={(e) => setAnnEmail(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Email</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnnounceModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Publish & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Material */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Upload Learning Material</h3>
              </div>
              <button onClick={() => setShowMaterialModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
                <select
                  value={matCourse}
                  onChange={(e) => setMatCourse(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold text-blue-700 bg-white"
                >
                  {myCourses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="e.g. Linux Kernel System Calls & Scheduling Notes"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Syllabus Scope</label>
                <textarea
                  rows={3}
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  placeholder="Summary of topics covered, readings, and lab exercises..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">File Format</label>
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="slide">Slide Presentation</option>
                    <option value="doc">Word / Text Doc</option>
                    <option value="code">Source Code / Lab Zip</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={matTags}
                    onChange={(e) => setMatTags(e.target.value)}
                    placeholder="Slides, Revision, Lab"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Upload & Distribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Assignment */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Create New Course Assignment</h3>
              </div>
              <button onClick={() => setShowAssignmentModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Course</label>
                <select
                  value={asgCourse}
                  onChange={(e) => setAsgCourse(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold text-blue-700 bg-white"
                >
                  {myCourses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  placeholder="e.g. Sprint 2 Architectural Specification & CI/CD Pipeline"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions & Rubric</label>
                <textarea
                  rows={4}
                  required
                  value={asgDesc}
                  onChange={(e) => setAsgDesc(e.target.value)}
                  placeholder="Provide detailed instructions, submission deliverables, and grading criteria..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={asgMaxScore}
                    onChange={(e) => setAsgMaxScore(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline</label>
                  <input
                    type="date"
                    value={asgDueDate}
                    onChange={(e) => setAsgDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Grade Submission */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {gradingSubmission.courseCode}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Grade Work: {gradingSubmission.studentName} ({gradingSubmission.studentMatric})
                </h3>
              </div>
              <button onClick={() => setGradingSubmission(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-700">Student Solution Summary:</div>
              <p className="text-slate-800 leading-relaxed">{gradingSubmission.content}</p>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Awarded Score (Max {assignments.find((a) => a.id === gradingSubmission.assignmentId)?.maxScore || 30} marks)
                </label>
                <input
                  type="number"
                  min={0}
                  max={assignments.find((a) => a.id === gradingSubmission.assignmentId)?.maxScore || 100}
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lecturer Written Feedback & Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="e.g. Excellent implementation of LRU doubly-linked list. Good benchmark graphs."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  Submit Official Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Result Sheet Confirmation */}
      {showSubmitConfirmModal && activeResultSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Send className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Submit Result Sheet to Result Officer?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                You are about to submit the compiled scores for <span className="font-bold text-slate-900">{activeResultSheet.courseCode} ({activeResultSheet.studentScores.length} students)</span> to the Departmental Result Officer, <span className="font-bold text-slate-900">Dr. (Mrs.) Blessing Amadi</span>, for verification.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Course Units:</span>
                <span className="font-bold text-slate-900">{activeResultSheet.creditUnits} Units</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Session / Semester:</span>
                <span className="font-bold text-slate-900">{activeResultSheet.academicSession} · Sem {activeResultSheet.semester}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Evaluation Policy:</span>
                <span className="font-bold text-emerald-700">CA (30%) + Exam (70%)</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={handleSubmitToOfficer}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Transmit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview Result Sheet */}
      {showPreviewModal && activeResultSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-left">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={uniportCrest} alt="UNIPORT" className="w-10 h-10 object-contain" />
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Official Course Mark Sheet Preview — {activeResultSheet.courseCode}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {activeResultSheet.courseTitle} · {activeResultSheet.academicSession}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Lecturer</span>
                  <span className="font-bold text-slate-900">{activeResultSheet.lecturerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Credit Units</span>
                  <span className="font-bold text-blue-700 font-mono">{activeResultSheet.creditUnits} Units</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Department</span>
                  <span className="font-bold text-slate-900">{activeResultSheet.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Submission Status</span>
                  <span className="font-bold uppercase font-mono text-xs">{activeResultSheet.status}</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5">S/N</th>
                      <th className="px-3 py-2.5">Matric No</th>
                      <th className="px-3 py-2.5">Candidate Name</th>
                      <th className="px-3 py-2.5 text-center">CA (/30)</th>
                      <th className="px-3 py-2.5 text-center">Exam (/70)</th>
                      <th className="px-3 py-2.5 text-center">Total (/100)</th>
                      <th className="px-3 py-2.5 text-center">Grade</th>
                      <th className="px-3 py-2.5 text-center">GP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {activeResultSheet.studentScores.map((sc, idx) => (
                      <tr key={sc.matricNumber}>
                        <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-blue-700">{sc.matricNumber}</td>
                        <td className="px-3 py-2 font-sans font-bold text-slate-900">{sc.studentName}</td>
                        <td className="px-3 py-2 text-center">{sc.caScore}</td>
                        <td className="px-3 py-2 text-center">{sc.examScore}</td>
                        <td className="px-3 py-2 text-center font-bold">{sc.totalScore}</td>
                        <td className="px-3 py-2 text-center font-bold">{sc.grade}</td>
                        <td className="px-3 py-2 text-center">{sc.gradePoint}.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
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
