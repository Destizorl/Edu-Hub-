import React, { useState } from 'react';
import { AcademicMaterial, User, Course } from '../types';
import { 
  BookOpen, 
  Search, 
  Download, 
  FileText, 
  Filter, 
  Tag, 
  CheckCircle2, 
  FolderArchive,
  Layers,
  Sparkles,
  ExternalLink,
  Upload
} from 'lucide-react';

interface MaterialsArchiveProps {
  currentUser: User;
  materials: AcademicMaterial[];
  courses: Course[];
  onDownloadMaterial: (materialId: string) => void;
  onOpenUpload?: () => void;
}

export const MaterialsArchive: React.FC<MaterialsArchiveProps> = ({
  currentUser,
  materials,
  courses,
  onDownloadMaterial,
  onOpenUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [viewBookmarksOnly, setViewBookmarksOnly] = useState(false);
  const [downloadSuccessModal, setDownloadSuccessModal] = useState<AcademicMaterial | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<AcademicMaterial | null>(null);
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('novalis_sids_starred_materials');
    return saved ? JSON.parse(saved) : ['mat-01', 'mat-02'];
  });

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem('novalis_sids_starred_materials', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredMaterials = materials.filter((m) => {
    if (viewBookmarksOnly && !starredIds.includes(m.id)) {
      return false;
    }
    if (selectedCourseFilter !== 'all' && m.courseCode !== selectedCourseFilter) {
      return false;
    }
    if (selectedFormat !== 'all' && m.fileType !== selectedFormat) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchCourse = m.courseCode.toLowerCase().includes(q);
      const matchTags = m.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCourse || matchTags;
    }
    return true;
  });

  const handleDownload = (mat: AcademicMaterial) => {
    onDownloadMaterial(mat.id);
    setDownloadSuccessModal(mat);
    setTimeout(() => setDownloadSuccessModal(null), 3500);
  };

  const getFormatBadge = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'slide':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'code':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'doc':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Official Department Repository
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {materials.length} Archived Academic Resources
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FolderArchive className="w-6 h-6 text-blue-400" />
              Lecturer Academic Materials & Past Examination Archive
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Access lecture slides, syllabi, past examination questions (2020-2025), and practical lab guides shared by departmental course lecturers.
            </p>
          </div>

          {currentUser.role === 'lecturer' && onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Share New Material</span>
            </button>
          )}
        </div>

        {downloadSuccessModal && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Downloaded <strong>{downloadSuccessModal.title}</strong> ({downloadSuccessModal.fileSize}). Saved to local study materials.
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-300">200 OK</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl liquid-glass flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, course (CSC 301), exam solutions, or tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Dropdowns & Bookmarks Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setViewBookmarksOnly(!viewBookmarksOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewBookmarksOnly
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <span>★ Starred ({starredIds.length})</span>
          </button>

          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Registered Courses</option>
            {courses.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.title.substring(0, 24)}...
              </option>
            ))}
          </select>

          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All File Formats</option>
            <option value="pdf">PDF Documents</option>
            <option value="slide">Presentation Slides</option>
            <option value="code">Source Code / Lab Guides</option>
            <option value="doc">Word Handouts</option>
          </select>
        </div>

      </div>

      {/* Materials Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Displaying {filteredMaterials.length} of {materials.length} materials {viewBookmarksOnly && '(Starred Only)'}
          </span>
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="p-12 rounded-3xl liquid-glass text-center text-slate-400 text-xs">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p>No materials found matching your search and filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaterials.map((mat) => {
              const isStarred = starredIds.includes(mat.id);

              return (
                <div
                  key={mat.id}
                  className="p-5 rounded-2xl liquid-glass liquid-glass-interactive flex flex-col justify-between text-left relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-mono font-bold text-xs text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        {mat.courseCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => toggleStar(mat.id, e)}
                          title={isStarred ? 'Remove from starred' : 'Bookmark to starred'}
                          className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                            isStarred ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          ★
                        </button>
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${getFormatBadge(mat.fileType)}`}>
                          {mat.fileType} · {mat.fileSize}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
                      {mat.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-4">
                      {mat.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {mat.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setPreviewMaterial(mat)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline flex items-center gap-1"
                    >
                      <span>Read Document</span>
                    </button>

                    <button
                      onClick={() => handleDownload(mat)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer shadow-md shadow-blue-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-App Document Reading Viewer Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl border border-white/15 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  {previewMaterial.courseCode}
                </span>
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {previewMaterial.title}
                </h3>
              </div>

              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
              >
                Close Viewer
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-950/50">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs text-slate-400 font-mono mb-1">
                  Lecturer: {previewMaterial.lecturerName} · Session: {previewMaterial.academicSession} · File Size: {previewMaterial.fileSize}
                </div>
                <div className="text-sm font-semibold text-white">
                  {previewMaterial.description}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-4 font-sans text-xs text-slate-200 leading-relaxed shadow-inner">
                <h4 className="text-sm font-bold text-blue-300">Document Contents Summary & Model Objectives</h4>
                <p>
                  1. <strong>Theoretical Foundations</strong>: Detailed mathematical formulations and algorithmic complexity models analyzed during lectures.
                </p>
                <p>
                  2. <strong>Laboratory & Practical Benchmarks</strong>: Execution guidelines for programming assignments, test cases, and error handling regimes.
                </p>
                <p>
                  3. <strong>Examination Sample Solutions</strong>: Worked questions from 2021-2025 semester exams with point-by-point marking schemes verified by {previewMaterial.lecturerName}.
                </p>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200 font-mono">
                  [Verified Electronic Copy: Novalis SIDS Academic Repository • SHA-256 Verified]
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between bg-white/[0.02] text-xs">
              <span className="text-slate-400 font-mono">Ready for offline studying</span>
              <button
                onClick={() => handleDownload(previewMaterial)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download {previewMaterial.fileType.toUpperCase()} ({previewMaterial.fileSize})</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
