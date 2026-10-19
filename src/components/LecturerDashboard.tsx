import React, { useState } from 'react';
import { User, Course, Announcement, AcademicMaterial, AgileSprint } from '../types';
import { 
  Send, 
  BookOpen, 
  Users, 
  Upload, 
  Edit3, 
  Check, 
  Smartphone, 
  Mail, 
  FileText, 
  AlertCircle,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Calendar
} from 'lucide-react';

interface LecturerDashboardProps {
  currentUser: User;
  courses: Course[];
  onUpdateCourseUnits: (courseCode: string, newUnits: number) => void;
  onSendAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>) => void;
  onUploadMaterial: (material: Omit<AcademicMaterial, 'id' | 'uploadedAt' | 'downloadCount'>) => void;
  allUsers: User[];
  materials: AcademicMaterial[];
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  currentUser,
  courses,
  onUpdateCourseUnits,
  onSendAnnouncement,
  onUploadMaterial,
  allUsers,
  materials,
}) => {
  // Course taught by current lecturer
  const myCourses = courses.filter((c) =>
    currentUser.coursesTaught?.includes(c.code) || c.lecturerId === currentUser.id
  );

  const [activeCourseCode, setActiveCourseCode] = useState<string>(
    myCourses[0]?.code || courses[0]?.code || 'CSC 301'
  );

  // Credit Units Editing State
  const [editingUnitsCode, setEditingUnitsCode] = useState<string | null>(null);
  const [tempUnits, setTempUnits] = useState<number>(3);
  const [unitSuccessMessage, setUnitSuccessMessage] = useState<string | null>(null);

  // Dissemination Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>(activeCourseCode);
  const [targetType, setTargetType] = useState<'all_offering' | 'matric_pattern'>('all_offering');
  const [matricPrefix, setMatricPrefix] = useState('CSC/2021');
  const [urgency, setUrgency] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [attachmentName, setAttachmentName] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Material Upload State
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matCourse, setMatCourse] = useState(activeCourseCode);
  const [matType, setMatType] = useState<'pdf' | 'slide' | 'doc' | 'code' | 'zip'>('pdf');
  const [matTags, setMatTags] = useState('Slides, Revision');

  const selectedCourseObj = courses.find((c) => c.code === selectedCourse);

  // Count targeted students
  const enrolledStudents = allUsers.filter(
    (u) => u.role === 'student' && u.enrolledCourseCodes?.includes(selectedCourse)
  );

  const matchedStudents = enrolledStudents.filter((s) => {
    if (targetType === 'matric_pattern' && matricPrefix.trim()) {
      return s.matricNumber?.startsWith(matricPrefix.trim());
    }
    return true;
  });

  const handleSaveUnits = (code: string) => {
    if (tempUnits > 0 && tempUnits <= 12) {
      onUpdateCourseUnits(code, tempUnits);
      setEditingUnitsCode(null);
      setUnitSuccessMessage(`Credit Units for ${code} successfully updated to ${tempUnits} Units. Synced across all student CGPA calculators.`);
      setTimeout(() => setUnitSuccessMessage(null), 4000);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSendAnnouncement({
      title,
      content,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: 'lecturer',
      authorTitle: currentUser.title || 'Lecturer',
      category: 'lecture',
      target: {
        type: 'course',
        courseCode: selectedCourse,
        matricPrefix: targetType === 'matric_pattern' ? matricPrefix : undefined,
      },
      urgency,
      attachments: attachmentName ? [{ name: attachmentName, size: '2.4 MB', type: 'application/pdf' }] : undefined,
      channels: {
        inApp: true,
        smsSent: sendSms,
        emailSent: sendEmail,
      },
    });

    setBroadcastSent(true);
    setTitle('');
    setContent('');
    setAttachmentName('');
    setTimeout(() => setBroadcastSent(false), 5000);
  };

  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;

    const courseItem = courses.find((c) => c.code === matCourse);

    onUploadMaterial({
      title: matTitle,
      description: matDesc,
      courseCode: matCourse,
      courseTitle: courseItem?.title || matCourse,
      lecturerId: currentUser.id,
      lecturerName: currentUser.name,
      fileType: matType,
      fileSize: '3.8 MB',
      academicSession: '2026/2027',
      tags: matTags.split(',').map((t) => t.trim()),
    });

    setShowMaterialModal(false);
    setMatTitle('');
    setMatDesc('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Lecturer Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {currentUser.title} {currentUser.name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Lecturer Portal
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {currentUser.department} · {currentUser.faculty}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                Staff ID: {currentUser.staffId} · Academic Year 2026/2027
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMaterialModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Share Academic Material</span>
            </button>
          </div>
        </div>

        {unitSuccessMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{unitSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Course Curriculum & Credit Unit Editor */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-400" />
            Assigned Courses & Credit Point Management
          </h2>
          <p className="text-xs text-slate-400">
            Credit units are pre-fixed on students' CGPA calculators and can be edited here by course lecturers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myCourses.map((c) => {
            const isEditing = editingUnitsCode === c.code;
            return (
              <div
                key={c.code}
                className="p-5 rounded-2xl liquid-glass border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-sm text-cyan-300 px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      {c.code}
                    </span>
                    
                    {/* Fixed Credit Units Editor */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={tempUnits}
                          onChange={(e) => setTempUnits(Number(e.target.value))}
                          className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-blue-400 text-white font-mono text-xs text-center"
                        />
                        <button
                          onClick={() => handleSaveUnits(c.code)}
                          className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                          title="Save Units"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          {c.creditUnits} Credit Units
                        </span>
                        <button
                          onClick={() => {
                            setEditingUnitsCode(c.code);
                            setTempUnits(c.creditUnits);
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white leading-snug mb-1">
                    {c.title}
                  </h3>

                  <div className="text-xs text-slate-400">
                    Semester {c.semester} · Level {c.level} · Department of {c.department}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>Enrolled: {enrolledStudents.length} Students</span>
                  <button
                    onClick={() => {
                      setSelectedCourse(c.code);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Select for Broadcast &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dissemination Broadcast Composer */}
      <div className="rounded-3xl liquid-glass p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            Classified Student Broadcast Dispatcher
          </h2>
          <p className="text-xs text-slate-400">
            Disseminate information to all students offering a course or target by matriculation number range
          </p>
        </div>

        {broadcastSent && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <strong>Broadcast Dispatched Successfully!</strong> Sent to {matchedStudents.length} students via In-App Notice, SMS Gateway, and Email Relay.
              </div>
            </div>
            <span className="font-mono text-[10px] text-emerald-300">200 OK</span>
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-5 text-left">
          
          {/* Target Classification Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Course Cohort
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {myCourses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Targeting Classification
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('all_offering')}
                  className={`py-2 px-3 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    targetType === 'all_offering'
                      ? 'bg-blue-600 text-white border border-blue-400'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                  }`}
                >
                  All Students Offering Course
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('matric_pattern')}
                  className={`py-2 px-3 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    targetType === 'matric_pattern'
                      ? 'bg-blue-600 text-white border border-blue-400'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                  }`}
                >
                  By Matric Number Prefix
                </button>
              </div>
            </div>
          </div>

          {targetType === 'matric_pattern' && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <label className="block text-xs font-semibold text-blue-300 mb-1">
                Filter by Matriculation Number Prefix
              </label>
              <input
                type="text"
                value={matricPrefix}
                onChange={(e) => setMatricPrefix(e.target.value)}
                placeholder="e.g. CSC/2021 or CSC/2022"
                className="w-full max-w-sm px-3.5 py-2 rounded-lg bg-slate-900 border border-blue-400/40 text-xs text-white font-mono"
              />
              <p className="text-[11px] text-blue-200/80 mt-1">
                Currently targeting students whose Matriculation Number starts with "{matricPrefix}"
              </p>
            </div>
          )}

          {/* Title & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Announcement Subject / Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CSC 305: Sprint 4 User Story Rubric & Submission Deadline"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Alert (Instant SMS)</option>
              </select>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Information Content & Instructions
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide clear details on lecture schedule, assignment instructions, or submission venue..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attach Lecture Material / Rubric (Optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="e.g. CSC305_Sprint4_Rubric.pdf"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setAttachmentName(`Lecture_Notes_${selectedCourse}.pdf`)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 cursor-pointer"
              >
                Attach Course Notes
              </button>
            </div>
          </div>

          {/* Notification Channels Selection */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">
                Dissemination Dispatch Channels
              </div>
              <div className="text-[11px] text-slate-400">
                Automated multi-channel delivery ensures all students are promptly notified
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="rounded bg-slate-800 border-white/20 text-emerald-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  SMS Notification
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded bg-slate-800 border-white/20 text-indigo-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Email Notification
                </span>
              </label>
            </div>
          </div>

          {/* Audience Summary & Dispatch Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400">
              Target Audience: <strong className="text-white">{matchedStudents.length} verified students</strong> offering {selectedCourse}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Information</span>
            </button>
          </div>

        </form>
      </div>

      {/* Modal for Sharing Academic Material */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-1">
              Upload & Share Academic Material
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add lecture slides, past question archives, or lab guides to the persistent repository
            </p>

            <form onSubmit={handleMaterialSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Material Title
                </label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="e.g. CSC 305: Scrum Master Playbook & CI/CD Checklist"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  placeholder="Brief summary of syllabus chapters covered..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course
                  </label>
                  <select
                    value={matCourse}
                    onChange={(e) => setMatCourse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  >
                    {myCourses.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    File Format
                  </label>
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="slide">Presentation Slides</option>
                    <option value="doc">Word / Text Handout</option>
                    <option value="code">Source Code / Repo</option>
                    <option value="zip">Archive ZIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={matTags}
                  onChange={(e) => setMatTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer"
                >
                  Publish Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
