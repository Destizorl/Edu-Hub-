import React, { useState } from 'react';
import { RepInquiry, User, Course } from '../types';
import { 
  ShieldCheck, 
  ThumbsUp, 
  Send, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Plus, 
  AlertTriangle,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';

interface CourseRepInquiryQueueProps {
  currentUser: User;
  inquiries: RepInquiry[];
  courses: Course[];
  onSubmitInquiry: (inquiry: Omit<RepInquiry, 'id' | 'createdAt' | 'upvotes' | 'upvotedBy' | 'status'>) => void;
  onUpvoteInquiry: (inquiryId: string) => void;
  onForwardToLecturer: (inquiryId: string) => void;
  onResolveInquiry: (inquiryId: string, reply: string) => void;
}

export const CourseRepInquiryQueue: React.FC<CourseRepInquiryQueueProps> = ({
  currentUser,
  inquiries,
  courses,
  onSubmitInquiry,
  onUpvoteInquiry,
  onForwardToLecturer,
  onResolveInquiry,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [courseCode, setCourseCode] = useState(courses[0]?.code || 'CSC 305');
  const [urgency, setUrgency] = useState<'normal' | 'high'>('normal');

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [lecturerReplyText, setLecturerReplyText] = useState('');

  const isCourseRep = currentUser.isCourseRep;
  const isLecturer = currentUser.role === 'lecturer';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) return;

    onSubmitInquiry({
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentMatric: currentUser.matricNumber || 'CSC/2021/042',
      courseCode,
      subject,
      details,
      urgency,
    });

    setShowNewModal(false);
    setSubject('');
    setDetails('');
  };

  const handleSendLecturerReply = (inquiryId: string) => {
    if (!lecturerReplyText.trim()) return;
    onResolveInquiry(inquiryId, lecturerReplyText.trim());
    setActiveReplyId(null);
    setLecturerReplyText('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Course Rep Liaison Desk
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Class Cohort Query Aggregation
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Class Inquiry & Lecturer Liaison Queue
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Students submit course issues, extension requests, and lab complaints here. The appointed Course Representative curates, upvotes, and presents consolidated inquiries directly to course lecturers.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Class Query to Rep</span>
          </button>
        </div>
      </div>

      {/* Inquiries List */}
      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <div className="p-8 rounded-3xl liquid-glass text-center text-slate-400 text-xs">
            No class inquiries currently submitted. Click above to submit a query.
          </div>
        ) : (
          inquiries.map((inq) => {
            const hasUpvoted = inq.upvotedBy.includes(currentUser.id);

            return (
              <div
                key={inq.id}
                className="p-5 sm:p-6 rounded-2xl liquid-glass border border-white/10 text-left space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-xs font-bold text-cyan-300 px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        {inq.courseCode}
                      </span>

                      {inq.urgency === 'high' && (
                        <span className="text-[10px] font-bold text-rose-300 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> High Priority
                        </span>
                      )}

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        inq.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : inq.status === 'forwarded_to_lecturer'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {inq.status === 'resolved'
                          ? 'Resolved by Lecturer'
                          : inq.status === 'forwarded_to_lecturer'
                          ? 'Endorsed & Forwarded by Course Rep'
                          : 'Under Course Rep Review'}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {inq.subject}
                    </h3>
                  </div>

                  {/* Upvote Button */}
                  <button
                    onClick={() => onUpvoteInquiry(inq.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      hasUpvoted
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{inq.upvotes}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {inq.details}
                </p>

                {/* Lecturer Response Box if resolved */}
                {inq.lecturerReply && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Official Lecturer Decision:
                    </div>
                    <div className="text-xs text-emerald-200">
                      "{inq.lecturerReply}"
                    </div>
                  </div>
                )}

                {/* Footer and Role Actions */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Submitted by: <strong>{inq.studentName}</strong> ({inq.studentMatric})</span>
                    <span>·</span>
                    <span className="font-mono text-[11px]">{new Date(inq.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Course Rep Forward Action */}
                    {isCourseRep && inq.status === 'pending' && (
                      <button
                        onClick={() => onForwardToLecturer(inq.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-sm"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Forward to Course Lecturer</span>
                      </button>
                    )}

                    {/* Lecturer Reply Action */}
                    {isLecturer && inq.status === 'forwarded_to_lecturer' && (
                      activeReplyId === inq.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={lecturerReplyText}
                            onChange={(e) => setLecturerReplyText(e.target.value)}
                            placeholder="Type official response to class..."
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-emerald-400 text-xs text-white"
                          />
                          <button
                            onClick={() => handleSendLecturerReply(inq.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveReplyId(inq.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                        >
                          Respond to Cohort
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Query Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-slate-100 text-left">
            <h3 className="text-base font-bold text-white mb-1">
              Submit Class Query to Course Representative
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Your Course Rep will review and present this issue directly to the lecturer
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Related Course
                  </label>
                  <select
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  >
                    {courses.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} - {c.title.substring(0, 20)}...</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Urgency
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">Urgent (Upcoming Deadline)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Query Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Request to shift Sprint 3 deadline due to practical conflict"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Details & Context
                </label>
                <textarea
                  required
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Explain why this affects your class cohort and what resolution you propose..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white cursor-pointer"
                >
                  Send to Course Rep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
