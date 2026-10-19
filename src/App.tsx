import React, { useState, useEffect } from 'react';
import { 
  User, 
  Course, 
  Announcement, 
  AcademicMaterial, 
  NotificationLog, 
  SavedCalculation, 
  ChatMessage, 
  AgileSprint, 
  AgileTask,
  RepInquiry
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_COURSES, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_MATERIALS, 
  INITIAL_NOTIFICATION_LOGS, 
  INITIAL_CHAT_MESSAGES, 
  INITIAL_AGILE_SPRINTS,
  INITIAL_REP_INQUIRIES
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { LecturerDashboard } from './components/LecturerDashboard';
import { RegistrarDashboard } from './components/RegistrarDashboard';
import { DisseminationHub } from './components/DisseminationHub';
import { CGPACalculator } from './components/CGPACalculator';
import { StudentChat } from './components/StudentChat';
import { MaterialsArchive } from './components/MaterialsArchive';
import { AgileBoard } from './components/AgileBoard';
import { CourseRepInquiryQueue } from './components/CourseRepInquiryQueue';
import { UrgentAlertTicker } from './components/UrgentAlertTicker';
import { NotificationModal } from './components/NotificationModal';
import { AuthModal } from './components/AuthModal';
import { Smartphone, Mail, Bell, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Persistent state with localStorage
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('novalis_sids_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default: Chukwuebuka Obi (Course Rep)
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('novalis_sids_courses');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('novalis_sids_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [materials, setMaterials] = useState<AcademicMaterial[]>(() => {
    const saved = localStorage.getItem('novalis_sids_materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('novalis_sids_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATION_LOGS;
  });

  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>(() => {
    const saved = localStorage.getItem('novalis_sids_saved_calcs');
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('novalis_sids_messages');
    return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  });

  const [sprints, setSprints] = useState<AgileSprint[]>(() => {
    const saved = localStorage.getItem('novalis_sids_sprints');
    return saved ? JSON.parse(saved) : INITIAL_AGILE_SPRINTS;
  });

  const [inquiries, setInquiries] = useState<RepInquiry[]>(() => {
    const saved = localStorage.getItem('novalis_sids_inquiries');
    return saved ? JSON.parse(saved) : INITIAL_REP_INQUIRIES;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeToast, setActiveToast] = useState<{ title: string; message: string; type: 'sms' | 'email' | 'system' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('novalis_sids_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('novalis_sids_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('novalis_sids_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('novalis_sids_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('novalis_sids_notifications', JSON.stringify(notificationLogs));
  }, [notificationLogs]);

  useEffect(() => {
    localStorage.setItem('novalis_sids_saved_calcs', JSON.stringify(savedCalculations));
  }, [savedCalculations]);

  useEffect(() => {
    localStorage.setItem('novalis_sids_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('novalis_sids_sprints', JSON.stringify(sprints));
  }, [sprints]);

  useEffect(() => {
    localStorage.setItem('novalis_sids_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);

  // Compute unread announcements
  const unreadCount = announcements.filter((a) => !a.readBy.includes(currentUser.id)).length;

  const triggerToast = (title: string, message: string, type: 'sms' | 'email' | 'system' = 'system') => {
    setActiveToast({ title, message, type });
    setTimeout(() => setActiveToast(null), 5000);
  };

  // Toggle Read Status on Announcement
  const handleToggleRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const isRead = a.readBy.includes(currentUser.id);
        const newReadBy = isRead
          ? a.readBy.filter((uid) => uid !== currentUser.id)
          : [...a.readBy, currentUser.id];
        return { ...a, readBy: newReadBy };
      })
    );
  };

  // Lecturer updates fixed credit units
  const handleUpdateCourseUnits = (courseCode: string, newUnits: number) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.code === courseCode
          ? {
              ...c,
              creditUnits: newUnits,
              lastUpdatedBy: currentUser.name,
              lastUpdatedAt: new Date().toISOString().split('T')[0],
            }
          : c
      )
    );

    triggerToast(
      'Curriculum Credit Units Synchronized',
      `${courseCode} has been updated to ${newUnits} Credit Units. CGPA calculators updated for all enrolled students.`,
      'system'
    );
  };

  // Send new announcement / broadcast (from Lecturer or Registrar)
  const handleSendAnnouncement = (
    announcementData: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>
  ) => {
    const newId = `ann-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newAnnouncement: Announcement = {
      ...announcementData,
      id: newId,
      createdAt: timestamp,
      readBy: [],
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);

    // Generate SMS & Email notification logs if channels were selected
    const newLogs: NotificationLog[] = [];

    // Find targeted recipients
    const targetStudents = INITIAL_USERS.filter((u) => {
      if (u.role !== 'student') return false;
      if (announcementData.target.type === 'all') return true;
      if (announcementData.target.type === 'faculty' && announcementData.target.faculty === u.faculty) {
        if (announcementData.target.level && announcementData.target.level !== u.level) return false;
        return true;
      }
      if (announcementData.target.type === 'course' && announcementData.target.courseCode) {
        return u.enrolledCourseCodes?.includes(announcementData.target.courseCode);
      }
      return true;
    });

    targetStudents.forEach((std) => {
      if (announcementData.channels.smsSent) {
        newLogs.push({
          id: `notif-sms-${Date.now()}-${std.id}`,
          type: 'sms',
          recipientId: std.id,
          recipientName: std.name,
          recipientContact: std.phone,
          subject: announcementData.title,
          preview: `NOVALIS-SMS: ${announcementData.title} - ${announcementData.content.substring(0, 90)}...`,
          timestamp,
          status: 'delivered',
          sourceTitle: announcementData.title,
        });
      }

      if (announcementData.channels.emailSent) {
        newLogs.push({
          id: `notif-email-${Date.now()}-${std.id}`,
          type: 'email',
          recipientId: std.id,
          recipientName: std.name,
          recipientContact: std.email,
          subject: announcementData.title,
          preview: announcementData.content.substring(0, 160),
          timestamp,
          status: 'delivered',
          sourceTitle: announcementData.title,
        });
      }
    });

    if (newLogs.length > 0) {
      setNotificationLogs((prev) => [...newLogs, ...prev]);
    }

    triggerToast(
      'Broadcast Disseminated',
      `Sent to ${targetStudents.length} students via ${announcementData.channels.smsSent ? 'SMS & ' : ''}${announcementData.channels.emailSent ? 'Email & ' : ''}In-App notice.`,
      announcementData.channels.smsSent ? 'sms' : 'email'
    );
  };

  // Lecturer uploads material
  const handleUploadMaterial = (
    matData: Omit<AcademicMaterial, 'id' | 'uploadedAt' | 'downloadCount'>
  ) => {
    const newMat: AcademicMaterial = {
      ...matData,
      id: `mat-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      downloadCount: 0,
    };

    setMaterials((prev) => [newMat, ...prev]);
    triggerToast(
      'Academic Material Published',
      `"${newMat.title}" added to ${newMat.courseCode} repository.`,
      'system'
    );
  };

  // Download material simulation
  const handleDownloadMaterial = (materialId: string) => {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === materialId ? { ...m, downloadCount: m.downloadCount + 1 } : m
      )
    );
  };

  // Student peer messaging
  // Student peer messaging with voice note support
  const handleSendMessage = (
    receiverId: string,
    content: string,
    voiceData?: { audioUrl: string; duration: number; waveform: number[] }
  ) => {
    const receiver = INITIAL_USERS.find((u) => u.id === receiverId);
    if (!receiver) return;

    const isVoice = Boolean(voiceData);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderMatric: currentUser.matricNumber,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverRole: receiver.role,
      content: isVoice ? `Voice note (${voiceData?.duration}s)` : content,
      timestamp: new Date().toISOString(),
      read: true,
      messageType: isVoice ? 'voice' : 'text',
      audioUrl: voiceData?.audioUrl,
      audioDuration: voiceData?.duration,
      waveform: voiceData?.waveform,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Simulate response after 1.5 seconds
    setTimeout(() => {
      let replyContent = isVoice
        ? `Listened to your voice message! Thanks for the update, will coordinate with you accordingly.`
        : `Received your message: "${content.substring(0, 30)}...". Let me review this and get back to you!`;

      if (receiver.role === 'lecturer') {
        replyContent = isVoice
          ? `Hello ${currentUser.name}. I received your voice recording regarding the class inquiry. Noted and acknowledged.`
          : `Hello ${currentUser.name}. I have noted this query from the class cohort. We will address it in our next lecture session.`;
      } else if (receiver.isCourseRep) {
        replyContent = isVoice
          ? `Got your audio message! As Course Rep, I will include this in the weekly briefing for the course lecturer.`
          : `Thanks for reaching out! As Course Rep, I will compile this inquiry with others and present it to the lecturer.`;
      }

      const replyMsg: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        senderId: receiver.id,
        senderName: receiver.name,
        senderMatric: receiver.matricNumber,
        senderAvatar: receiver.avatar,
        senderRole: receiver.role,
        receiverId: currentUser.id,
        receiverName: currentUser.name,
        receiverRole: currentUser.role,
        content: replyContent,
        timestamp: new Date().toISOString(),
        read: false,
        messageType: 'text',
      };

      setMessages((prev) => [...prev, replyMsg]);
      triggerToast(
        `New Message from ${receiver.name}`,
        replyContent.substring(0, 70) + '...',
        'system'
      );
    }, 1200);
  };

  // Save CGPA calculation
  const handleSaveCalculation = (calc: SavedCalculation) => {
    setSavedCalculations((prev) => [calc, ...prev]);
  };

  const handleDeleteCalculation = (id: string) => {
    setSavedCalculations((prev) => prev.filter((c) => c.id !== id));
    triggerToast('Calculation Record Removed', 'The saved semester calculation has been deleted.', 'system');
  };

  // Agile Sprints task status update
  const handleUpdateSprintTaskStatus = (
    sprintId: string,
    taskId: string,
    newStatus: AgileTask['status']
  ) => {
    setSprints((prev) =>
      prev.map((s) => {
        if (s.id !== sprintId) return s;
        return {
          ...s,
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
        };
      })
    );

    if (newStatus === 'disseminated') {
      triggerToast('Agile Story Disseminated', 'Task marked as released and broadcasted to cohort.', 'system');
    }
  };

  const handleAddSprintTask = (sprintId: string, task: Omit<AgileTask, 'id'>) => {
    const newTask: AgileTask = {
      ...task,
      id: `task-${Date.now()}`,
    };

    setSprints((prev) =>
      prev.map((s) => (s.id === sprintId ? { ...s, tasks: [...s.tasks, newTask] } : s))
    );

    triggerToast('Sprint Story Added', `"${newTask.title}" added to sprint backlog.`, 'system');
  };

  const urgentAnnouncements = announcements.filter((a) => a.urgency === 'urgent');

  // Submit class query to Course Rep
  const handleSubmitInquiry = (
    inquiryData: Omit<RepInquiry, 'id' | 'createdAt' | 'upvotes' | 'upvotedBy' | 'status'>
  ) => {
    const newInq: RepInquiry = {
      ...inquiryData,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      upvotedBy: [currentUser.id],
      status: 'pending',
    };

    setInquiries((prev) => [newInq, ...prev]);
    triggerToast(
      'Inquiry Submitted to Course Rep',
      `"${newInq.subject}" queued for review by your Course Rep.`,
      'system'
    );
  };

  // Upvote inquiry
  const handleUpvoteInquiry = (inquiryId: string) => {
    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id !== inquiryId) return inq;
        const alreadyUpvoted = inq.upvotedBy.includes(currentUser.id);
        const newUpvotedBy = alreadyUpvoted
          ? inq.upvotedBy.filter((uid) => uid !== currentUser.id)
          : [...inq.upvotedBy, currentUser.id];
        return {
          ...inq,
          upvotes: newUpvotedBy.length,
          upvotedBy: newUpvotedBy,
        };
      })
    );
  };

  // Course Rep forwards to Lecturer
  const handleForwardInquiry = (inquiryId: string) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: 'forwarded_to_lecturer' } : inq))
    );
    triggerToast(
      'Inquiry Endorsed & Forwarded',
      'Course Rep has submitted this cohort query to the course lecturer.',
      'system'
    );
  };

  // Lecturer resolves inquiry
  const handleResolveInquiry = (inquiryId: string, reply: string) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: 'resolved', lecturerReply: reply } : inq))
    );
    triggerToast(
      'Lecturer Decision Broadcasted',
      'Response has been posted to the class cohort.',
      'system'
    );
  };

  return (
    <div className="min-h-screen text-slate-100 liquid-bg flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Urgent Announcements Banner Ticker */}
      <UrgentAlertTicker
        urgentAnnouncements={urgentAnnouncements}
        onOpenAnnouncement={() => setActiveTab('dissemination')}
      />

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        allUsers={INITIAL_USERS}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          triggerToast('Profile Switched', `Now operating as ${user.name} (${user.role.toUpperCase()})`, 'system');
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notificationLogs={notificationLogs}
        onOpenNotifications={() => setShowNotificationModal(true)}
        unreadCount={unreadCount}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-28 lg:pb-10">
        
        {activeTab === 'dashboard' && (
          currentUser.role === 'student' ? (
            <StudentDashboard
              currentUser={currentUser}
              courses={courses}
              announcements={announcements}
              materials={materials}
              onToggleRead={handleToggleRead}
              onNavigateTab={setActiveTab}
              onStartChatWithPeer={() => setActiveTab('chat')}
              onStartChatWithLecturer={() => setActiveTab('chat')}
            />
          ) : currentUser.role === 'lecturer' ? (
            <LecturerDashboard
              currentUser={currentUser}
              courses={courses}
              onUpdateCourseUnits={handleUpdateCourseUnits}
              onSendAnnouncement={handleSendAnnouncement}
              onUploadMaterial={handleUploadMaterial}
              allUsers={INITIAL_USERS}
              materials={materials}
            />
          ) : (
            <RegistrarDashboard
              currentUser={currentUser}
              onSendAnnouncement={handleSendAnnouncement}
              allUsers={INITIAL_USERS}
              announcements={announcements}
              notificationLogs={notificationLogs}
            />
          )
        )}

        {activeTab === 'dissemination' && (
          <DisseminationHub
            currentUser={currentUser}
            courses={courses}
            announcements={announcements}
            notificationLogs={notificationLogs}
            allUsers={INITIAL_USERS}
            onToggleRead={handleToggleRead}
            onSendAnnouncement={handleSendAnnouncement}
            onUpdateCourseUnits={handleUpdateCourseUnits}
            onUploadMaterial={handleUploadMaterial}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsArchive
            currentUser={currentUser}
            materials={materials}
            courses={courses}
            onDownloadMaterial={handleDownloadMaterial}
            onOpenUpload={() => setActiveTab('dissemination')}
          />
        )}

        {activeTab === 'calculator' && (
          <CGPACalculator
            currentUser={currentUser}
            courses={courses}
            savedCalculations={savedCalculations}
            onSaveCalculation={handleSaveCalculation}
            onDeleteCalculation={handleDeleteCalculation}
          />
        )}

        {activeTab === 'chat' && (
          <StudentChat
            currentUser={currentUser}
            allUsers={INITIAL_USERS}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        )}

        {activeTab === 'rep-inquiries' && (
          <CourseRepInquiryQueue
            currentUser={currentUser}
            inquiries={inquiries}
            courses={courses}
            onSubmitInquiry={handleSubmitInquiry}
            onUpvoteInquiry={handleUpvoteInquiry}
            onForwardToLecturer={handleForwardInquiry}
            onResolveInquiry={handleResolveInquiry}
          />
        )}

        {activeTab === 'agile' && (
          <AgileBoard
            sprints={sprints}
            currentUser={currentUser}
            onUpdateTaskStatus={handleUpdateSprintTaskStatus}
            onAddTask={handleAddSprintTask}
          />
        )}

      </main>

      {/* Floating Notification Toast */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-white/20 bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              {activeToast.type === 'sms' ? (
                <Smartphone className="w-4 h-4 text-emerald-400" />
              ) : activeToast.type === 'email' ? (
                <Mail className="w-4 h-4 text-indigo-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white">{activeToast.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{activeToast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        logs={notificationLogs}
        currentUser={currentUser}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        allUsers={INITIAL_USERS}
        onSelectUser={(u) => {
          setCurrentUser(u);
          triggerToast('Logged In', `Welcome back, ${u.name}!`, 'system');
        }}
      />

      {/* Quiet Minimal Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Novalis University of Technology</span>
            <span>·</span>
            <span>Student Information Dissemination System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Official Senate 5.00 Scale</span>
            <span>·</span>
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              Switch Account / Login
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
