import React, { useState } from 'react';
import { User, NotificationLog } from '../types';
import { 
  Bell, 
  ChevronDown, 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  Calculator, 
  MessageSquare, 
  Kanban,
  FileText,
  User as UserIcon,
  Check,
  Menu,
  X,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notificationLogs: NotificationLog[];
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  activeTab,
  setActiveTab,
  notificationLogs,
  onOpenNotifications,
  unreadCount,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'student':
        return currentUser.isCourseRep ? 'Course Rep · 300L' : 'Student · 300L';
      case 'lecturer':
        return 'Lecturer';
      case 'registrar':
        return 'Registrar';
      case 'admin':
        return 'HOD / ICT';
      default:
        return role;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: GraduationCap, shortLabel: 'Home' },
    { id: 'dissemination', label: 'Dissemination', icon: FileText, shortLabel: 'Notices' },
    { id: 'materials', label: 'Materials', icon: BookOpen, shortLabel: 'Library' },
    { id: 'calculator', label: 'CGPA Hub', icon: Calculator, shortLabel: 'CGPA' },
    { id: 'chat', label: 'Student Chat', icon: MessageSquare, shortLabel: 'Chat' },
    { id: 'rep-inquiries', label: 'Rep Liaison', icon: ShieldCheck, shortLabel: 'Liaison' },
    { id: 'agile', label: 'Agile Sprints', icon: Kanban, shortLabel: 'Sprints' },
  ];

  // Mobile bottom dock primary 4 items + "More"
  const mobilePrimaryTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: GraduationCap },
    { id: 'dissemination', label: 'Broadcasts', icon: FileText },
    { id: 'calculator', label: 'CGPA', icon: Calculator },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileDrawerOpen(false);
    setMoreSheetOpen(false);
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Brand Wordmark & Crest */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 p-[1px] shadow-md shadow-indigo-500/10 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-slate-100 tracking-tight group-hover:text-indigo-300 transition-colors">
                  Novalis SIDS
                </div>
                <div className="text-[10px] text-slate-400 font-mono tracking-wider -mt-0.5 hidden xs:block">
                  Academic Dissemination System
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Notification Center & Profile Switcher & Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Notification Center Trigger */}
            <button
              onClick={onOpenNotifications}
              title="Dissemination notification center (SMS & Email logs)"
              className="relative p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer focus:outline-none"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950 font-mono animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown & Active Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 sm:gap-2.5 p-1 sm:pr-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-left cursor-pointer transition-all focus:outline-none"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-slate-700"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[110px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-indigo-400 font-mono">
                    {getRoleBadge(currentUser.role)}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900/98 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-800">
                    <div className="text-xs font-semibold text-white">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                    {currentUser.matricNumber && (
                      <div className="mt-1 text-[11px] font-mono text-cyan-400">
                        Matric: {currentUser.matricNumber}
                      </div>
                    )}
                    {currentUser.staffId && (
                      <div className="mt-1 text-[11px] font-mono text-cyan-400">
                        Staff ID: {currentUser.staffId}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-slate-300">
                      {currentUser.department} · {currentUser.faculty}
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Switch Role Simulation:
                    </div>
                    <div className="space-y-1 max-h-[220px] overflow-y-auto">
                      {allUsers.map((u) => {
                        const isSelected = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u);
                              setProfileDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                referrerPolicy="no-referrer"
                                className="w-6 h-6 rounded-md object-cover"
                              />
                              <div>
                                <div className="font-medium text-slate-200">{u.name}</div>
                                <div className="text-[10px] text-slate-400">
                                  {u.role === 'student' ? (u.isCourseRep ? 'Course Rep' : 'Student') : u.role}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Tablet Drawer Toggle Button */}
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer focus:outline-none"
              aria-label="Toggle navigation drawer"
            >
              {mobileDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>

        </div>

        {/* Mobile Full Navigation Drawer (Slide Down) */}
        {mobileDrawerOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-2xl px-4 py-4 space-y-2 animate-in slide-in-from-top-4 duration-200 shadow-2xl">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 mb-2">
              All Portal Modules
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-900 border border-slate-800/60'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/80 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Active: {currentUser.name}</span>
              </div>
              <span className="font-mono text-cyan-400 text-[11px]">{getRoleBadge(currentUser.role)}</span>
            </div>
          </div>
        )}
      </header>

      {/* Senior Mobile Bottom Navigation Dock (Thumb-Optimized, Safe Touch Targets) */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 px-3 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
        {mobilePrimaryTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] transition-all cursor-pointer min-w-[56px] ${
                isActive 
                  ? 'text-indigo-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-600/20 text-indigo-300 shadow-sm shadow-indigo-500/20' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* More Actions Drawer Trigger on Bottom Bar */}
        <button
          onClick={() => setMoreSheetOpen(!moreSheetOpen)}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] transition-all cursor-pointer min-w-[56px] ${
            moreSheetOpen || ['materials', 'rep-inquiries', 'agile'].includes(activeTab)
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${moreSheetOpen || ['materials', 'rep-inquiries', 'agile'].includes(activeTab) ? 'bg-indigo-600/20 text-indigo-300' : ''}`}>
            <Layers className="w-4 h-4" />
          </div>
          <span className="tracking-tight">More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer Sheet */}
      {moreSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="flex-1 cursor-pointer"
            onClick={() => setMoreSheetOpen(false)}
          />
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 shadow-2xl safe-area-pb">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Additional Academic Modules</span>
              </div>
              <button 
                onClick={() => setMoreSheetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSelectTab('materials')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left text-xs ${
                  activeTab === 'materials'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Materials & Past Questions</div>
                    <div className="text-[10px] text-slate-400">Slides, past exam papers, and syllabus syllabi</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
              </button>

              <button
                onClick={() => handleSelectTab('rep-inquiries')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left text-xs ${
                  activeTab === 'rep-inquiries'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Course Rep Liaison Queue</div>
                    <div className="text-[10px] text-slate-400">Class queries & lecturer endorsement channel</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
              </button>

              <button
                onClick={() => handleSelectTab('agile')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left text-xs ${
                  activeTab === 'agile'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                    <Kanban className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Agile Dissemination Sprints</div>
                    <div className="text-[10px] text-slate-400">Iterative course releases & milestone tracking</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
