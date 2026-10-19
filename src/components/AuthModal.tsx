import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Lock, 
  User as UserIcon, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  X
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: User[];
  onSelectUser: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  allUsers,
  onSelectUser,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'manual'>('quick');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState('CSC/2021/042');
  const [password, setPassword] = useState('••••••••');
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const input = identifier.trim().toLowerCase();
    const matched = allUsers.find(
      (u) =>
        u.email.toLowerCase() === input ||
        u.matricNumber?.toLowerCase() === input ||
        u.staffId?.toLowerCase() === input ||
        u.name.toLowerCase().includes(input)
    );

    if (matched) {
      onSelectUser(matched);
      onClose();
    } else {
      setAuthError('No user found matching this matriculation number, staff ID, or institutional email.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 shadow-2xl p-6 sm:p-8 text-slate-100 text-left">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Lockup */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Novalis SIDS Authentication
            </h2>
            <p className="text-xs text-slate-400">
              Select or sign into your verified institutional account
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 mb-5">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'quick'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1-Click Demo Profiles ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Credential Login
          </button>
        </div>

        {activeTab === 'quick' ? (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {allUsers.map((u) => {
              const isRep = u.isCourseRep;
              const isLec = u.role === 'lecturer';
              const isReg = u.role === 'registrar';

              return (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-blue-500/40 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover border border-white/15"
                    />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isRep && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Course Rep
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {u.role === 'student' ? `${u.matricNumber} · ${u.level}` : (u.staffId || u.role)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {u.department}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Sign In &rarr;
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['student', 'lecturer', 'registrar'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      if (r === 'student') setIdentifier('CSC/2021/042');
                      if (r === 'lecturer') setIdentifier('k.okonkwo@novalis.edu.ng');
                      if (r === 'registrar') setIdentifier('registrar@novalis.edu.ng');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-colors ${
                      selectedRole === r
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {selectedRole === 'student' ? 'Matriculation Number or University Email' : 'Staff ID or University Email'}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={selectedRole === 'student' ? 'CSC/2021/042' : 'STF/CSC/104'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/20"
            >
              Sign In to Portal
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
