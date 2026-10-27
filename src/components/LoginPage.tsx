import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  X,
  Server,
  Building2,
  Users
} from 'lucide-react';
import { AuthService } from '../services/auth';
import { User } from '../types';
import uniportLogo from '../assets/images/uniport_logo.jpeg';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [campusId, setCampusId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!campusId.trim()) {
      setErrorMessage('Please enter your Campus ID or Institutional Email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.login(campusId, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred while verifying credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (id: string, pass: string = 'password123') => {
    setCampusId(id);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* Subtle Background Glows (White canvas with fresh lemon & deep royal blue accents) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#ccf32f]/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-slate-200/40 blur-3xl" />
      </div>

      {/* Main Login Board Container */}
      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.1)] overflow-hidden">
        
        {/* Left Branding / Value Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Accent Glows */}
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#ccf32f]/20 blur-2xl pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

          {/* Top Brand Block */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img 
                src={uniportLogo} 
                alt="University of Port Harcourt Logo" 
                className="w-12 h-12 rounded-2xl bg-white p-1 object-contain shadow-md border border-lime-300/80" 
              />
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white block">
                  EduStream
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ccf32f] font-bold block -mt-1">
                  University of Port Harcourt
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ccf32f]" />
                <span>Single Sign-On (SSO) Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Academic Management & Communication
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                One secure gateway for Students, Faculty Lecturers, and University Administrators. Automatic role-based access verified by the institutional backend.
              </p>
            </div>
          </div>

          {/* Institutional Highlights */}
          <div className="relative z-10 my-8 space-y-3 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-[#ccf32f]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Course curriculum & assignment submissions</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-[#ccf32f]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Multi-channel SMS & email emergency broadcasts</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-[#ccf32f]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Real-time student-to-lecturer academic messaging</span>
            </div>
          </div>

          {/* Bottom Security Badge */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>TLS 1.3 · 256-Bit SSL</span>
            <span className="text-[#ccf32f] font-semibold">Port 3000 Verified</span>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between bg-white text-left">
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <img 
                    src={uniportLogo} 
                    alt="UNIPORT Logo" 
                    className="w-7 h-7 object-contain rounded-lg border border-slate-200 p-0.5 bg-white shadow-2xs" 
                  />
                  <span className="text-[11px] font-black tracking-wider uppercase text-blue-700 font-mono">
                    UNIPORT Academic Portal
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Sign In to Your Account
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Enter your assigned Campus ID and password to access your dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Account assistance & support"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-start gap-3 animate-in fade-in duration-200 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Campus ID / Institutional Email */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                  Campus ID / Institutional Identifier
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={campusId}
                    onChange={(e) => {
                      setCampusId(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. U2022/5570017, LEC-2026-001, or RO-2026-001"
                    autoComplete="username"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-all shadow-2xs"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded font-bold">
                    ID
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Matriculation number, Staff ID, or Institutional email accepted.
                </span>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your secure password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 text-xs sm:text-sm text-slate-900 outline-none transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button with Loading State */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Credentials & Permissions...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Sign In to EduStream Hub</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Authorized Test Credentials (Evaluator Sandbox)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
              >
                {showDemoDrawer ? 'Hide Details' : 'Show Credentials'}
              </button>
            </div>

            {showDemoDrawer && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-left">
                {/* Student */}
                <div 
                  onClick={() => handleApplyPreset('U2022/5570017')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Student</span>
                    <span className="text-[9px] font-mono text-slate-400">Fill</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1 truncate">Kalango Ebitimi Destiny</div>
                  <div className="text-[10px] font-mono text-slate-600">U2022/5570017</div>
                </div>

                {/* Lecturer */}
                <div 
                  onClick={() => handleApplyPreset('LEC-2026-001')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-lime-400 bg-slate-50 hover:bg-lime-50/50 cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-lime-800">Lecturer</span>
                    <span className="text-[9px] font-mono text-slate-400">Fill</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1 truncate">Dr. Kenneth Okonkwo</div>
                  <div className="text-[10px] font-mono text-slate-600">LEC-2026-001</div>
                </div>

                {/* Result Officer */}
                <div 
                  onClick={() => handleApplyPreset('RO-2026-001')}
                  className="p-2.5 rounded-xl border border-purple-200 hover:border-purple-500 bg-purple-50/60 hover:bg-purple-100/60 cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Result Officer</span>
                    <span className="text-[9px] font-mono text-purple-700 font-bold">New</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1 truncate">Dr. Blessing Amadi</div>
                  <div className="text-[10px] font-mono text-slate-600">RO-2026-001</div>
                </div>

                {/* Admin */}
                <div 
                  onClick={() => handleApplyPreset('ADM-2026-001')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Admin</span>
                    <span className="text-[9px] font-mono text-slate-400">Fill</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1 truncate">Prof. Harrison Clark</div>
                  <div className="text-[10px] font-mono text-slate-600">ADM-2026-001</div>
                </div>
              </div>
            )}

            <div className="mt-2 text-[10px] text-slate-500 text-center sm:text-left flex items-center justify-between">
              <span>Try suspended account: <button type="button" onClick={() => handleApplyPreset('STU-2026-999')} className="font-mono text-rose-700 underline font-bold cursor-pointer">STU-2026-999</button> to test security block</span>
              <span className="hidden sm:inline font-mono">Default Password: password123</span>
            </div>
          </div>

        </div>

      </div>

      {/* Account Help & Recovery Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Campus ID & Password Assistance
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Where do I find my Campus ID?</strong><br />
                Your Campus ID was issued on your official Admission Letter (Students: e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">U2022/5570017</code>) or your Appointment Gazette (Faculty: e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-lime-800">LEC-2026-001</code>).
              </p>
              <p>
                <strong>Password Reset Policy:</strong><br />
                To maintain institutional compliance, self-service password resets require approval from the Directorate of ICT Helpdesk or your Departmental IT Officer.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Support Desks:</div>
                <div>ICT Helpdesk: <span className="font-mono text-blue-700 font-semibold">support@edustream.edu</span></div>
                <div>Registry Helpline: <span className="font-mono text-slate-800">+234 803 000 1122</span></div>
                <div>Senate Building, Level 2, Room 204 (Mon-Fri 8am-4pm)</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
              >
                Close Assistance
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
