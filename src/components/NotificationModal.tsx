import React, { useState } from 'react';
import { NotificationLog, User } from '../types';
import { X, Smartphone, Mail, Bell, CheckCircle2, Clock, Send, ShieldAlert, Sparkles, ArrowLeft } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: NotificationLog[];
  currentUser: User;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  logs,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'sms' | 'email'>('all');
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(logs[0] || null);
  const [mobileView, setMobileView] = useState<'list' | 'preview'>('list');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (activeTab === 'sms') return log.type === 'sms';
    if (activeTab === 'email') return log.type === 'email';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-white/15 bg-slate-900/95 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Dissemination Notification Center
              </h2>
              <p className="text-xs text-slate-400">
                Audited dispatch logs for In-App, SMS text alerts, and university email relays
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channels Tabs */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Notifications ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'sms'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>SMS Gateway ({logs.filter(l => l.type === 'sms').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeTab === 'email'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Relay ({logs.filter(l => l.type === 'email').length})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Target User: {currentUser.name} ({currentUser.role})
          </div>
        </div>

        {/* Content Body: Split View (List on left, Live Simulator on right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[420px]">
          
          {/* Notification List (5 cols) */}
          <div className={`md:col-span-5 border-r border-slate-800 overflow-y-auto p-3 space-y-2 max-h-[500px] ${
            mobileView === 'list' ? 'block' : 'hidden md:block'
          }`}>
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No notifications logged for this channel.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const isSms = log.type === 'sms';

                return (
                  <div
                    key={log.id}
                    onClick={() => {
                      setSelectedLog(log);
                      setMobileView('preview');
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-indigo-500/50 bg-indigo-600/15 shadow-sm'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {isSms ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                            <Smartphone className="w-3 h-3" /> SMS
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-mono text-indigo-400">
                            <Mail className="w-3 h-3" /> Email
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">·</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> Delivered
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white line-clamp-1">
                      {log.subject}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {log.preview}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>To: {log.recipientContact}</span>
                      <span className="md:hidden text-indigo-400 font-semibold">View Preview &rarr;</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Preview Viewport: SMS Phone Simulator or Rich Email Renderer (7 cols) */}
          <div className={`md:col-span-7 p-4 sm:p-6 overflow-y-auto bg-slate-950/60 flex flex-col items-center justify-center ${
            mobileView === 'preview' ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Mobile Back Button to list */}
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden self-start mb-3 flex items-center gap-1.5 text-xs text-indigo-400 font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dispatch Logs</span>
            </button>
            {selectedLog ? (
              selectedLog.type === 'sms' ? (
                /* Smartphone SMS Mockup */
                <div className="w-full max-w-sm rounded-3xl border-2 border-slate-700 bg-slate-900 p-4 shadow-2xl">
                  {/* Phone Top Notch */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[10px] text-slate-400 font-mono">
                    <span>9:41 AM</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">NOVALIS GSM</span>
                    <span>100% 🔋</span>
                  </div>

                  <div className="text-center py-3">
                    <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs mb-1">
                      SMS
                    </div>
                    <div className="text-xs font-bold text-white">NOVALIS-SMS</div>
                    <div className="text-[10px] text-slate-400">Institutional Broadcast Channel</div>
                  </div>

                  {/* SMS Bubble */}
                  <div className="my-3 space-y-2">
                    <div className="max-w-[90%] p-3.5 rounded-2xl rounded-tl-sm bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-xs leading-relaxed shadow-lg">
                      {selectedLog.preview}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono pl-2">
                      Delivered to {selectedLog.recipientContact} · {new Date(selectedLog.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {/* SMS Footer Metadata */}
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Gateway:</span>
                      <span className="text-slate-200">Twilio / Novalis GSM Relay</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Segments:</span>
                      <span className="text-slate-200">1 part (142 / 160 chars)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Status:</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Handset Ack (200 OK)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Rich Institutional Email Preview */
                <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 shadow-2xl p-5 text-left">
                  <div className="border-b border-white/10 pb-4 mb-4">
                    <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1">
                      Academic Email Dispatch
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {selectedLog.subject}
                    </h3>

                    <div className="mt-3 space-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px] w-12">From:</span>
                        <span>Novalis Registry & Course Dissemination &lt;noreply-sids@novalis.edu.ng&gt;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px] w-12">To:</span>
                        <span>{selectedLog.recipientName} &lt;{selectedLog.recipientContact}&gt;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px] w-12">Date:</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {new Date(selectedLog.timestamp).toUTCString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-3 text-xs text-slate-200 leading-relaxed">
                    <p>Dear {selectedLog.recipientName},</p>
                    <p>{selectedLog.preview}</p>
                    <p className="pt-2 text-slate-400 text-[11px]">
                      You can review full academic circulars, course slides, and syllabus deadlines by logging into the Student Information Dissemination System (SIDS).
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>SMTP Relay: Novalis Mail Cluster</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> DKIM Verified & Signed
                    </span>
                  </div>
                </div>
              )
            ) : (
              <div className="text-slate-500 text-xs">Select a notification to view message preview</div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>Real-time SMS and Email broadcast simulation powered by SIDS event bus.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
