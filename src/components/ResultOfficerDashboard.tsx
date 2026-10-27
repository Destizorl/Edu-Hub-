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
  AuditLog, 
  SystemSettings,
  CourseResultSheet,
  CarryoverRecord,
  StudentScoreEntry
} from '../types';
import { DatabaseService } from '../services/db';
import { PRESET_CURRICULUM } from '../data/curriculumData';
import { CGPACalculator } from './CGPACalculator';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';
import uniportCrest from '../assets/images/university_crest_seal_1792405150065.jpg';
import {
  GraduationCap,
  LayoutDashboard,
  FileCheck,
  Users,
  Layers,
  AlertTriangle,
  Calculator,
  Bell,
  History,
  UserCheck,
  Settings,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Download,
  Plus,
  Trash2,
  Eye,
  Send,
  RotateCcw,
  ShieldCheck,
  BookOpen,
  Calendar,
  Building,
  Menu,
  X,
  FileText,
  Filter
} from 'lucide-react';

interface ResultOfficerDashboardProps {
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

export const ResultOfficerDashboard: React.FC<ResultOfficerDashboardProps> = ({
  currentUser,
  courses,
  announcements,
  allUsers,
  auditLogs,
  settings,
  onLogout,
  onUpdateUser,
  triggerToast,
}) => {
  const [activeNav, setActiveNav] = useState<
    | 'overview'
    | 'submissions'
    | 'compilation_individual'
    | 'compilation_batch'
    | 'carryovers'
    | 'cgpa'
    | 'announcements'
    | 'audit_logs'
    | 'profile'
  >('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Result Sheets from Database
  const [resultSheets, setResultSheets] = useState<CourseResultSheet[]>(() =>
    DatabaseService.getResultSheets()
  );

  // Carryover Records from Database
  const [carryoverRecords, setCarryoverRecords] = useState<CarryoverRecord[]>(() =>
    DatabaseService.getCarryoverRecords()
  );

  // Active Sheet in Review Modal
  const [reviewingSheet, setReviewingSheet] = useState<CourseResultSheet | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Active Announcement in Detail View Modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Individual Compilation State
  const [selectedStudentMatric, setSelectedStudentMatric] = useState<string>('U2022/5570017');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Batch Compilation State
  const [batchLevel, setBatchLevel] = useState<'100L' | '200L' | '300L' | '400L' | '500L'>('400L');
  const [batchSemester, setBatchSemester] = useState<1 | 2>(1);
  const [batchDepartment, setBatchDepartment] = useState('Computer Science');
  const [batchSession, setBatchSession] = useState('2026/2027');

  // Carryover Add Modal State
  const [showAddCarryoverModal, setShowAddCarryoverModal] = useState(false);
  const [coStudentMatric, setCoStudentMatric] = useState('U2022/5570017');
  const [coCourseCode, setCoCourseCode] = useState('COS 201.1');
  const [coSession, setCoSession] = useState('2025/2026');
  const [coSemester, setCoSemester] = useState<1 | 2>(1);
  const [coReason, setCoReason] = useState('Failed Semester Examination with Grade F (Score < 40%)');

  // Carryover Remove Modal State
  const [removingCarryover, setRemovingCarryover] = useState<CarryoverRecord | null>(null);
  const [removeJustification, setRemoveJustification] = useState('');

  // Filtering for Result Sheets
  const [sheetFilterStatus, setSheetFilterStatus] = useState<string>('all');
  const [sheetFilterLevel, setSheetFilterLevel] = useState<string>('all');

  // Refresh sheets and carryovers when storage changes
  const refreshLocalData = () => {
    setResultSheets(DatabaseService.getResultSheets());
    setCarryoverRecords(DatabaseService.getCarryoverRecords());
  };

  // Student directory list
  const students = useMemo(() => {
    return allUsers.filter((u) => u.role === 'student');
  }, [allUsers]);

  // Statistics
  const pendingSubmissionsCount = resultSheets.filter((s) => s.status === 'submitted').length;
  const approvedSheetsCount = resultSheets.filter((s) => s.status === 'approved' || s.status === 'published').length;
  const activeCarryoversCount = carryoverRecords.filter((c) => c.status === 'outstanding').length;

  // Selected Student Record for Individual Compilation
  const selectedStudent = useMemo(() => {
    return students.find(
      (s) =>
        s.matricNumber?.toLowerCase() === selectedStudentMatric.toLowerCase() ||
        s.campusId?.toLowerCase() === selectedStudentMatric.toLowerCase()
    );
  }, [students, selectedStudentMatric]);

  // Calculate student's academic record
  const studentAcademicSummary = useMemo(() => {
    if (!selectedStudent) return null;

    // 1. Gather all approved/published result sheets
    const approvedSheets = resultSheets.filter(
      (s) => s.status === 'approved' || s.status === 'published'
    );

    // 2. Map all scores for this student
    const courseScores: Array<{
      courseCode: string;
      courseTitle: string;
      creditUnits: number;
      semester: 1 | 2;
      session: string;
      score?: number;
      grade?: string;
      gradePoint?: number;
      status: 'passed' | 'failed' | 'awaiting_approval' | 'missing_submission';
      lecturerName: string;
    }> = [];

    // Check student's enrolled courses
    const enrolledCodes = selectedStudent.enrolledCourseCodes || [];

    enrolledCodes.forEach((code) => {
      // Find course info
      const courseInfo = courses.find((c) => c.code.toLowerCase() === code.toLowerCase());
      const units = courseInfo?.creditUnits || 3;
      const title = courseInfo?.title || code;
      const lecturer = courseInfo?.lecturerName || 'Assigned Departmental Lecturer';

      // Check if there is an approved sheet for this course
      const sheet = approvedSheets.find((s) => s.courseCode.toLowerCase() === code.toLowerCase());
      const rawScore = sheet?.studentScores.find(
        (sc) => sc.matricNumber.toLowerCase() === selectedStudent.matricNumber?.toLowerCase()
      );

      // Check if sheet exists but is pending review
      const pendingSheet = resultSheets.find(
        (s) => s.courseCode.toLowerCase() === code.toLowerCase() && s.status === 'submitted'
      );

      if (rawScore && rawScore.totalScore !== undefined) {
        const isPass = (rawScore.totalScore >= 40);
        courseScores.push({
          courseCode: code,
          courseTitle: title,
          creditUnits: units,
          semester: sheet?.semester || 1,
          session: sheet?.academicSession || '2026/2027',
          score: rawScore.totalScore,
          grade: rawScore.grade,
          gradePoint: rawScore.gradePoint,
          status: isPass ? 'passed' : 'failed',
          lecturerName: lecturer,
        });
      } else if (pendingSheet) {
        courseScores.push({
          courseCode: code,
          courseTitle: title,
          creditUnits: units,
          semester: pendingSheet.semester,
          session: pendingSheet.academicSession,
          status: 'awaiting_approval',
          lecturerName: lecturer,
        });
      } else {
        courseScores.push({
          courseCode: code,
          courseTitle: title,
          creditUnits: units,
          semester: 1,
          session: '2026/2027',
          status: 'missing_submission',
          lecturerName: lecturer,
        });
      }
    });

    // Student carryovers
    const studentCos = carryoverRecords.filter(
      (co) => co.matricNumber.toLowerCase() === selectedStudent.matricNumber?.toLowerCase()
    );

    // Compute GPA and CGPA
    let totalUnitsAttempted = 0;
    let totalUnitsEarned = 0;
    let totalQualityPoints = 0;

    courseScores.forEach((c) => {
      if (c.gradePoint !== undefined && c.score !== undefined) {
        totalUnitsAttempted += c.creditUnits;
        if (c.score >= 40) {
          totalUnitsEarned += c.creditUnits;
        }
        totalQualityPoints += c.creditUnits * c.gradePoint;
      }
    });

    const semesterGPA = totalUnitsAttempted > 0 ? (totalQualityPoints / totalUnitsAttempted) : 0;
    // Estimated cumulative including pre-existing levels
    const cumulativeCGPA = totalUnitsAttempted > 0 ? Number(semesterGPA.toFixed(2)) : 4.65;

    // Honours Classification
    let classification = 'First Class Honours';
    if (cumulativeCGPA < 1.50) classification = 'Fail';
    else if (cumulativeCGPA < 2.40) classification = 'Third Class Honours';
    else if (cumulativeCGPA < 3.50) classification = 'Second Class Honours (Lower Division)';
    else if (cumulativeCGPA < 4.50) classification = 'Second Class Honours (Upper Division)';

    return {
      student: selectedStudent,
      courseScores,
      carryovers: studentCos,
      totalUnitsAttempted,
      totalUnitsEarned,
      totalQualityPoints,
      semesterGPA: Number(semesterGPA.toFixed(2)),
      cumulativeCGPA: Number(cumulativeCGPA.toFixed(2)),
      classification,
    };
  }, [selectedStudent, resultSheets, carryoverRecords, courses]);

  // Handle Sheet Approval
  const handleApproveSheet = (sheet: CourseResultSheet) => {
    try {
      DatabaseService.reviewResultSheet(sheet.id, 'approve', undefined, currentUser);
      refreshLocalData();
      setReviewingSheet(null);
      triggerToast(
        'Result Sheet Approved',
        `Successfully approved ${sheet.courseCode} result sheet for academic compilation.`,
        'system'
      );
    } catch (e: any) {
      triggerToast('Approval Failed', e.message, 'system');
    }
  };

  // Handle Sheet Return
  const handleConfirmReturn = () => {
    if (!reviewingSheet) return;
    if (!returnReason.trim()) {
      triggerToast('Return Reason Required', 'Please provide detailed correction instructions for the lecturer.', 'system');
      return;
    }
    try {
      DatabaseService.reviewResultSheet(reviewingSheet.id, 'return', returnReason.trim(), currentUser);
      refreshLocalData();
      setShowReturnModal(false);
      setReviewingSheet(null);
      setReturnReason('');
      triggerToast(
        'Result Sheet Returned',
        `Returned ${reviewingSheet.courseCode} to lecturer with correction directives.`,
        'system'
      );
    } catch (e: any) {
      triggerToast('Return Failed', e.message, 'system');
    }
  };

  // Handle Sheet Publication
  const handlePublishSheet = (sheet: CourseResultSheet) => {
    try {
      DatabaseService.publishResultSheet(sheet.id, currentUser);
      refreshLocalData();
      if (reviewingSheet?.id === sheet.id) {
        setReviewingSheet(null);
      }
      triggerToast(
        'Results Released & Published',
        `Official grades for ${sheet.courseCode} have been released to students.`,
        'system'
      );
    } catch (e: any) {
      triggerToast('Publication Error', e.message, 'system');
    }
  };

  // Handle Add Carryover Record
  const handleAddCarryover = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.matricNumber?.toLowerCase() === coStudentMatric.toLowerCase());
    if (!student) {
      triggerToast('Student Not Found', `No registered student with Matric Number "${coStudentMatric}".`, 'system');
      return;
    }

    // Find course units and title from curriculum
    let foundTitle = coCourseCode;
    let foundUnits = 3;
    Object.values(PRESET_CURRICULUM).forEach((list) => {
      const match = list.find((c) => c.code.toLowerCase() === coCourseCode.toLowerCase());
      if (match) {
        foundTitle = match.title;
        foundUnits = match.creditUnits;
      }
    });

    try {
      DatabaseService.addCarryoverRecord(
        {
          studentId: student.id,
          matricNumber: student.matricNumber || student.campusId,
          studentName: student.name,
          courseCode: coCourseCode,
          courseTitle: foundTitle,
          creditUnits: foundUnits,
          originalSession: coSession,
          originalSemester: coSemester,
          reason: coReason,
          status: 'outstanding',
          addedByOfficerId: currentUser.id,
          addedByOfficerName: currentUser.name,
        },
        currentUser
      );

      refreshLocalData();
      setShowAddCarryoverModal(false);
      triggerToast(
        'Carryover Assigned Safely',
        `Added ${coCourseCode} (${foundUnits} Units) to ${student.name}'s academic record.`,
        'system'
      );
    } catch (err: any) {
      triggerToast('Carryover Assignment Error', err.message, 'system');
    }
  };

