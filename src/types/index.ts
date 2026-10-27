export type UserRole = 'student' | 'lecturer' | 'admin' | 'registrar' | 'result_officer';
export type AccountStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  campusId: string; // Unified unique institutional ID (e.g., STU-2026-001 or CSC/2021/042, LEC-2026-001, ADM-2026-001, RO-2026-001)
  name: string;
  email: string;
  phone: string;
  password?: string; // Authenticated credential
  role: UserRole;
  status: AccountStatus;
  avatar: string;
  faculty: string;
  department: string;
  level?: string; // e.g. "100L", "200L", "300L", "400L", "500L"
  matricNumber?: string; // For students
  staffId?: string; // For faculty/admins/officers
  isCourseRep?: boolean; // Appointed course representative
  enrolledCourseCodes?: string[];
  coursesTaught?: string[];
  title?: string; // e.g. "Dr.", "Prof.", "Barr.", "Dean", "Dr. (Mrs.)"
  bio?: string;
  officeLocation?: string;
  createdAt?: string;
}

export interface Course {
  code: string;
  title: string;
  creditUnits: number; // Editable by authorized lecturer or admin
  faculty: string;
  department: string;
  level: string;
  semester: 1 | 2;
  lecturerId: string;
  lecturerName: string;
  description?: string;
  scheduleDay?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  scheduleTime?: string;
  venue?: string;
  enrolledCount?: number;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export interface Assignment {
  id: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string;
  lecturerName: string;
  title: string;
  description: string;
  dueDate: string; // ISO date string
  maxScore: number; // default 100 or 30 (Continuous Assessment)
  createdAt: string;
  attachmentName?: string;
  attachmentSize?: string;
  status: 'active' | 'closed';
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  courseCode: string;
  studentId: string;
  studentName: string;
  studentMatric: string;
  submittedAt: string;
  content: string; // submission solution or comments
  attachmentName?: string;
  score?: number; // Grade assigned by lecturer
  feedback?: string; // Written feedback from lecturer
  status: 'submitted' | 'graded';
  gradedAt?: string;
}

export type AnnouncementCategory = 'lecture' | 'department' | 'circular' | 'exam' | 'urgent';

export interface AnnouncementTarget {
  type: 'all' | 'faculty' | 'level' | 'course' | 'matric_range';
  faculty?: string;
  level?: string;
  courseCode?: string;
  matricPrefix?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorTitle?: string;
  category: AnnouncementCategory;
  target: AnnouncementTarget;
  createdAt: string;
  urgency: 'normal' | 'high' | 'urgent';
  status?: 'published' | 'draft';
  isReminder?: boolean;
  imageUrl?: string;
  additionalNotes?: string;
  verifiedOfficial?: boolean;
  externalLink?: {
    label: string;
    url: string;
  };
  attachments?: Array<{
    name: string;
    size: string;
    type: string;
    url?: string;
  }>;
  readBy: string[]; // User IDs who have read
  channels: {
    inApp: boolean;
    emailSent: boolean;
    smsSent: boolean;
  };
}

// Result Compilation & Management Types
export type ResultSubmissionStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'returned' | 'published';

export interface StudentScoreEntry {
  studentId: string;
  matricNumber: string;
  studentName: string;
  caScore?: number; // Continuous assessment (e.g. max 30)
  examScore?: number; // Examination score (e.g. max 70)
  totalScore?: number; // 0 - 100
  grade?: GradeLetter; // A, B, C, D, E, F
  gradePoint?: number; // 5, 4, 3, 2, 1, 0
  creditUnits: number;
  status: 'complete' | 'missing_exam' | 'missing_ca' | 'incomplete';
  remarks?: string;
}

export interface CourseResultSheet {
  id: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  faculty: string;
  department: string;
  level: string; // e.g. "300L"
  semester: 1 | 2;
  academicSession: string; // e.g. "2026/2027"
  lecturerId: string;
  lecturerName: string;
  maxCaScore: number; // default 30
  maxExamScore: number; // default 70
  status: ResultSubmissionStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByOfficerId?: string;
  reviewedByOfficerName?: string;
  publishedAt?: string;
  returnReason?: string;
  studentScores: StudentScoreEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CarryoverRecord {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  originalSession: string; // e.g. "2025/2026"
  originalSemester: 1 | 2;
  reason: string; // e.g. "Failed CSC 201.1 in 2025/2026 Rain Semester (Score: 34%)" or "Approved medical deferral"
  status: 'outstanding' | 'registered' | 'cleared';
  addedAt: string;
  addedByOfficerId: string;
  addedByOfficerName: string;
  clearedAt?: string;
}

export interface AcademicMaterial {
  id: string;
  title: string;
  description: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string;
  lecturerName: string;
  fileType: 'pdf' | 'slide' | 'doc' | 'code' | 'zip';
  fileSize: string;
  uploadedAt: string;
  academicSession: string;
  downloadCount: number;
  tags: string[];
}

export interface TimetableSlot {
  id: string;
  courseCode: string;
  courseTitle: string;
  lecturerName: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string; // e.g. "09:00 AM"
  endTime: string; // e.g. "11:00 AM"
  venue: string; // e.g. "Engineering Hall A"
  faculty: string;
  department: string;
  level: string;
}

export type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '';

export interface CourseGradeInput {
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  grade: GradeLetter;
  semester: 1 | 2;
  academicYear: string;
  level?: string; // e.g. "100L", "200L", "300L", "400L", "500L"
}

export interface SavedCalculation {
  id: string;
  studentId: string;
  studentMatric: string;
  studentName: string;
  academicYear: string;
  semester: 1 | 2 | 'cumulative';
  gpa: number;
  cgpa: number;
  totalUnits: number;
  totalQualityPoints: number;
  classification: string;
  calculatedAt: string;
  courses: CourseGradeInput[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderMatric?: string;
  senderAvatar: string;
  senderRole: UserRole;
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  content: string;
  timestamp: string;
  read: boolean;
  messageType?: 'text' | 'voice';
  audioUrl?: string;
  audioDuration?: number;
  waveform?: number[];
  transcript?: string;
}

export interface NotificationLog {
  id: string;
  type: 'email' | 'sms' | 'in_app';
  recipientId: string;
  recipientName: string;
  recipientContact: string;
  subject: string;
  preview: string;
  timestamp: string;
  status: 'delivered' | 'sent';
  sourceTitle: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  target: string;
  details: string;
  status: 'success' | 'warning' | 'denied';
}

export interface SystemSettings {
  universityName: string;
  institutionShortName: string;
  currentAcademicSession: string;
  currentSemester: 1 | 2;
  smsGatewayEnabled: boolean;
  emailGatewayEnabled: boolean;
  maintenanceMode: boolean;
  gradingScale: '5.00' | '4.00';
  registrationOpen: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  deanName: string;
  departments: string[];
}

export interface Department {
  id: string;
  name: string;
  facultyName: string;
  hodName: string;
  code: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number; // timestamp
}
