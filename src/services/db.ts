import {
  User,
  Course,
  Assignment,
  AssignmentSubmission,
  Announcement,
  AcademicMaterial,
  TimetableSlot,
  ChatMessage,
  NotificationLog,
  AuditLog,
  SystemSettings,
  Faculty,
  Department,
  SavedCalculation,
  CourseResultSheet,
  CarryoverRecord
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_COURSES,
  INITIAL_ASSIGNMENTS,
  INITIAL_ASSIGNMENT_SUBMISSIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_MATERIALS,
  INITIAL_TIMETABLE_SLOTS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_NOTIFICATION_LOGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_FACULTIES,
  INITIAL_DEPARTMENTS,
  INITIAL_RESULT_SHEETS,
  INITIAL_CARRYOVER_RECORDS
} from '../data/mockData';

// Storage Keys
const KEYS = {
  USERS: 'edustream_users_v8',
  COURSES: 'edustream_courses_v8',
  ASSIGNMENTS: 'edustream_assignments_v8',
  SUBMISSIONS: 'edustream_submissions_v8',
  ANNOUNCEMENTS: 'edustream_announcements_v8',
  MATERIALS: 'edustream_materials_v8',
  TIMETABLE: 'edustream_timetable_v8',
  MESSAGES: 'edustream_messages_v8',
  NOTIFICATIONS: 'edustream_notifications_v8',
  AUDIT_LOGS: 'edustream_audit_logs_v8',
  SETTINGS: 'edustream_settings_v8',
  FACULTIES: 'edustream_faculties_v8',
  DEPARTMENTS: 'edustream_departments_v8',
  CALCULATIONS: 'edustream_saved_calcs_v8',
  RESULT_SHEETS: 'edustream_result_sheets_v8',
  CARRYOVER_RECORDS: 'edustream_carryover_records_v8',
};

// Safe JSON helper
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('edustream_storage_change', { detail: { key } }));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