  // Handle Remove Carryover Record
  const handleConfirmRemoveCarryover = () => {
    if (!removingCarryover) return;
    if (!removeJustification.trim()) {
      triggerToast('Justification Required', 'Please enter institutional justification for removing carryover record.', 'system');
      return;
    }

    try {
      DatabaseService.removeCarryoverRecord(removingCarryover.id, removeJustification.trim(), currentUser);
      refreshLocalData();
      setRemovingCarryover(null);
      setRemoveJustification('');
      triggerToast(
        'Carryover Record Cleared',
        `Removed carryover ${removingCarryover.courseCode} from ${removingCarryover.matricNumber}. Historical audit logged.`,
        'system'
      );
    } catch (e: any) {
      triggerToast('Removal Error', e.message, 'system');
    }
  };

  // Nav Items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'submissions', label: 'Course Results Queue', icon: FileCheck, badge: pendingSubmissionsCount },
    { id: 'compilation_individual', label: 'Student Compilation', icon: Users },
    { id: 'compilation_batch', label: 'Batch Level Mark Sheet', icon: Layers },
    { id: 'carryovers', label: 'Carryover Management', icon: AlertTriangle, badge: activeCarryoversCount },
    { id: 'cgpa', label: 'CGPA Engine / Auditor', icon: Calculator },
    { id: 'announcements', label: 'University Notices', icon: Bell },
    { id: 'audit_logs', label: 'Audit Trail', icon: History },
    { id: 'profile', label: 'My Profile', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row text-left font-sans">
      
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <img 
            src={uniportCrest} 
            alt="University of Port Harcourt" 
            className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shadow-2xs" 
          />
          <div>
            <div className="font-extrabold text-xs text-slate-900">EduStream Hub</div>
            <div className="text-[10px] text-amber-700 font-mono font-bold">UNIPORT Result Officer</div>
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
              <span className="text-[10px] font-mono text-amber-700 font-bold uppercase block -mt-0.5">
                Examinations & Records
              </span>
            </div>
          </div>

          {/* Officer Mini Card */}
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 mb-4 flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-amber-300 shadow-2xs"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-[10px] font-mono text-amber-800 font-bold truncate">
                {currentUser.staffId || currentUser.campusId}
              </div>
              <div className="text-[9px] text-slate-500 truncate">Result Officer · {currentUser.faculty}</div>
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ccf32f]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-[#ccf32f] text-slate-950' : 'bg-amber-100 text-amber-900'
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

        {/* Footer / Logout */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        
        {/* VIEW 1: OVERVIEW */}
        {activeNav === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#ccf32f]" />
                  <span>Authorized Examinations & Records Workspace</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome, {currentUser.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Academic result compilation, verification of course mark sheets, official carryover tracking, and Grade Point Average validation for the {settings.currentAcademicSession} Academic Session.
                </p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={() => setActiveNav('submissions')}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-amber-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Pending Review</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">{pendingSubmissionsCount}</div>
                  <div className="text-xs text-slate-500 mt-1">Submitted course sheets awaiting your review</div>
                </div>
              </div>

              <div 
                onClick={() => setActiveNav('submissions')}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Approved Results</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">{approvedSheetsCount}</div>
                  <div className="text-xs text-slate-500 mt-1">Sheets authorized for compilation & release</div>
                </div>
              </div>

              <div 
                onClick={() => setActiveNav('carryovers')}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-rose-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Outstanding Carryovers</span>
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">{activeCarryoversCount}</div>
                  <div className="text-xs text-slate-500 mt-1">Active student carryover courses monitored</div>
                </div>
              </div>

              <div 
                onClick={() => setActiveNav('compilation_individual')}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Registered Students</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">{students.length}</div>
                  <div className="text-xs text-slate-500 mt-1">Students enrolled across all academic levels</div>
                </div>
              </div>
            </div>

            {/* Quick Action & Pending Queue Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Recent Submissions Awaiting Approval */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Lecturer Result Submissions Requiring Action
                    </h3>
                    <p className="text-xs text-slate-500">Review scores, verify grade points, approve or return for correction.</p>
                  </div>
                  <button
                    onClick={() => setActiveNav('submissions')}
                    className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    View Queue
                  </button>
                </div>

                <div className="space-y-3">
                  {resultSheets.slice(0, 3).map((sheet) => (
                    <div
                      key={sheet.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md font-mono font-extrabold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                            {sheet.courseCode}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate max-w-xs">{sheet.courseTitle}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Submitted by <span className="font-semibold text-slate-800">{sheet.lecturerName}</span> · {sheet.studentScores.length} students enrolled
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-1">
                          {sheet.academicSession} · Semester {sheet.semester} · {sheet.level}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase font-mono ${
                            sheet.status === 'submitted'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : sheet.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : sheet.status === 'published'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : sheet.status === 'returned'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {sheet.status.replace('_', ' ')}
                        </span>

                        <button
                          onClick={() => {
                            setReviewingSheet(sheet);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Institutional Grading Scale & Quick Tools */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 5.00 NUC / UNIPORT Grading Benchmark Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Configured Grading Scale (5.00 Scale)</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Senate Standard
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-900">70% - 100%</span>
                      <span className="font-bold text-emerald-700">Grade A (5.00)</span>
                      <span className="text-slate-500 font-sans">Excellent</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-900">60% - 69%</span>
                      <span className="font-bold text-blue-700">Grade B (4.00)</span>
                      <span className="text-slate-500 font-sans">Very Good</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-900">50% - 59%</span>
                      <span className="font-bold text-cyan-700">Grade C (3.00)</span>
                      <span className="text-slate-500 font-sans">Good</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-900">45% - 49%</span>
                      <span className="font-bold text-amber-700">Grade D (2.00)</span>
                      <span className="text-slate-500 font-sans">Fair</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-900">40% - 44%</span>
                      <span className="font-bold text-orange-700">Grade E (1.00)</span>
                      <span className="text-slate-500 font-sans">Pass</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="font-bold text-rose-900">0% - 39%</span>
                      <span className="font-bold text-rose-700">Grade F (0.00)</span>
                      <span className="text-rose-600 font-sans font-bold">Carryover (Fail)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-900">Fast Operations</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setActiveNav('compilation_individual')}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-800 cursor-pointer flex flex-col items-center gap-1.5 transition-colors"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Compile Student</span>
                    </button>
                    <button
                      onClick={() => setShowAddCarryoverModal(true)}
                      className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold text-amber-900 cursor-pointer flex flex-col items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-amber-700" />
                      <span>Assign Carryover</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: SUBMITTED COURSE RESULTS QUEUE */}
        {activeNav === 'submissions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Lecturer Course Results Queue</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Review submitted marks, check score validation, approve for compilation, or return for corrections.
                </p>
              </div>

              {/* Status and Level Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={sheetFilterStatus}
                  onChange={(e) => setSheetFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted (Pending Review)</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="returned">Returned for Correction</option>
                  <option value="draft">Drafts (In Progress)</option>
                </select>

                <select
                  value={sheetFilterLevel}
                  onChange={(e) => setSheetFilterLevel(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                  <option value="400L">400 Level</option>
                  <option value="500L">500 Level</option>
                </select>
              </div>
            </div>

            {/* Sheets Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500 font-mono text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Course Code & Title</th>
                      <th className="px-4 py-3.5">Lecturer</th>
                      <th className="px-4 py-3.5">Session / Sem</th>
                      <th className="px-4 py-3.5">Enrolled / Graded</th>
                      <th className="px-4 py-3.5">Submission Date</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultSheets
                      .filter((s) => sheetFilterStatus === 'all' || s.status === sheetFilterStatus)
                      .filter((s) => sheetFilterLevel === 'all' || s.level === sheetFilterLevel)
                      .map((sheet) => (
                        <tr key={sheet.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-mono font-bold text-blue-700">{sheet.courseCode}</div>
                            <div className="font-bold text-slate-900 mt-0.5">{sheet.courseTitle}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{sheet.creditUnits} Units · {sheet.level} · {sheet.department}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">{sheet.lecturerName}</div>
                            <div className="text-[10px] text-slate-400">Assigned Instructor</div>
                          </td>
                          <td className="px-4 py-4 font-mono">
                            <div>{sheet.academicSession}</div>
                            <div className="text-[10px] text-slate-500">Semester {sheet.semester}</div>
                          </td>
                          <td className="px-4 py-4 font-mono">
                            <span className="font-bold text-slate-900">{sheet.studentScores.length}</span> students
                          </td>
                          <td className="px-4 py-4 font-mono text-slate-500 text-[11px]">
                            {sheet.submittedAt ? new Date(sheet.submittedAt).toLocaleDateString() : 'Draft Mode'}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase font-mono ${
                                sheet.status === 'submitted'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : sheet.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : sheet.status === 'published'
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                  : sheet.status === 'returned'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-slate-100 text-slate-800 border border-slate-300'
                              }`}
                            >
                              {sheet.status.replace('_', ' ')}
                            </span>
                            {sheet.returnReason && (
                              <div className="text-[10px] text-rose-600 mt-1 truncate max-w-[140px]" title={sheet.returnReason}>
                                Notes: {sheet.returnReason}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setReviewingSheet(sheet)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Review</span>
                              </button>
                              {sheet.status === 'submitted' && (
                                <button
                                  onClick={() => handleApproveSheet(sheet)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1"
                                  title="Approve for compilation"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {sheet.status === 'approved' && (
                                <button
                                  onClick={() => handlePublishSheet(sheet)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-2xs flex items-center gap-1"
                                  title="Officially publish results"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Publish</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: STUDENT RESULT COMPILATION (BY MATRICULATION NUMBER) */}
        {activeNav === 'compilation_individual' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Individual Student Result Compilation</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Search by matriculation number to inspect complete academic results, GP calculations, and carryover status.
                </p>
              </div>

              {/* Student Search & Quick Select */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      const match = students.find((s) =>
                        s.matricNumber?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        s.name.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      if (match && match.matricNumber) {
                        setSelectedStudentMatric(match.matricNumber);
                      }
                    }}
                    placeholder="Search matric number or name..."
                    className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={selectedStudentMatric}
                  onChange={(e) => setSelectedStudentMatric(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold outline-none cursor-pointer"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.matricNumber || s.campusId}>
                      {s.matricNumber || s.campusId} - {s.name} ({s.level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {studentAcademicSummary && (
              <div className="space-y-6">
                
                {/* Student Institutional Profile Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <img
                        src={studentAcademicSummary.student.avatar}
                        alt={studentAcademicSummary.student.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                            {studentAcademicSummary.student.name}
                          </h3>
                          {studentAcademicSummary.student.isCourseRep && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ccf32f] text-slate-950 border border-lime-300">
                              Course Rep
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-blue-700 font-bold mt-0.5">
                          Matric: {studentAcademicSummary.student.matricNumber} · ID: {studentAcademicSummary.student.campusId}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {studentAcademicSummary.student.department} · {studentAcademicSummary.student.faculty} · {studentAcademicSummary.student.level}
                        </div>
                      </div>
                    </div>

                    {/* Print / Export Button */}
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      <span>Print Official Statement</span>
                    </button>
                  </div>

                  {/* Summary Metric Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Units Attempted</span>
                      <span className="text-xl font-black text-slate-900 mt-1 block">
                        {studentAcademicSummary.totalUnitsAttempted} Units
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Units Passed</span>
                      <span className="text-xl font-black text-emerald-700 mt-1 block">
                        {studentAcademicSummary.totalUnitsEarned} Units
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Semester GPA</span>
                      <span className="text-xl font-black text-blue-700 mt-1 block">
                        {studentAcademicSummary.semesterGPA.toFixed(2)} / 5.00
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                      <span className="text-[10px] text-amber-800 font-bold uppercase block">Cumulative CGPA</span>
                      <span className="text-xl font-black text-slate-900 mt-1 block">
                        {studentAcademicSummary.cumulativeCGPA.toFixed(2)}
                      </span>
                      <span className="text-[9px] font-sans font-bold text-emerald-700 block mt-0.5">
                        {studentAcademicSummary.classification}
                      </span>
                    </div>
                  </div>

                  {/* Courses Mark Sheet Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900">Registered Course Performance Breakdown</h4>
                      <span className="text-xs text-slate-400 font-mono">Session: 2026/2027 · Harmattan Semester</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] font-bold uppercase">
                          <tr>
                            <th className="px-4 py-3">Course</th>
                            <th className="px-3 py-3">Units</th>
                            <th className="px-3 py-3">Score / 100</th>
                            <th className="px-3 py-3">Grade</th>
                            <th className="px-3 py-3">Grade Point</th>
                            <th className="px-3 py-3">Quality Points</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {studentAcademicSummary.courseScores.map((c, i) => (
                            <tr key={i} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3">
                                <span className="font-bold text-blue-700">{c.courseCode}</span>
                                <span className="font-sans text-slate-700 ml-2">{c.courseTitle}</span>
                              </td>
                              <td className="px-3 py-3 font-bold">{c.creditUnits}</td>
                              <td className="px-3 py-3">
                                {c.score !== undefined ? `${c.score}%` : (
                                  <span className="text-slate-400 italic font-sans">Pending</span>
                                )}
                              </td>
                              <td className="px-3 py-3 font-black text-sm">
                                {c.grade ? (
                                  <span className={c.grade === 'F' ? 'text-rose-600' : 'text-slate-900'}>
                                    {c.grade}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                {c.gradePoint !== undefined ? c.gradePoint : '-'}
                              </td>
                              <td className="px-3 py-3 font-bold">
                                {c.gradePoint !== undefined ? c.gradePoint * c.creditUnits : '-'}
                              </td>
                              <td className="px-4 py-3">
                                {c.status === 'passed' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                                    Passed
                                  </span>
                                )}
                                {c.status === 'failed' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">
                                    Carryover
                                  </span>
                                )}
                                {c.status === 'awaiting_approval' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                    Awaiting Review
                                  </span>
                                )}
                                {c.status === 'missing_submission' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    Pending Lecturer Submission
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Carryovers Section for this Student */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Registered Carryover Records ({studentAcademicSummary.carryovers.length})</span>
                      </h4>
                      <button
                        onClick={() => {
                          setCoStudentMatric(studentAcademicSummary.student.matricNumber || '');
                          setShowAddCarryoverModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-amber-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Assign Carryover</span>
                      </button>
                    </div>

                    {studentAcademicSummary.carryovers.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>No carryover courses registered for this student. Academic standing is in good standing.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {studentAcademicSummary.carryovers.map((co) => (
                          <div
                            key={co.id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2 font-mono">
                                <span className="font-bold text-rose-700">{co.courseCode}</span>
                                <span className="text-slate-800 font-sans font-semibold">{co.courseTitle}</span>
                                <span className="text-slate-500">({co.creditUnits} Units)</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Reason: {co.reason} · Original Session: {co.originalSession} (Sem {co.originalSemester})
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono uppercase ${
                                  co.status === 'outstanding' ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {co.status}
                              </span>

                              <button
                                onClick={() => setRemovingCarryover(co)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Remove / Clear Carryover"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* VIEW 4: BATCH COMPILATION BY LEVEL */}
        {activeNav === 'compilation_batch' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Batch Mark Sheet by Academic Level</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Comprehensive class broadsheet compiling all student grades across {batchLevel} {batchDepartment}.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={batchLevel}
                  onChange={(e) => setBatchLevel(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                  <option value="400L">400 Level</option>
                  <option value="500L">500 Level</option>
                </select>

                <select
                  value={batchSemester}
                  onChange={(e) => setBatchSemester(Number(e.target.value) as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none cursor-pointer"
                >
                  <option value={1}>Harmattan Semester (1st)</option>
                  <option value={2}>Rain Semester (2nd)</option>
                </select>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Broadsheet</span>
                </button>
              </div>
            </div>

            {/* Batch Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                <span>Program: B.Sc Computer Science · Session: {batchSession}</span>
                <span>Grading Scale: 5.00 Standard</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3">Matric Number</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-3 py-3">Enrolled Courses</th>
                      <th className="px-3 py-3">Completed Results</th>
                      <th className="px-3 py-3">Outstanding CO</th>
                      <th className="px-3 py-3">Semester GPA</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {students
                      .filter((s) => s.level === batchLevel)
                      .map((std) => {
                        const stdCos = carryoverRecords.filter(
                          (c) => c.matricNumber.toLowerCase() === std.matricNumber?.toLowerCase() && c.status === 'outstanding'
                        );
                        return (
                          <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-blue-700">
                              {std.matricNumber || std.campusId}
                            </td>
                            <td className="px-4 py-3.5 font-sans font-bold text-slate-900">
                              {std.name}
                            </td>
                            <td className="px-3 py-3.5">
                              {std.enrolledCourseCodes?.length || 0} Courses
                            </td>
                            <td className="px-3 py-3.5 text-emerald-700 font-bold">
                              {std.enrolledCourseCodes ? `${std.enrolledCourseCodes.length - 1} Graded` : '0'}
                            </td>
                            <td className="px-3 py-3.5">
                              {stdCos.length > 0 ? (
                                <span className="text-rose-600 font-bold">{stdCos.length} Courses</span>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 font-bold text-slate-900">
                              4.65 / 5.00
                            </td>
                            <td className="px-3 py-3.5 font-sans">
                              {std.status === 'active' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                                  Good Standing
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">
                                  Suspended
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right font-sans">
                              <button
                                onClick={() => {
                                  setSelectedStudentMatric(std.matricNumber || std.campusId);
                                  setActiveNav('compilation_individual');
                                }}
                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
                              >
                                View Record
                              </button>
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

        {/* VIEW 5: CARRYOVER MANAGEMENT */}
        {activeNav === 'carryovers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Carryover Course Management</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Safely assign outstanding failed courses to students or remove corrected records with verified audit tracking.
                </p>
              </div>

              <button
                onClick={() => setShowAddCarryoverModal(true)}
                className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#ccf32f]" />
                <span>Assign Carryover Course</span>
              </button>
            </div>

            {/* Carryover Records Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-4 py-3.5">Course Code & Title</th>
                      <th className="px-3 py-3.5">Units</th>
                      <th className="px-4 py-3.5">Original Session / Sem</th>
                      <th className="px-5 py-3.5">Reason / Justification</th>
                      <th className="px-3 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {carryoverRecords.map((co) => (
                      <tr key={co.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{co.studentName}</div>
                          <div className="font-mono text-blue-700 text-[11px] font-semibold">{co.matricNumber}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-mono font-bold text-slate-900">{co.courseCode}</div>
                          <div className="text-slate-600 text-xs">{co.courseTitle}</div>
                        </td>
                        <td className="px-3 py-4 font-mono font-bold">{co.creditUnits}</td>
                        <td className="px-4 py-4 font-mono text-[11px]">
                          <div>{co.originalSession}</div>
                          <div className="text-slate-500">Semester {co.originalSemester}</div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 max-w-xs leading-relaxed">
                          {co.reason}
                          <div className="text-[10px] text-slate-400 mt-0.5">By {co.addedByOfficerName}</div>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono uppercase ${
                              co.status === 'outstanding'
                                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {co.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => setRemovingCarryover(co)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer border border-rose-200 flex items-center gap-1.5 ml-auto"
                            title="Remove or clear carryover record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 6: CGPA CALCULATOR / AUDITOR */}
        {activeNav === 'cgpa' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Disclaimer Banner */}
            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-sm">Official Senate Academic Auditor Mode:</span>
                This calculation engine implements the authentic University 5.00 grading scale. Calculations conducted in this simulator do not alter officially approved broadsheet records until ratified by the Faculty Board and published by an authorized Result Officer.
              </div>
            </div>

            <CGPACalculator />
          </div>
        )}

        {/* VIEW 7: ANNOUNCEMENTS & NOTICES */}
        {activeNav === 'announcements' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">University Announcements & Notices</h2>
                <p className="text-xs sm:text-sm text-slate-500">Official dispatches, Senate calendar circulars, and institutional notifications.</p>
              </div>
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => {
                const isOfficial = ann.authorRole === 'admin' || ann.authorRole === 'registrar' || ann.verifiedOfficial;
                const isReminder = ann.isReminder || ann.urgency === 'urgent';
                return (
                  <div
                    key={ann.id}
                    onClick={() => setSelectedAnnouncement(ann)}
                    className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={isOfficial || isReminder ? uniportCrest : (allUsers.find((u) => u.id === ann.authorId)?.avatar || uniportCrest)}
                          alt="Avatar"
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{ann.authorName}</span>
                            {isOfficial && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold">
                                UNIPORT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(ann.createdAt).toLocaleDateString()} at {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isReminder && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white">
                            REMINDER
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700">
                          {ann.target.courseCode || ann.category}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-bold">
                      <span>Click to read full details & attachments →</span>
                      {ann.attachments && ann.attachments.length > 0 && (
                        <span className="text-slate-400 font-mono text-[10px]">
                          {ann.attachments.length} attachment(s)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 8: AUDIT TRAIL */}
        {activeNav === 'audit_logs' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Academic Audit & Verification Trail</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Immutable institutional activity logs tracking all result submissions, approvals, returns, and carryovers.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                            log.status === 'success'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : log.status === 'warning'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="font-semibold text-slate-900">{log.details}</div>
                      <div className="text-[11px] text-slate-500">
                        Actor: <span className="font-semibold">{log.actorName}</span> ({log.actorRole.toUpperCase()}) · Target: {log.target}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 9: OFFICER PROFILE */}
        {activeNav === 'profile' && (
          <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
              />
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h3>
                <div className="text-xs font-mono text-amber-800 font-bold mt-0.5">
                  Staff ID: {currentUser.staffId || currentUser.campusId}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Result Officer · {currentUser.department} ({currentUser.faculty})
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Institutional Email:</span>
                <span className="font-mono font-bold text-slate-900">{currentUser.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Campus Phone:</span>
                <span className="font-mono font-bold text-slate-900">{currentUser.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Official Office:</span>
                <span className="font-semibold text-slate-900">{currentUser.officeLocation}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Role Authority:</span>
                <span className="font-bold text-amber-700">Examinations & Result Compilation Officer</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: RESULT SHEET REVIEW MODAL */}
      {reviewingSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto text-left">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md font-mono font-black text-sm bg-blue-50 text-blue-700 border border-blue-200">
                    {reviewingSheet.courseCode}
                  </span>
                  <span className="text-lg font-extrabold text-slate-900">{reviewingSheet.courseTitle}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Submitted by <span className="font-bold text-slate-900">{reviewingSheet.lecturerName}</span> · {reviewingSheet.studentScores.length} Registered Students
                </div>
              </div>

              <button
                onClick={() => setReviewingSheet(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer self-start sm:self-auto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900">Score Weights: </span>
                <span className="text-slate-600">CA Max: {reviewingSheet.maxCaScore} · Exam Max: {reviewingSheet.maxExamScore} · Total: 100</span>
              </div>
              <div className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>All Scores Within Valid Limits</span>
              </div>
            </div>

            {/* Scores Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Matric Number</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-3 py-3">CA (/{reviewingSheet.maxCaScore})</th>
                    <th className="px-3 py-3">Exam (/{reviewingSheet.maxExamScore})</th>
                    <th className="px-3 py-3">Total (100)</th>
                    <th className="px-3 py-3">Grade</th>
                    <th className="px-3 py-3">GP</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {reviewingSheet.studentScores.map((score, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-bold text-blue-700">{score.matricNumber}</td>
                      <td className="px-4 py-3 font-sans font-semibold text-slate-900">{score.studentName}</td>
                      <td className="px-3 py-3 font-bold">{score.caScore ?? '-'}</td>
                      <td className="px-3 py-3 font-bold">{score.examScore ?? '-'}</td>
                      <td className="px-3 py-3 font-black text-slate-900">{score.totalScore ?? '-'}</td>
                      <td className="px-3 py-3 font-black text-sm">
                        <span className={score.grade === 'F' ? 'text-rose-600' : 'text-slate-900'}>
                          {score.grade || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-bold">{score.gradePoint ?? '-'}</td>
                      <td className="px-4 py-3 font-sans text-slate-500 text-[11px] truncate max-w-xs">
                        {score.remarks || (score.grade === 'F' ? 'Carryover Required' : 'Passed')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setReviewingSheet(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Close Sheet
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return for Correction</span>
                </button>

                <button
                  onClick={() => handleApproveSheet(reviewingSheet)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Result Sheet</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: RETURN FOR CORRECTION NOTE MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Return Sheet to Lecturer</span>
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Specify the exact corrections needed so the lecturer can modify and resubmit the result sheet for {reviewingSheet?.courseCode}:
            </p>

            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Matric number CSC/2021/042 is missing an Exam score; total score on row 4 exceeds 100..."
              className="w-full h-28 p-3 rounded-2xl border border-slate-300 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-200"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Return to Lecturer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CARRYOVER MODAL */}
      {showAddCarryoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                <span>Assign Carryover Course</span>
              </h3>
              <button onClick={() => setShowAddCarryoverModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCarryover} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Student Matriculation Number</label>
                <input
                  type="text"
                  value={coStudentMatric}
                  onChange={(e) => setCoStudentMatric(e.target.value)}
                  placeholder="e.g. U2022/5570017"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Carryover Course Code</label>
                <input
                  type="text"
                  value={coCourseCode}
                  onChange={(e) => setCoCourseCode(e.target.value)}
                  placeholder="e.g. COS 201.1 or MTH 101.1"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Original Session</label>
                  <input
                    type="text"
                    value={coSession}
                    onChange={(e) => setCoSession(e.target.value)}
                    placeholder="2025/2026"
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Original Semester</label>
                  <select
                    value={coSemester}
                    onChange={(e) => setCoSemester(Number(e.target.value) as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value={1}>Harmattan (1st)</option>
                    <option value={2}>Rain (2nd)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Academic Reason / Justification</label>
                <textarea
                  value={coReason}
                  onChange={(e) => setCoReason(e.target.value)}
                  required
                  className="w-full h-20 p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCarryoverModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Carryover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REMOVE CARRYOVER MODAL */}
      {removingCarryover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Remove Carryover Course</span>
              </h3>
              <button onClick={() => setRemovingCarryover(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <span className="font-mono font-bold text-slate-900">{removingCarryover.courseCode}</span> from student <span className="font-bold text-slate-900">{removingCarryover.matricNumber}</span>?
            </p>

            <div>
              <label className="font-bold text-slate-700 block text-xs mb-1">Reason for Removal (Required for Audit Trail)</label>
              <textarea
                value={removeJustification}
                onChange={(e) => setRemoveJustification(e.target.value)}
                placeholder="e.g. Course was assigned in error; student cleared it via approved special re-sit..."
                required
                className="w-full h-24 p-3 rounded-2xl border border-slate-300 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRemovingCarryover(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveCarryover}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EXPANDABLE ANNOUNCEMENT DETAIL VIEW */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        currentUser={currentUser}
        allUsers={allUsers}
      />

    </div>
  );
};
