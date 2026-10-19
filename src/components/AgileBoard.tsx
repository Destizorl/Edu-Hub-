import React, { useState } from 'react';
import { AgileSprint, AgileTask, User } from '../types';
import { 
  Kanban, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Calendar, 
  UserCheck, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface AgileBoardProps {
  sprints: AgileSprint[];
  currentUser: User;
  onUpdateTaskStatus: (sprintId: string, taskId: string, newStatus: AgileTask['status']) => void;
  onAddTask: (sprintId: string, task: Omit<AgileTask, 'id'>) => void;
}

export const AgileBoard: React.FC<AgileBoardProps> = ({
  sprints,
  currentUser,
  onUpdateTaskStatus,
  onAddTask,
}) => {
  const [activeSprintId, setActiveSprintId] = useState<string>(sprints[0]?.id || 'sprint-03');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<AgileTask['type']>('lecture');
  const [dueDate, setDueDate] = useState('2026-10-24');
  const [matricScope, setMatricScope] = useState('CSC/2021/*');
  const [mobileColumn, setMobileColumn] = useState<'all' | 'backlog' | 'in_progress' | 'disseminated'>('all');

  const currentSprint = sprints.find((s) => s.id === activeSprintId) || sprints[0];

  const backlogTasks = currentSprint?.tasks.filter((t) => t.status === 'backlog') || [];
  const inProgressTasks = currentSprint?.tasks.filter((t) => t.status === 'in_progress') || [];
  const disseminatedTasks = currentSprint?.tasks.filter((t) => t.status === 'disseminated') || [];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !currentSprint) return;

    onAddTask(currentSprint.id, {
      title: taskTitle,
      type: taskType,
      status: 'backlog',
      dueDate,
      assignedCourse: currentSprint.courseCode,
      matricScope,
    });

    setShowAddTaskModal(false);
    setTaskTitle('');
  };

  const getTypeBadge = (type: AgileTask['type']) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'assignment':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'material':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'quiz':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'notice':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  const totalSprintTasks = currentSprint?.tasks.length || 0;
  const completedCount = disseminatedTasks.length;
  const sprintProgress = totalSprintTasks > 0 ? Math.round((completedCount / totalSprintTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Agile Header Banner */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Agile Curriculum Dissemination
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Scrum Sprint Model · CSC 305
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Kanban className="w-6 h-6 text-indigo-400" />
              Academic Sprint Dissemination Board
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Iterative, milestone-driven information dissemination framework for course syllabus execution, assignment releases, and feedback retrospectives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentUser.role === 'lecturer' && (
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dissemination Story</span>
              </button>
            )}
          </div>
        </div>

        {/* Sprint KPIs Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left">
            <div className="text-[10px] text-slate-400 font-mono">Sprint Velocity</div>
            <div className="text-xl font-bold text-white font-mono">{sprintProgress}% Complete</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">{completedCount} of {totalSprintTasks} Stories Released</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left">
            <div className="text-[10px] text-slate-400 font-mono">Active Sprint</div>
            <div className="text-base font-bold text-cyan-300">{currentSprint?.title}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{currentSprint?.startDate} → {currentSprint?.endDate}</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left">
            <div className="text-[10px] text-slate-400 font-mono">Course Scrum Master</div>
            <div className="text-base font-bold text-white">{currentSprint?.lecturerName}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Course Rep: Chukwuebuka Obi</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left">
            <div className="text-[10px] text-slate-400 font-mono">Methodology</div>
            <div className="text-base font-bold text-indigo-300">Bi-Weekly Sprints</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Continuous Student Feedback</div>
          </div>
        </div>
      </div>

      {/* Sprint Selection Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {sprints.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSprintId(s.id)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSprintId === s.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {s.title} ({s.status.toUpperCase()})
          </button>
        ))}
      </div>

      {/* Mobile Column Switcher (Phone Screens) */}
      <div className="md:hidden flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
        <button
          onClick={() => setMobileColumn('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mobileColumn === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setMobileColumn('backlog')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mobileColumn === 'backlog' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Backlog ({backlogTasks.length})
        </button>
        <button
          onClick={() => setMobileColumn('in_progress')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mobileColumn === 'in_progress' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Active ({inProgressTasks.length})
        </button>
        <button
          onClick={() => setMobileColumn('disseminated')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mobileColumn === 'disseminated' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Done ({disseminatedTasks.length})
        </button>
      </div>

      {/* Agile 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Backlog */}
        <div className={`p-4 rounded-3xl liquid-glass space-y-4 border border-slate-800 ${
          mobileColumn === 'all' || mobileColumn === 'backlog' ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                Sprint Backlog ({backlogTasks.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Upcoming</span>
          </div>

          <div className="space-y-3">
            {backlogTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No items in backlog.
              </div>
            ) : (
              backlogTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-white/20 transition-all text-left space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase ${getTypeBadge(task.type)}`}>
                      {task.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Due: {task.dueDate}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug">
                    {task.title}
                  </h4>

                  <div className="text-[10px] text-cyan-300 font-mono">
                    Scope: {task.matricScope}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{task.assignedCourse}</span>
                    <button
                      onClick={() => onUpdateTaskStatus(currentSprint.id, task.id, 'in_progress')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Start Dissemination</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Dissemination */}
        <div className={`p-4 rounded-3xl liquid-glass space-y-4 border border-indigo-500/20 ${
          mobileColumn === 'all' || mobileColumn === 'in_progress' ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                In Dissemination ({inProgressTasks.length})
              </h3>
            </div>
            <span className="text-[10px] text-indigo-400 font-mono">Under Review</span>
          </div>

          <div className="space-y-3">
            {inProgressTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No items currently in active dissemination review.
              </div>
            ) : (
              inProgressTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-left space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase ${getTypeBadge(task.type)}`}>
                      {task.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Due: {task.dueDate}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug">
                    {task.title}
                  </h4>

                  <div className="text-[10px] text-cyan-300 font-mono">
                    Scope: {task.matricScope}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => onUpdateTaskStatus(currentSprint.id, task.id, 'backlog')}
                      className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      &larr; Revert
                    </button>
                    <button
                      onClick={() => onUpdateTaskStatus(currentSprint.id, task.id, 'disseminated')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Disseminate & Release</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Disseminated / Complete */}
        <div className={`p-4 rounded-3xl liquid-glass space-y-4 border border-emerald-500/20 ${
          mobileColumn === 'all' || mobileColumn === 'disseminated' ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                Disseminated ({disseminatedTasks.length})
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Delivered</span>
          </div>

          <div className="space-y-3">
            {disseminatedTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No items completed yet.
              </div>
            ) : (
              disseminatedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 text-left space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border uppercase ${getTypeBadge(task.type)}`}>
                      {task.type}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Released
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug">
                    {task.title}
                  </h4>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Audience: {task.matricScope}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{task.assignedCourse}</span>
                    <span className="text-emerald-400 font-mono">All Handsets Notified</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-slate-100 text-left">
            <h3 className="text-base font-bold text-white mb-1">
              Add Agile Dissemination Story
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Create a syllabus milestone or assignment story for {currentSprint?.courseCode}
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Story Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Publish Lecture 7: Event Bus Protocol Specifications"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Artifact Type
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  >
                    <option value="lecture">Lecture Notes</option>
                    <option value="assignment">Assignment / Rubric</option>
                    <option value="material">Study Material</option>
                    <option value="quiz">Continuous Assessment</option>
                    <option value="notice">Cohort Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Matriculation Target Scope
                </label>
                <input
                  type="text"
                  value={matricScope}
                  onChange={(e) => setMatricScope(e.target.value)}
                  placeholder="e.g. CSC/2021/*"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer"
                >
                  Create Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
