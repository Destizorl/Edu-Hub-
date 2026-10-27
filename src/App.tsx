import React, { useState, useEffect } from 'react';
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
} from './types';
import { DatabaseService } from './services/db';
import { AuthService } from './services/auth';
import { LoginPage } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { LecturerDashboard } from './components/LecturerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ResultOfficerDashboard } from './components/ResultOfficerDashboard';
import { Smartphone, Mail, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function App() {
  // Authentication State: Default entry point is unauthenticated (null) unless valid session verified
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return AuthService.getCurrentSession();
  });

  // Database Entities (Synchronized with DatabaseService)
  const [courses, setCourses] = useState<Course[]>(() => DatabaseService.getCourses());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => DatabaseService.getAnnouncements());
  const [materials, setMaterials] = useState<AcademicMaterial[]>(() => DatabaseService.getMaterials());
  const [assignments, setAssignments] = useState<Assignment[]>(() => DatabaseService.getAssignments());
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(() => DatabaseService.getSubmissions());
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => DatabaseService.getTimetable());
  const [messages, setMessages] = useState<ChatMessage[]>(() => DatabaseService.getMessages());
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => DatabaseService.getNotifications());
  const [allUsers, setAllUsers] = useState<User[]>(() => DatabaseService.getUsers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => DatabaseService.getAuditLogs());
  const [settings, setSettings] = useState<SystemSettings>(() => DatabaseService.getSettings());

  // Global Floating Toast
  const [activeToast, setActiveToast] = useState<{
    title: string;
    message: string;
    type: 'sms' | 'email' | 'system';
  } | null>(null);

  const triggerToast = (title: string, message: string, type: 'sms' | 'email' | 'system' = 'system') => {
    setActiveToast({ title, message, type });
    setTimeout(() => setActiveToast(null), 5000);
  };

  // Re-synchronize data on any database write
  useEffect(() => {
    const handleStorageChange = () => {
      setCourses(DatabaseService.getCourses());
      setAnnouncements(DatabaseService.getAnnouncements());
      setMaterials(DatabaseService.getMaterials());
      setAssignments(DatabaseService.getAssignments());
      setSubmissions(DatabaseService.getSubmissions());
      setTimetable(DatabaseService.getTimetable());
      setMessages(DatabaseService.getMessages());
      setNotifications(DatabaseService.getNotifications());
      setAllUsers(DatabaseService.getUsers());
      setAuditLogs(DatabaseService.getAuditLogs());
      setSettings(DatabaseService.getSettings());

      // If current user was updated (e.g., status changed or profile updated)
      if (currentUser) {
        const fresh = DatabaseService.getUserById(currentUser.id);
        if (fresh) {
          if (fresh.status !== 'active') {
            AuthService.logout();
            setCurrentUser(null);
            triggerToast('Session Terminated', 'Your account has been suspended by an administrator.', 'system');
          } else {
            setCurrentUser(fresh);
          }
        }
      }
    };

    const handleAuthChange = (e: any) => {
      const user = e.detail?.user || null;
      setCurrentUser(user);
    };

    window.addEventListener('edustream_storage_change', handleStorageChange);
    window.addEventListener('edustream_auth_change', handleAuthChange);

    return () => {
      window.removeEventListener('edustream_storage_change', handleStorageChange);
      window.removeEventListener('edustream_auth_change', handleAuthChange);
    };
  }, [currentUser]);

  // Handle Logout
  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    triggerToast('Logged Out', 'Your session has been terminated safely.', 'system');
  };

  // ENTRY POINT 1: If no valid authenticated session exists, display the login page!
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-[#ccf32f] selection:text-slate-950">
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            triggerToast('Authenticated Successfully', `Welcome, ${user.name} (${user.role.toUpperCase()})`, 'system');
          }}
        />

        {/* Global Toast */}
        {activeToast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                {activeToast.type === 'sms' ? (
                  <Smartphone className="w-4 h-4 text-blue-600" />
                ) : activeToast.type === 'email' ? (
                  <Mail className="w-4 h-4 text-blue-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-900">{activeToast.title}</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{activeToast.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ENTRY POINT 2: User is authenticated. Route strictly according to verified backend role!
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-[#ccf32f] selection:text-slate-950">
      
      {/* Role-Specific Dashboard Rendering */}
      {currentUser.role === 'student' && (
        <StudentDashboard
          currentUser={currentUser}
          courses={courses}
          announcements={announcements}
          materials={materials}
          assignments={assignments}
          submissions={submissions}
          timetable={timetable}
          messages={messages}
          notifications={notifications}
          allUsers={allUsers}
          onLogout={handleLogout}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          triggerToast={triggerToast}
        />
      )}

      {currentUser.role === 'lecturer' && (
        <LecturerDashboard
          currentUser={currentUser}
          courses={courses}
          announcements={announcements}
          materials={materials}
          assignments={assignments}
          submissions={submissions}
          timetable={timetable}
          messages={messages}
          notifications={notifications}
          allUsers={allUsers}
          onLogout={handleLogout}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          triggerToast={triggerToast}
        />
      )}

      {currentUser.role === 'result_officer' && (
        <ResultOfficerDashboard
          currentUser={currentUser}
          courses={courses}
          announcements={announcements}
          materials={materials}
          assignments={assignments}
          submissions={submissions}
          timetable={timetable}
          messages={messages}
          notifications={notifications}
          allUsers={allUsers}
          auditLogs={auditLogs}
          settings={settings}
          onLogout={handleLogout}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          triggerToast={triggerToast}
        />
      )}

      {(currentUser.role === 'admin' || currentUser.role === 'registrar') && (
        <AdminDashboard
          currentUser={currentUser}
          courses={courses}
          announcements={announcements}
          materials={materials}
          assignments={assignments}
          submissions={submissions}
          timetable={timetable}
          messages={messages}
          notifications={notifications}
          allUsers={allUsers}
          auditLogs={auditLogs}
          settings={settings}
          onLogout={handleLogout}
          onUpdateUser={(updated) => setCurrentUser(updated)}
          triggerToast={triggerToast}
        />
      )}

      {/* Floating Notification Toast */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              {activeToast.type === 'sms' ? (
                <Smartphone className="w-4 h-4 text-blue-600" />
              ) : activeToast.type === 'email' ? (
                <Mail className="w-4 h-4 text-blue-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-900">{activeToast.title}</h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{activeToast.message}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