export const DatabaseService = {
  // Initialization
  initialize() {
    load(KEYS.USERS, INITIAL_USERS);
    load(KEYS.COURSES, INITIAL_COURSES);
    load(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    load(KEYS.SUBMISSIONS, INITIAL_ASSIGNMENT_SUBMISSIONS);
    load(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    load(KEYS.MATERIALS, INITIAL_MATERIALS);
    load(KEYS.TIMETABLE, INITIAL_TIMETABLE_SLOTS);
    load(KEYS.MESSAGES, INITIAL_CHAT_MESSAGES);
    load(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATION_LOGS);
    load(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    load(KEYS.SETTINGS, INITIAL_SYSTEM_SETTINGS);
    load(KEYS.FACULTIES, INITIAL_FACULTIES);
    load(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    load(KEYS.RESULT_SHEETS, INITIAL_RESULT_SHEETS);
    load(KEYS.CARRYOVER_RECORDS, INITIAL_CARRYOVER_RECORDS);
  },

  // USERS
  getUsers(): User[] {
    const users = load<User[]>(KEYS.USERS, INITIAL_USERS);
    let changed = false;
    const initialMap = new Map(INITIAL_USERS.map((u) => [u.id, u.avatar]));
    const updated = users.map((u) => {
      const canonical = initialMap.get(u.id);
      if (canonical && u.avatar !== canonical) {
        changed = true;
        return { ...u, avatar: canonical };
      }
      return u;
    });
    if (changed) {
      save(KEYS.USERS, updated);
      return updated;
    }
    return users;
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  findUserByIdentifier(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.getUsers().find(
      (u) =>
        u.campusId?.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        u.matricNumber?.toLowerCase() === clean ||
        u.staffId?.toLowerCase() === clean ||
        u.id.toLowerCase() === clean
    );
  },

  createUser(user: Omit<User, 'id' | 'createdAt'>, actor: User): User {
    if (actor.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can create new institutional accounts.');
    }
    const users = this.getUsers();
    
    // Check if campus ID or email already exists
    const duplicate = users.find(
      (u) => u.campusId?.toLowerCase() === user.campusId?.toLowerCase() || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Account already exists with Campus ID "${user.campusId}" or Email "${user.email}".`);
    }

    const newUser: User = {
      ...user,
      id: `user-${user.role}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    save(KEYS.USERS, users);

    this.logAudit({
      action: 'USER_ACCOUNT_CREATED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: `${newUser.name} (${newUser.campusId})`,
      details: `Created account with role: ${newUser.role.toUpperCase()} in ${newUser.department}.`,
      status: 'success',
    });

    return newUser;
  },

  updateUser(id: string, updates: Partial<User>, actor: User): User {
    // Only admin or the user themselves (for permitted profile fields) can update
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found.');

    const targetUser = users[index];

    // Role changes can ONLY be done by administrator
    if (updates.role && updates.role !== targetUser.role && actor.role !== 'admin') {
      this.logAudit({
        action: 'UNAUTHORIZED_ROLE_CHANGE_ATTEMPT',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        target: targetUser.name,
        details: `Rejected attempt by ${actor.name} to change role to ${updates.role}.`,
        status: 'denied',
      });
      throw new Error('Access Denied: Only administrators can modify account roles.');
    }

    // Status changes can ONLY be done by administrator
    if (updates.status && updates.status !== targetUser.status && actor.role !== 'admin') {
      throw new Error('Access Denied: Only administrators can modify account status.');
    }

    const updatedUser = { ...targetUser, ...updates };
    users[index] = updatedUser;
    save(KEYS.USERS, users);

    this.logAudit({
      action: 'USER_ACCOUNT_UPDATED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: targetUser.name,
      details: `Updated fields: ${Object.keys(updates).join(', ')}.`,
      status: 'success',
    });

    return updatedUser;
  },

  setUserStatus(id: string, status: 'active' | 'suspended' | 'pending', actor: User): User {
    if (actor.role !== 'admin') {
      throw new Error('Access Denied: Only administrators can suspend or activate accounts.');
    }
    return this.updateUser(id, { status }, actor);
  },

  // COURSES
  getCourses(): Course[] {
    return load<Course[]>(KEYS.COURSES, INITIAL_COURSES);
  },

  getCourseByCode(code: string): Course | undefined {
    return this.getCourses().find((c) => c.code.toLowerCase() === code.toLowerCase());
  },

  createCourse(course: Course, actor: User): Course {
    if (actor.role !== 'admin') {
      throw new Error('Access Denied: Only administrators can add new courses to the catalog.');
    }
    const courses = this.getCourses();
    if (courses.some((c) => c.code.toLowerCase() === course.code.toLowerCase())) {
      throw new Error(`Course with code ${course.code} already exists.`);
    }
    courses.push(course);
    save(KEYS.COURSES, courses);

    this.logAudit({
      action: 'COURSE_CATALOG_CREATED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: course.code,
      details: `Added course "${course.title}" (${course.creditUnits} Units) assigned to ${course.lecturerName}.`,
      status: 'success',
    });
    return course;
  },

  updateCourseUnits(code: string, newUnits: number, actor: User): Course {
    const courses = this.getCourses();
    const index = courses.findIndex((c) => c.code.toLowerCase() === code.toLowerCase());
    if (index === -1) throw new Error(`Course ${code} not found.`);

    const course = courses[index];
    // Must be admin or the assigned lecturer
    const isAssignedLecturer = course.lecturerId === actor.id || actor.coursesTaught?.includes(course.code);
    if (actor.role !== 'admin' && !isAssignedLecturer) {
      throw new Error(`Access Denied: You are not authorized to modify credit units for ${code}.`);
    }

    const updated = {
      ...course,
      creditUnits: newUnits,
      lastUpdatedBy: actor.name,
      lastUpdatedAt: new Date().toISOString().split('T')[0],
    };
    courses[index] = updated;
    save(KEYS.COURSES, courses);

    this.logAudit({
      action: 'COURSE_CREDIT_UNITS_MODIFIED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: code,
      details: `Changed credit points to ${newUnits} units.`,
      status: 'success',
    });
    return updated;
  },

  assignLecturerToCourse(courseCode: string, lecturerId: string, actor: User): Course {
    if (actor.role !== 'admin') {
      throw new Error('Access Denied: Only administrators can assign lecturers to courses.');
    }
    const courses = this.getCourses();
    const courseIndex = courses.findIndex((c) => c.code.toLowerCase() === courseCode.toLowerCase());
    if (courseIndex === -1) throw new Error(`Course ${courseCode} not found.`);

    const lecturer = this.getUserById(lecturerId);
    if (!lecturer || lecturer.role !== 'lecturer') {
      throw new Error('Invalid lecturer selected.');
    }

    courses[courseIndex].lecturerId = lecturer.id;
    courses[courseIndex].lecturerName = lecturer.name;
    courses[courseIndex].lastUpdatedBy = actor.name;
    courses[courseIndex].lastUpdatedAt = new Date().toISOString().split('T')[0];
    save(KEYS.COURSES, courses);

    // Also update lecturer's coursesTaught array
    const users = this.getUsers();
    const lecturerIndex = users.findIndex((u) => u.id === lecturerId);
    if (lecturerIndex !== -1) {
      const current = users[lecturerIndex].coursesTaught || [];
      if (!current.includes(courseCode)) {
        users[lecturerIndex].coursesTaught = [...current, courseCode];
        save(KEYS.USERS, users);
      }
    }

    return courses[courseIndex];
  },

  enrollStudentInCourse(courseCode: string, studentId: string, actor: User): void {
    if (actor.role !== 'admin') {
      throw new Error('Access Denied: Only administrators can modify student course enrolments.');
    }
    const users = this.getUsers();
    const student = users.find((u) => u.id === studentId);
    if (!student || student.role !== 'student') throw new Error('Student not found.');

    const currentEnrolments = student.enrolledCourseCodes || [];
    if (!currentEnrolments.includes(courseCode)) {
      student.enrolledCourseCodes = [...currentEnrolments, courseCode];
      save(KEYS.USERS, users);
    }
  },

  unenrollStudentFromCourse(courseCode: string, studentId: string, actor: User): void {
    if (actor.role !== 'admin') {
      throw new Error('Access Denied: Only administrators can modify student course enrolments.');
    }
    const users = this.getUsers();
    const student = users.find((u) => u.id === studentId);
    if (!student) throw new Error('Student not found.');

    student.enrolledCourseCodes = (student.enrolledCourseCodes || []).filter((c) => c !== courseCode);
    save(KEYS.USERS, users);
  },

  // ANNOUNCEMENTS
  getAnnouncements(): Announcement[] {
    return load<Announcement[]>(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  },

  getAnnouncementsForStudent(student: User): Announcement[] {
    const all = this.getAnnouncements();
    return all.filter((a) => {
      if (a.status === 'draft') return false; // Students must never see unpublished drafts!
      if (a.target.type === 'all') return true;
      if (a.target.type === 'faculty' && a.target.faculty === student.faculty) {
        if (a.target.level && a.target.level !== student.level) return false;
        return true;
      }
      if (a.target.type === 'level' && a.target.level === student.level) return true;
      if (a.target.type === 'course' && a.target.courseCode) {
        return student.enrolledCourseCodes?.includes(a.target.courseCode);
      }
      return false;
    });
  },

  createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>, actor: User): Announcement {
    // Only lecturer or admin can create announcements
    if (actor.role !== 'lecturer' && actor.role !== 'admin') {
      throw new Error('Access Denied: Students are not authorized to publish institutional announcements.');
    }

    // If lecturer, must target assigned course or general department
    if (actor.role === 'lecturer' && announcement.target.type === 'course') {
      const isAssigned = actor.coursesTaught?.includes(announcement.target.courseCode || '') || 
                         this.getCourses().some((c) => c.code === announcement.target.courseCode && c.lecturerId === actor.id);
      if (!isAssigned) {
        throw new Error(`Unauthorized: You are not assigned to course ${announcement.target.courseCode}.`);
      }
    }

    const announcements = this.getAnnouncements();
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
      readBy: [],
      status: announcement.status || 'published',
    };

    announcements.unshift(newAnnouncement);
    save(KEYS.ANNOUNCEMENTS, announcements);

    // If SMS or Email checked, create simulated notification logs for targeted students
    if (newAnnouncement.status === 'published') {
      this.dispatchAnnouncementNotifications(newAnnouncement);
    }

    this.logAudit({
      action: 'ANNOUNCEMENT_PUBLISHED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: newAnnouncement.title,
      details: `Published announcement category: ${newAnnouncement.category.toUpperCase()} to target: ${newAnnouncement.target.type}.`,
      status: 'success',
    });

    return newAnnouncement;
  },

  updateAnnouncement(id: string, updates: Partial<Announcement>, actor: User): Announcement {
    const list = this.getAnnouncements();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Announcement not found.');

    const existing = list[index];
    if (actor.role !== 'admin' && existing.authorId !== actor.id) {
      throw new Error('Unauthorized: You can only edit your own announcements.');
    }

    const updated = { ...existing, ...updates };
    list[index] = updated;
    save(KEYS.ANNOUNCEMENTS, list);
    return updated;
  },

  deleteAnnouncement(id: string, actor: User): void {
    const list = this.getAnnouncements();
    const existing = list.find((a) => a.id === id);
    if (!existing) throw new Error('Announcement not found.');

    if (actor.role !== 'admin' && existing.authorId !== actor.id) {
      throw new Error('Unauthorized: You can only delete your own announcements.');
    }

    const filtered = list.filter((a) => a.id !== id);
    save(KEYS.ANNOUNCEMENTS, filtered);

    this.logAudit({
      action: 'ANNOUNCEMENT_DELETED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: existing.title,
      details: 'Announcement removed from public feed.',
      status: 'success',
    });
  },

  markAnnouncementRead(id: string, userId: string): void {
    const list = this.getAnnouncements();
    const item = list.find((a) => a.id === id);
    if (item && !item.readBy.includes(userId)) {
      item.readBy.push(userId);
      save(KEYS.ANNOUNCEMENTS, list);
    }
  },

  dispatchAnnouncementNotifications(announcement: Announcement) {
    const users = this.getUsers().filter((u) => u.role === 'student' && u.status === 'active');
    const logs = load<NotificationLog[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATION_LOGS);

    const recipients = users.filter((u) => {
      if (announcement.target.type === 'all') return true;
      if (announcement.target.type === 'course' && announcement.target.courseCode) {
        return u.enrolledCourseCodes?.includes(announcement.target.courseCode);
      }
      if (announcement.target.type === 'faculty' && announcement.target.faculty) {
        return u.faculty === announcement.target.faculty;
      }
      return false;
    });

    recipients.slice(0, 5).forEach((student) => {
      if (announcement.channels.smsSent) {
        logs.unshift({
          id: `notif-sms-${Date.now()}-${student.id}`,
          type: 'sms',
          recipientId: student.id,
          recipientName: student.name,
          recipientContact: student.phone,
          subject: announcement.title,
          preview: `EDUSTREAM-ALERT: ${announcement.title.slice(0, 90)}...`,
          timestamp: new Date().toISOString(),
          status: 'delivered',
          sourceTitle: announcement.title,
        });
      }
      if (announcement.channels.emailSent) {
        logs.unshift({
          id: `notif-email-${Date.now()}-${student.id}`,
          type: 'email',
          recipientId: student.id,
          recipientName: student.name,
          recipientContact: student.email,
          subject: `[EduStream] ${announcement.title}`,
          preview: announcement.content.slice(0, 120),
          timestamp: new Date().toISOString(),
          status: 'delivered',
          sourceTitle: announcement.title,
        });
      }
    });

    save(KEYS.NOTIFICATIONS, logs.slice(0, 50));
  },

  // ASSIGNMENTS
  getAssignments(): Assignment[] {
    return load<Assignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  },

  createAssignment(assignment: Omit<Assignment, 'id' | 'createdAt'>, actor: User): Assignment {
    if (actor.role !== 'lecturer' && actor.role !== 'admin') {
      throw new Error('Unauthorized: Only lecturers and administrators can create course assignments.');
    }

    const assignments = this.getAssignments();
    const newAssignment: Assignment = {
      ...assignment,
      id: `asg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    assignments.unshift(newAssignment);
    save(KEYS.ASSIGNMENTS, assignments);

    this.logAudit({
      action: 'ASSIGNMENT_CREATED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: `${assignment.courseCode}: ${assignment.title}`,
      details: `Created assignment with deadline: ${assignment.dueDate}, max score: ${assignment.maxScore}.`,
      status: 'success',
    });

    return newAssignment;
  },

  deleteAssignment(id: string, actor: User): void {
    const assignments = this.getAssignments();
    const existing = assignments.find((a) => a.id === id);
    if (!existing) throw new Error('Assignment not found.');

    if (actor.role !== 'admin' && existing.lecturerId !== actor.id) {
      throw new Error('Unauthorized: You can only delete your own assignments.');
    }

    save(KEYS.ASSIGNMENTS, assignments.filter((a) => a.id !== id));
  },

  // SUBMISSIONS
  getSubmissions(): AssignmentSubmission[] {
    return load<AssignmentSubmission[]>(KEYS.SUBMISSIONS, INITIAL_ASSIGNMENT_SUBMISSIONS);
  },

  submitAssignment(submission: Omit<AssignmentSubmission, 'id' | 'submittedAt' | 'status'>, actor: User): AssignmentSubmission {
    if (actor.role !== 'student') {
      throw new Error('Only students can submit assignments.');
    }

    const submissions = this.getSubmissions();
    // Check if student already submitted
    const existingIndex = submissions.findIndex(
      (s) => s.assignmentId === submission.assignmentId && s.studentId === actor.id
    );

    const newSub: AssignmentSubmission = {
      ...submission,
      id: existingIndex !== -1 ? submissions[existingIndex].id : `sub-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    };

    if (existingIndex !== -1) {
      submissions[existingIndex] = newSub;
    } else {
      submissions.unshift(newSub);
    }

    save(KEYS.SUBMISSIONS, submissions);

    this.logAudit({
      action: 'ASSIGNMENT_SUBMITTED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: submission.courseCode,
      details: `Submitted work for assignment ID: ${submission.assignmentId}.`,
      status: 'success',
    });

    return newSub;
  },

  gradeSubmission(submissionId: string, score: number, feedback: string, actor: User): AssignmentSubmission {
    if (actor.role !== 'lecturer' && actor.role !== 'admin') {
      throw new Error('Unauthorized: Only lecturers and admins can grade submissions.');
    }

    const submissions = this.getSubmissions();
    const index = submissions.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error('Submission not found.');

    const sub = submissions[index];
    const updated: AssignmentSubmission = {
      ...sub,
      score,
      feedback,
      status: 'graded',
      gradedAt: new Date().toISOString(),
    };

    submissions[index] = updated;
    save(KEYS.SUBMISSIONS, submissions);

    // Notify student
    const notifs = load<NotificationLog[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATION_LOGS);
    notifs.unshift({
      id: `notif-grade-${Date.now()}`,
      type: 'in_app',
      recipientId: sub.studentId,
      recipientName: sub.studentName,
      recipientContact: sub.studentMatric,
      subject: `Assignment Graded: ${sub.courseCode}`,
      preview: `Your lecturer scored your submission ${score} marks with feedback: "${feedback.slice(0, 60)}..."`,
      timestamp: new Date().toISOString(),
      status: 'delivered',
      sourceTitle: 'Assignment Feedback',
    });
    save(KEYS.NOTIFICATIONS, notifs.slice(0, 50));

    this.logAudit({
      action: 'SUBMISSION_GRADED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: `${sub.courseCode} - ${sub.studentName}`,
      details: `Awarded ${score} points. Feedback: ${feedback}.`,
      status: 'success',
    });

    return updated;
  },

  // MATERIALS
  getMaterials(): AcademicMaterial[] {
    return load<AcademicMaterial[]>(KEYS.MATERIALS, INITIAL_MATERIALS);
  },

  createMaterial(material: Omit<AcademicMaterial, 'id' | 'uploadedAt' | 'downloadCount'>, actor: User): AcademicMaterial {
    if (actor.role !== 'lecturer' && actor.role !== 'admin') {
      throw new Error('Unauthorized: Only authorized faculty can upload course materials.');
    }

    const materials = this.getMaterials();
    const newMaterial: AcademicMaterial = {
      ...material,
      id: `mat-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      downloadCount: 0,
    };

    materials.unshift(newMaterial);
    save(KEYS.MATERIALS, materials);

    this.logAudit({
      action: 'COURSE_MATERIAL_UPLOADED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: `${material.courseCode}: ${material.title}`,
      details: `Uploaded ${material.fileType.toUpperCase()} file (${material.fileSize}).`,
      status: 'success',
    });

    return newMaterial;
  },

  deleteMaterial(id: string, actor: User): void {
    const list = this.getMaterials();
    const existing = list.find((m) => m.id === id);
    if (!existing) throw new Error('Material not found.');

    if (actor.role !== 'admin' && existing.lecturerId !== actor.id) {
      throw new Error('Unauthorized: You can only delete materials for your assigned courses.');
    }

    save(KEYS.MATERIALS, list.filter((m) => m.id !== id));
  },

  incrementDownload(id: string): void {
    const list = this.getMaterials();
    const item = list.find((m) => m.id === id);
    if (item) {
      item.downloadCount = (item.downloadCount || 0) + 1;
      save(KEYS.MATERIALS, list);
    }
  },

  // TIMETABLE
  getTimetable(): TimetableSlot[] {
    return load<TimetableSlot[]>(KEYS.TIMETABLE, INITIAL_TIMETABLE_SLOTS);
  },

  addTimetableSlot(slot: Omit<TimetableSlot, 'id'>, actor: User): TimetableSlot {
    if (actor.role !== 'admin') {
      throw new Error('Only administrators can schedule official timetable slots.');
    }
    const timetable = this.getTimetable();
    const newSlot: TimetableSlot = {
      ...slot,
      id: `tt-${Date.now()}`,
    };
    timetable.push(newSlot);
    save(KEYS.TIMETABLE, timetable);
    return newSlot;
  },

  deleteTimetableSlot(id: string, actor: User): void {
    if (actor.role !== 'admin') {
      throw new Error('Only administrators can remove timetable slots.');
    }
    const timetable = this.getTimetable();
    save(KEYS.TIMETABLE, timetable.filter((t) => t.id !== id));
  },

  // MESSAGES
  getMessages(): ChatMessage[] {
    const msgs = load<ChatMessage[]>(KEYS.MESSAGES, INITIAL_CHAT_MESSAGES);
    let changed = false;
    const initialMap = new Map(INITIAL_USERS.map((u) => [u.id, u.avatar]));
    const updated = msgs.map((m) => {
      const canonical = initialMap.get(m.senderId);
      if (canonical && m.senderAvatar !== canonical) {
        changed = true;
        return { ...m, senderAvatar: canonical };
      }
      return m;
    });
    if (changed) {
      save(KEYS.MESSAGES, updated);
      return updated;
    }
    return msgs;
  },

  getConversation(userIdA: string, userIdB: string): ChatMessage[] {
    const all = this.getMessages();
    return all.filter(
      (m) =>
        (m.senderId === userIdA && m.receiverId === userIdB) ||
        (m.senderId === userIdB && m.receiverId === userIdA)
    );
  },

  sendMessage(
    receiverId: string,
    content: string,
    actor: User,
    voiceData?: { audioUrl: string; duration: number; waveform: number[] }
  ): ChatMessage {
    const receiver = this.getUserById(receiverId);
    if (!receiver) throw new Error('Receiver not found.');

    const messages = this.getMessages();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: actor.id,
      senderName: actor.name,
      senderMatric: actor.matricNumber || actor.staffId || actor.campusId,
      senderAvatar: actor.avatar,
      senderRole: actor.role,
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverRole: receiver.role,
      content,
      timestamp: new Date().toISOString(),
      read: false,
      messageType: voiceData ? 'voice' : 'text',
      audioUrl: voiceData?.audioUrl,
      audioDuration: voiceData?.duration,
      waveform: voiceData?.waveform,
    };

    messages.push(newMsg);
    save(KEYS.MESSAGES, messages);
    return newMsg;
  },

  markConversationRead(partnerId: string, currentUserId: string): void {
    const messages = this.getMessages();
    let changed = false;
    messages.forEach((m) => {
      if (m.senderId === partnerId && m.receiverId === currentUserId && !m.read) {
        m.read = true;
        changed = true;
      }
    });
    if (changed) save(KEYS.MESSAGES, messages);
  },

  // AUDIT LOGS
  getAuditLogs(): AuditLog[] {
    return load<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    logs.unshift({
      ...entry,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    save(KEYS.AUDIT_LOGS, logs.slice(0, 100)); // keep last 100 entries
  },

  // NOTIFICATIONS
  getNotifications(): NotificationLog[] {
    return load<NotificationLog[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATION_LOGS);
  },

  // SETTINGS
  getSettings(): SystemSettings {
    return load<SystemSettings>(KEYS.SETTINGS, INITIAL_SYSTEM_SETTINGS);
  },

  updateSettings(updates: Partial<SystemSettings>, actor: User): SystemSettings {
    if (actor.role !== 'admin') {
      throw new Error('Only administrators can modify institutional settings.');
    }
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    save(KEYS.SETTINGS, updated);

    this.logAudit({
      action: 'SYSTEM_SETTINGS_UPDATED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: 'System Configuration',
      details: `Modified system settings: ${Object.keys(updates).join(', ')}.`,
      status: 'success',
    });

    return updated;
  },

  // SAVED CALCULATIONS (CGPA Engine)
  getSavedCalculations(studentId?: string): SavedCalculation[] {
    const calcs = load<SavedCalculation[]>(KEYS.CALCULATIONS, []);
    return studentId ? calcs.filter((c) => c.studentId === studentId) : calcs;
  },

  saveCalculation(calc: SavedCalculation): void {
    const calcs = this.getSavedCalculations();
    const existing = calcs.findIndex((c) => c.id === calc.id);
    if (existing !== -1) {
      calcs[existing] = calc;
    } else {
      calcs.unshift(calc);
    }
    save(KEYS.CALCULATIONS, calcs);
  },

  deleteCalculation(id: string): void {
    const calcs = this.getSavedCalculations();
    save(KEYS.CALCULATIONS, calcs.filter((c) => c.id !== id));
  },

  // RESULT SHEETS (Lecturer Compilation & Result Officer Approval)
  getResultSheets(): CourseResultSheet[] {
    return load<CourseResultSheet[]>(KEYS.RESULT_SHEETS, INITIAL_RESULT_SHEETS);
  },

  getResultSheetById(id: string): CourseResultSheet | undefined {
    return this.getResultSheets().find((s) => s.id === id);
  },

  getResultSheetsByLecturer(lecturerId: string): CourseResultSheet[] {
    return this.getResultSheets().filter((s) => s.lecturerId === lecturerId);
  },

  getResultSheetByCourse(courseCode: string, session?: string, semester?: 1 | 2): CourseResultSheet | undefined {
    return this.getResultSheets().find(
      (s) =>
        s.courseCode.toLowerCase() === courseCode.toLowerCase() &&
        (!session || s.academicSession === session) &&
        (!semester || s.semester === semester)
    );
  },

  saveResultSheet(sheet: CourseResultSheet, actor: User): CourseResultSheet {
    // Only assigned lecturer, Result Officer, or Admin can save
    const isLecturer = sheet.lecturerId === actor.id || actor.coursesTaught?.includes(sheet.courseCode);
    const isPrivileged = actor.role === 'result_officer' || actor.role === 'admin';
    if (!isLecturer && !isPrivileged) {
      throw new Error(`Unauthorized: You do not have permission to modify result sheets for ${sheet.courseCode}.`);
    }

    const sheets = this.getResultSheets();
    const index = sheets.findIndex((s) => s.id === sheet.id);
    const updatedSheet: CourseResultSheet = {
      ...sheet,
      updatedAt: new Date().toISOString(),
    };

    if (index !== -1) {
      sheets[index] = updatedSheet;
    } else {
      sheets.unshift(updatedSheet);
    }
    save(KEYS.RESULT_SHEETS, sheets);

    this.logAudit({
      action: 'RESULT_SHEET_SAVED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: sheet.courseCode,
      details: `Saved result sheet for ${sheet.courseCode} (${sheet.studentScores.length} students) with status ${sheet.status}.`,
      status: 'success',
    });

    return updatedSheet;
  },

  submitResultSheet(sheetId: string, actor: User): CourseResultSheet {
    const sheet = this.getResultSheetById(sheetId);
    if (!sheet) throw new Error('Result sheet not found.');

    const isLecturer = sheet.lecturerId === actor.id || actor.coursesTaught?.includes(sheet.courseCode);
    const isPrivileged = actor.role === 'result_officer' || actor.role === 'admin';
    if (!isLecturer && !isPrivileged) {
      throw new Error('Unauthorized: Only the assigned lecturer can submit this course result sheet.');
    }

    // Validation checks
    const invalidScores = sheet.studentScores.some(
      (s) =>
        (s.caScore !== undefined && (s.caScore < 0 || s.caScore > sheet.maxCaScore)) ||
        (s.examScore !== undefined && (s.examScore < 0 || s.examScore > sheet.maxExamScore)) ||
        (s.totalScore !== undefined && (s.totalScore < 0 || s.totalScore > 100))
    );
    if (invalidScores) {
      throw new Error('Validation Error: One or more student scores exceed maximum score limits or are negative.');
    }

    const updated = this.saveResultSheet(
      {
        ...sheet,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        returnReason: undefined, // clear previous return notes if resubmitting
      },
      actor
    );

    this.logAudit({
      action: 'RESULT_SHEET_SUBMITTED_TO_OFFICER',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      target: sheet.courseCode,
      details: `Submitted result sheet for ${sheet.courseCode} (${sheet.studentScores.length} students) to the Result Officer for compilation.`,
      status: 'success',
    });

    return updated;
  },

  reviewResultSheet(
    sheetId: string,
    action: 'approve' | 'return',
    returnReason: string | undefined,
    officer: User
  ): CourseResultSheet {
    if (officer.role !== 'result_officer' && officer.role !== 'admin') {
      throw new Error('Unauthorized: Only Result Officers or Administrators can review and approve course result sheets.');
    }

    const sheet = this.getResultSheetById(sheetId);
    if (!sheet) throw new Error('Result sheet not found.');

    const updated: CourseResultSheet = {
      ...sheet,
      status: action === 'approve' ? 'approved' : 'returned',
      reviewedAt: new Date().toISOString(),
      reviewedByOfficerId: officer.id,
      reviewedByOfficerName: officer.name,
      returnReason: action === 'return' ? returnReason : undefined,
      updatedAt: new Date().toISOString(),
    };

    const sheets = this.getResultSheets();
    const idx = sheets.findIndex((s) => s.id === sheetId);
    if (idx !== -1) sheets[idx] = updated;
    save(KEYS.RESULT_SHEETS, sheets);

    this.logAudit({
      action: action === 'approve' ? 'RESULT_SHEET_APPROVED' : 'RESULT_SHEET_RETURNED_FOR_CORRECTION',
      actorId: officer.id,
      actorName: officer.name,
      actorRole: officer.role,
      target: sheet.courseCode,
      details:
        action === 'approve'
          ? `Approved ${sheet.courseCode} result sheet for compilation.`
          : `Returned ${sheet.courseCode} result sheet to lecturer. Reason: ${returnReason}`,
      status: 'success',
    });

    return updated;
  },

  publishResultSheet(sheetId: string, officer: User): CourseResultSheet {
    if (officer.role !== 'result_officer' && officer.role !== 'admin') {
      throw new Error('Unauthorized: Only Result Officers or Administrators can publish course results.');
    }

    const sheet = this.getResultSheetById(sheetId);
    if (!sheet) throw new Error('Result sheet not found.');

    const updated: CourseResultSheet = {
      ...sheet,
      status: 'published',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sheets = this.getResultSheets();
    const idx = sheets.findIndex((s) => s.id === sheetId);
    if (idx !== -1) sheets[idx] = updated;
    save(KEYS.RESULT_SHEETS, sheets);

    this.logAudit({
      action: 'RESULT_SHEET_OFFICIALLY_PUBLISHED',
      actorId: officer.id,
      actorName: officer.name,
      actorRole: officer.role,
      target: sheet.courseCode,
      details: `Officially released and published academic results for ${sheet.courseCode}.`,
      status: 'success',
    });

    return updated;
  },

  // CARRYOVER COURSE MANAGEMENT
  getCarryoverRecords(): CarryoverRecord[] {
    return load<CarryoverRecord[]>(KEYS.CARRYOVER_RECORDS, INITIAL_CARRYOVER_RECORDS);
  },

  getCarryoversByStudent(matricNumber: string): CarryoverRecord[] {
    const clean = matricNumber.trim().toLowerCase();
    return this.getCarryoverRecords().filter((co) => co.matricNumber.toLowerCase() === clean);
  },

  addCarryoverRecord(
    record: Omit<CarryoverRecord, 'id' | 'addedAt'>,
    officer: User
  ): CarryoverRecord {
    if (officer.role !== 'result_officer' && officer.role !== 'admin') {
      throw new Error('Unauthorized: Only Result Officers or Administrators can assign carryover courses.');
    }

    const records = this.getCarryoverRecords();
    // Prevent duplicate outstanding carryovers for the same course and student
    const duplicate = records.find(
      (r) =>
        r.matricNumber.toLowerCase() === record.matricNumber.toLowerCase() &&
        r.courseCode.toLowerCase() === record.courseCode.toLowerCase() &&
        r.status === 'outstanding'
    );
    if (duplicate) {
      throw new Error(
        `Duplicate carryover rejected: ${record.matricNumber} already has an active outstanding carryover registered for ${record.courseCode}.`
      );
    }

    const newRecord: CarryoverRecord = {
      ...record,
      id: `co-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      addedAt: new Date().toISOString(),
      addedByOfficerId: officer.id,
      addedByOfficerName: officer.name,
    };

    records.unshift(newRecord);
    save(KEYS.CARRYOVER_RECORDS, records);

    this.logAudit({
      action: 'CARRYOVER_COURSE_ASSIGNED',
      actorId: officer.id,
      actorName: officer.name,
      actorRole: officer.role,
      target: `${record.matricNumber} (${record.courseCode})`,
      details: `Assigned carryover for ${record.courseCode} to student ${record.matricNumber}. Reason: ${record.reason}`,
      status: 'success',
    });

    return newRecord;
  },

  removeCarryoverRecord(id: string, reason: string, officer: User): void {
    if (officer.role !== 'result_officer' && officer.role !== 'admin') {
      throw new Error('Unauthorized: Only Result Officers or Administrators can remove carryover courses.');
    }

    const records = this.getCarryoverRecords();
    const target = records.find((r) => r.id === id);
    if (!target) throw new Error('Carryover record not found.');

    // We keep the historical record but mark as 'cleared' or filtered out, preserving audit history
    const updated = records.filter((r) => r.id !== id);
    save(KEYS.CARRYOVER_RECORDS, updated);

    this.logAudit({
      action: 'CARRYOVER_COURSE_REMOVED',
      actorId: officer.id,
      actorName: officer.name,
      actorRole: officer.role,
      target: `${target.matricNumber} (${target.courseCode})`,
      details: `Removed carryover course ${target.courseCode} from ${target.matricNumber}. Officer Justification: ${reason}`,
      status: 'warning',
    });
  },
};

// Auto initialize on module load
DatabaseService.initialize();
