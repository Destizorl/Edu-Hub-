export type UserRole = 'student' | 'lecturer' | 'registrar' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  faculty: string;
  department: string;
  level?: string; // e.g. "300L"
  matricNumber?: string; // e.g. "CSC/2021/042"
  staffId?: string; // e.g. "STF/CSC/104"
  isCourseRep?: boolean; // Appointed course representative
  enrolledCourseCodes?: string[];
  coursesTaught?: string[];
  title?: string; // e.g. "Dr.", "Prof.", "Barr."
}

export interface Course {
  code: string;
  title: string;
  creditUnits: number; // Editable by lecturer
  faculty: string;
  department: string;
  level: string;
  semester: 1 | 2;
  lecturerId: string;
  lecturerName: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export type AnnouncementCategory = 'lecture' | 'department' | 'circular' | 'exam' | 'urgent';

export interface AnnouncementTarget {
  type: 'all' | 'faculty' | 'level' | 'course' | 'matric_range';
  faculty?: string;
  level?: string;
  courseCode?: string;
  matricPrefix?: string; // e.g. "CSC/2021"
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

export type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '';

export interface CourseGradeInput {
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  grade: GradeLetter;
  semester: 1 | 2;
  academicYear: string;
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
  audioDuration?: number; // in seconds
  waveform?: number[];
  transcript?: string; // speech-to-text transcription
}

export interface NotificationLog {
  id: string;
  type: 'email' | 'sms' | 'in_app';
  recipientId: string;
  recipientName: string;
  recipientContact: string; // email address or phone number
  subject: string;
  preview: string;
  timestamp: string;
  status: 'delivered' | 'sent';
  sourceTitle: string;
}

export interface AgileTask {
  id: string;
  title: string;
  type: 'lecture' | 'assignment' | 'material' | 'quiz' | 'notice';
  status: 'backlog' | 'in_progress' | 'disseminated';
  dueDate: string;
  assignedCourse: string;
  matricScope: string;
}

export interface AgileSprint {
  id: string;
  title: string;
  sprintNumber: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  courseCode: string;
  lecturerName: string;
  tasks: AgileTask[];
  feedbacks?: SprintFeedback[];
}

export interface SprintFeedback {
  id: string;
  sprintId: string;
  studentId: string;
  studentName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface RepInquiry {
  id: string;
  studentId: string;
  studentName: string;
  studentMatric: string;
  courseCode: string;
  subject: string;
  details: string;
  urgency: 'normal' | 'high';
  status: 'pending' | 'forwarded_to_lecturer' | 'resolved';
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
  lecturerReply?: string;
}

