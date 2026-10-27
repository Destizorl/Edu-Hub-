import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { User, Course, CourseGradeInput, GradeLetter, SavedCalculation } from '../types';
import { PRESET_CURRICULUM, ALL_LEVELS, SEMESTERS } from '../data/curriculumData';
import { 
  GRADE_POINTS, 
  getDegreeClassification, 
  calculateSemesterMetrics, 
  exportOfficialTranscriptPdf 
} from '../utils/cgpa';
import { 
  Calculator, 
  Download, 
  Save, 
  Award, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  Info,
  Calendar,
  RotateCcw,
  BookOpen,
  Layers,
  ChevronRight,
  TrendingUp,
  GraduationCap,
  Sliders,
  Check,
  X
} from 'lucide-react';

interface CGPACalculatorProps {
  currentUser?: User;
  courses?: Course[];
  savedCalculations?: SavedCalculation[];
  onSaveCalculation?: (calc: SavedCalculation) => void;
  onDeleteCalculation?: (id: string) => void;
}

export const CGPACalculator: React.FC<CGPACalculatorProps> = ({
  currentUser,
  courses: _coursesProp = [],
  savedCalculations: initialSavedCalculations = [],
  onSaveCalculation,
  onDeleteCalculation,
}) => {
  const [localSaved, setLocalSaved] = useState<SavedCalculation[]>(() => {
    try {
      const s = localStorage.getItem('edustream_local_calculations_v1');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const activeSavedCalculations = initialSavedCalculations.length > 0 ? initialSavedCalculations : localSaved;

  const effectiveUser: User = currentUser || {
    id: 'cand-sim-01',
    name: 'Kalango Ebitimi Destiny',
    matricNumber: 'U2022/5570017',
    campusId: 'U2022/5570017',
    role: 'student',
    faculty: 'Faculty of Science',
    department: 'Computer Science',
    level: '400L',
    status: 'active',
    email: 'destinykalango@gmail.com',
    phone: '08123456789',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    coursesTaught: [],
    enrolledCourseCodes: ['CSC 301.1', 'CSC 308.1'],
    createdAt: '2026-01-01',
  };

  // Level & Semester Selection state
  const [selectedLevel, setSelectedLevel] = useState<'100L' | '200L' | '300L' | '400L' | '500L' | 'ALL'>(
    (effectiveUser.level as any) || '400L'
  );
  const [activeSemester, setActiveSemester] = useState<1 | 2 | 'both'>(1);
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [calculatorMode, setCalculatorMode] = useState<'calculator' | 'projection'>('calculator');
  const [targetCgpa, setTargetCgpa] = useState<number>(4.50); // Target: First Class
  const [remainingUnits, setRemainingUnits] = useState<number>(34); // Units remaining till graduation
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseUnits, setNewCourseUnits] = useState<number>(3);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  // Storage key for all grades across all levels & semesters
  const STORAGE_KEY = 'edustream_cgpa_master_grades_v4';

  // Master State storing course grades indexed by `${level}-${semester}`
  const [masterGrades, setMasterGrades] = useState<Record<string, CourseGradeInput[]>>(() => {
    // Default initialization from PRESET_CURRICULUM
    const initial: Record<string, CourseGradeInput[]> = {};
    Object.entries(PRESET_CURRICULUM).forEach(([key, courseList]) => {
      const [lvl, semStr] = key.split('-');
      const semNum = Number(semStr) as 1 | 2;
      initial[key] = courseList.map((c) => ({
        courseCode: c.code,
        courseTitle: c.title,
        creditUnits: c.creditUnits,
        grade: '' as GradeLetter,
        semester: semNum,
        academicYear: '2026/2027',
        level: lvl,
      }));
    });

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all curriculum keys and course levels exist and are clean
        Object.entries(initial).forEach(([key, defaultList]) => {
          const [lvl, semStr] = key.split('-');
          const semNum = Number(semStr) as 1 | 2;
          if (!parsed[key] || !Array.isArray(parsed[key])) {
            parsed[key] = defaultList;
          } else {
            parsed[key] = parsed[key].map((c: any) => ({
              ...c,
              level: lvl,
              semester: c.semester || semNum,
            }));
          }
        });
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved grades', e);
      }
    }

    // Provide realistic sample grades for 100L, 200L, and 300L for instant demo preview using the authentic university curriculum
    if (initial['100L-1']) {
      // 100L First Semester: GST 111.1 (A), MTH 101.1 (A), MTH 102.1 (B), PHY 101.1 (A), PHY 107.1 (A), COS 101.1 (A)
      const grades100_1: GradeLetter[] = ['A', 'A', 'B', 'A', 'A', 'A'];
      initial['100L-1'].forEach((c, idx) => {
        c.grade = grades100_1[idx] || 'A';
      });
    }
    if (initial['100L-2']) {
      // 100L Second Semester: GST 112.2 (A), PHY 102.2 (B), PHY 108.2 (A), COS 102.2 (A), STA 111.2 (B)
      const grades100_2: GradeLetter[] = ['A', 'B', 'A', 'A', 'B'];
      initial['100L-2'].forEach((c, idx) => {
        c.grade = grades100_2[idx] || 'A';
      });
    }
    if (initial['200L-1']) {
      // 200L First Semester: GST 212.1 (A), COS 201.1 (A), CSC 203.1 (A), IFT 211.1 (B), UPH-CSC 270.1 (A), MTH 201.1 (A), UPH-CSC 281.1 (B), UPH-CSC 238.1 (A), UPH-CSC 286.1 (A)
      const grades200_1: GradeLetter[] = ['A', 'A', 'A', 'B', 'A', 'A', 'B', 'A', 'A'];
      initial['200L-1'].forEach((c, idx) => {
        c.grade = grades200_1[idx] || 'A';
      });
    }
    if (initial['200L-2']) {
      // 200L Second Semester: ENT 211.2 (A), COS 202.2 (A), MTH 202.2 (B), IFT 212.2 (A), SEN 201.2 (A), DTS 204.2 (A), UPH-CSC 288.2 (A), UPH-CSC 298.2 (A), UPH-CSC 273.2 (B)
      const grades200_2: GradeLetter[] = ['A', 'A', 'B', 'A', 'A', 'A', 'A', 'A', 'B'];
      initial['200L-2'].forEach((c, idx) => {
        c.grade = grades200_2[idx] || 'A';
      });
    }
    if (initial['300L-1']) {
      // 300L First Semester: GST 312.1 (A), IFT 302.1 (A), CSC 301.1 (A), IFT 310.1 (B), CSC 322.1 (A), CSC 308.1 (A), CSC 309.1 (A), ENT 312.1 (A), ICT 305.1 (B), UPH-CSC 362.1 (A)
      const grades300_1: GradeLetter[] = ['A', 'A', 'A', 'B', 'A', 'A', 'A', 'A', 'B', 'A'];
      initial['300L-1'].forEach((c, idx) => {
        c.grade = grades300_1[idx] || 'A';
      });
    }

    return initial;
  });

  // Recent Grade Feedback indicator state
  const [recentGradeFeedback, setRecentGradeFeedback] = useState<{
    courseCode: string;
    grade: GradeLetter;
    points: number;
    qp: number;
  } | null>(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(masterGrades));
  }, [masterGrades]);

  // Handle grade change for a course in a specific level and semester
  const handleGradeChange = (level: string, sem: 1 | 2, code: string, newGrade: GradeLetter) => {
    let resolvedLevel = level;
    if (!resolvedLevel || resolvedLevel.includes('Semester') || resolvedLevel.startsWith('1st') || resolvedLevel.startsWith('2nd')) {
      resolvedLevel = selectedLevel === 'ALL' ? '300L' : selectedLevel;
    }
    const key = `${resolvedLevel}-${sem}`;

    let courseUnits = 3;
    setMasterGrades((prev) => {
      const list = prev[key] || [];
      const updatedList = list.map((c) => {
        if (c.courseCode === code) {
          courseUnits = c.creditUnits;
          return { ...c, grade: newGrade, level: resolvedLevel, semester: sem };
        }
        return c;
      });
      return {
        ...prev,
        [key]: updatedList,
      };
    });

    if (newGrade) {
      const pt = GRADE_POINTS[newGrade];
      setRecentGradeFeedback({
        courseCode: code,
        grade: newGrade,
        points: pt,
        qp: pt * courseUnits,
      });
      setTimeout(() => {
        setRecentGradeFeedback(null);
      }, 2500);
    }
  };

  // Add custom elective course to current level and semester
  const handleAddCustomCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseTitle.trim()) return;
    const targetLevel = selectedLevel === 'ALL' ? '300L' : selectedLevel;
    const targetSem = activeSemester === 'both' ? 1 : activeSemester;
    const key = `${targetLevel}-${targetSem}`;

    const newCourse: CourseGradeInput = {
      courseCode: newCourseCode.trim().toUpperCase(),
      courseTitle: newCourseTitle.trim(),
      creditUnits: Math.max(1, Number(newCourseUnits)),
      grade: '' as GradeLetter,
      semester: targetSem,
      academicYear,
      level: targetLevel,
    };

    setMasterGrades((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newCourse],
    }));

    setNewCourseCode('');
    setNewCourseTitle('');
    setNewCourseUnits(3);
    setShowAddCourseModal(false);
  };

  // Delete course
  const handleDeleteCourse = (level: string, sem: 1 | 2, code: string) => {
    let resolvedLevel = level;
    if (!resolvedLevel || resolvedLevel.includes('Semester') || resolvedLevel.startsWith('1st') || resolvedLevel.startsWith('2nd')) {
      resolvedLevel = selectedLevel === 'ALL' ? '300L' : selectedLevel;
    }
    const key = `${resolvedLevel}-${sem}`;
    setMasterGrades((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((c) => c.courseCode !== code),
    }));
  };

  // Reset grades for current view
  const handleResetCurrentGrades = () => {
    if (selectedLevel === 'ALL') {
      if (confirm('Reset all grades across all levels?')) {
        setMasterGrades((prev) => {
          const resetObj: Record<string, CourseGradeInput[]> = {};
          Object.entries(prev).forEach(([key, list]) => {
            resetObj[key] = list.map((c) => ({ ...c, grade: '' as GradeLetter }));
          });
          return resetObj;
        });
      }
      return;
    }

    const keysToReset: string[] = [];
    if (activeSemester === 'both') {
      keysToReset.push(`${selectedLevel}-1`, `${selectedLevel}-2`);
    } else {
      keysToReset.push(`${selectedLevel}-${activeSemester}`);
    }

    setMasterGrades((prev) => {
      const next = { ...prev };
      keysToReset.forEach((k) => {
        if (next[k]) {
          next[k] = next[k].map((c) => ({ ...c, grade: '' as GradeLetter }));
        }
      });
      return next;
    });
  };

  // Batch grade setter for current view (e.g. Set all to A, Set all to B)
  const handleBatchSetGrades = (targetGrade: GradeLetter) => {
    setMasterGrades((prev) => {
      const next = { ...prev };
      currentViewCourses.forEach((c) => {
        const lvl = c.level || (selectedLevel === 'ALL' ? '300L' : selectedLevel);
        const key = `${lvl}-${c.semester}`;
        if (next[key]) {
          next[key] = next[key].map((item) =>
            item.courseCode === c.courseCode ? { ...item, grade: targetGrade, level: lvl, semester: c.semester } : item
          );
        }
      });
      return next;
    });

    if (targetGrade) {
      setRecentGradeFeedback({
        courseCode: 'ALL CURRENT COURSES',
        grade: targetGrade,
        points: GRADE_POINTS[targetGrade],
        qp: currentViewMetrics.totalUnits * GRADE_POINTS[targetGrade],
      });
      setTimeout(() => setRecentGradeFeedback(null), 2500);
    }
  };

  // Courses to display in the current active view
  const currentViewCourses = useMemo<(CourseGradeInput & { levelTag: string; level: string })[]>(() => {
    if (selectedLevel === 'ALL') {
      // Gather all courses across all levels & semesters
      const all: (CourseGradeInput & { levelTag: string; level: string })[] = [];
      ['100L', '200L', '300L', '400L', '500L'].forEach((lvl) => {
        const s1 = masterGrades[`${lvl}-1`] || [];
        const s2 = masterGrades[`${lvl}-2`] || [];
        if (activeSemester === 1) {
          s1.forEach((c) => all.push({ ...c, level: lvl, levelTag: `${lvl} Sem 1` }));
        } else if (activeSemester === 2) {
          s2.forEach((c) => all.push({ ...c, level: lvl, levelTag: `${lvl} Sem 2` }));
        } else {
          s1.forEach((c) => all.push({ ...c, level: lvl, levelTag: `${lvl} Sem 1` }));
          s2.forEach((c) => all.push({ ...c, level: lvl, levelTag: `${lvl} Sem 2` }));
        }
      });
      return all;
    }

    // Specific level
    if (activeSemester === 'both') {
      const s1 = masterGrades[`${selectedLevel}-1`] || [];
      const s2 = masterGrades[`${selectedLevel}-2`] || [];
      return [
        ...s1.map((c) => ({ ...c, level: selectedLevel, levelTag: '1st Semester' })),
        ...s2.map((c) => ({ ...c, level: selectedLevel, levelTag: '2nd Semester' })),
      ];
    } else {
      const list = masterGrades[`${selectedLevel}-${activeSemester}`] || [];
      return list.map((c) => ({ ...c, level: selectedLevel, levelTag: activeSemester === 1 ? '1st Semester' : '2nd Semester' }));
    }
  }, [masterGrades, selectedLevel, activeSemester]);

  // Current view metrics (GPA for current selection)
  const currentViewMetrics = useMemo(() => {
    return calculateSemesterMetrics(currentViewCourses);
  }, [currentViewCourses]);

  // Cumulative Metrics Across the Student's ENTIRE Degree (All graded courses in system)
  const allGradedMetrics = useMemo(() => {
    const allCourses: CourseGradeInput[] = [];
    Object.values(masterGrades).forEach((list) => {
      allCourses.push(...list);
    });
    return calculateSemesterMetrics(allCourses);
  }, [masterGrades]);

  // Degree Classification
  const degreeClassification = getDegreeClassification(allGradedMetrics.gpa);

  // Per-level breakdown metrics for Level Matrix Card
  const levelBreakdown = useMemo(() => {
    return ['100L', '200L', '300L', '400L', '500L'].map((lvl) => {
      const s1 = masterGrades[`${lvl}-1`] || [];
      const s2 = masterGrades[`${lvl}-2`] || [];
      const combined = [...s1, ...s2];
      const metrics = calculateSemesterMetrics(combined);
      return {
        level: lvl,
        totalUnits: metrics.totalUnits,
        gradedUnits: metrics.gradedUnits,
        qualityPoints: metrics.totalQualityPoints,
        gpa: metrics.gpa,
        coursesCount: combined.length,
      };
    });
  }, [masterGrades]);

  // Celebration confetti when First Class is achieved
  const triggerCelebration = () => {
    if (allGradedMetrics.gpa >= 4.5) {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ccf32f', '#a3e635', '#10b981', '#0f172a'],
      });
    }
  };

  // Save calculation
  const handleSave = () => {
    const newCalc: SavedCalculation = {
      id: `calc-${Date.now()}`,
      studentId: effectiveUser.id,
      studentMatric: effectiveUser.matricNumber || 'U2026/5570001',
      studentName: effectiveUser.name,
      academicYear,
      semester: activeSemester === 'both' ? 'cumulative' : activeSemester,
      gpa: currentViewMetrics.gpa,
      cgpa: allGradedMetrics.gpa,
      totalUnits: currentViewMetrics.totalUnits,
      totalQualityPoints: currentViewMetrics.totalQualityPoints,
      classification: degreeClassification.text,
      calculatedAt: new Date().toISOString(),
      courses: currentViewCourses,
    };

    if (onSaveCalculation) {
      onSaveCalculation(newCalc);
    } else {
      setLocalSaved((prev) => {
        const next = [newCalc, ...prev];
        localStorage.setItem('edustream_local_calculations_v1', JSON.stringify(next));
        return next;
      });
    }

    setSaveSuccess(true);
    triggerCelebration();
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Download PDF transcript
  const handleDownloadPdf = (calcToExport?: SavedCalculation) => {
    exportOfficialTranscriptPdf(
      effectiveUser,
      calcToExport || null,
      currentViewCourses,
      currentViewMetrics.gpa,
      allGradedMetrics.gpa
    );
  };

  // Target CGPA Projection math
  const requiredGpaForTarget = useMemo(() => {
    const currentQp = allGradedMetrics.totalQualityPoints;
    const currentUnits = allGradedMetrics.gradedUnits;
    const targetTotalUnits = currentUnits + remainingUnits;

    if (targetTotalUnits === 0 || remainingUnits <= 0) return 0;
    const neededTotalQp = targetCgpa * targetTotalUnits;
    const deficitQp = neededTotalQp - currentQp;
    const reqGpa = deficitQp / remainingUnits;

    return Number(reqGpa.toFixed(2));
  }, [allGradedMetrics, targetCgpa, remainingUnits]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Executive Academic Header Banner with Light & Lemon Senior Aesthetic */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-8 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.05)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-lime-200/35 via-lime-100/10 to-transparent pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-[#ccf32f] text-slate-950 font-bold border border-lime-400 shadow-2xs">
                Official Senate 5.00 Scale
              </span>
              <span className="text-xs text-slate-500 font-mono font-medium">
                A = 5.0 · B = 4.0 · C = 3.0 · D = 2.0 · E = 1.0 · F = 0.0
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-lime-100 text-slate-950 border border-lime-300">
                <Calculator className="w-6 h-6" />
              </div>
              Automated CGPA & Multi-Level Academic Engine
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Preset university curriculum with official course codes and locked credit points for 100L through 500L. Choose your level and semester below to calculate your semester GPA or cumulative degree standing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => handleDownloadPdf()}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-700" />
              <span>Official PDF Transcript</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ccf32f] hover:bg-[#bfe628] text-slate-950 text-xs font-bold border border-lime-400 shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Record</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3.5 rounded-2xl bg-lime-50 border border-lime-300 text-slate-900 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-lime-700" />
              <span className="font-medium">Academic calculation successfully saved to history! Official transcript is ready for download.</span>
            </div>
            <span className="font-mono text-[10px] font-bold text-lime-800 uppercase px-2 py-0.5 rounded bg-lime-200">SAVED</span>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCalculatorMode('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              calculatorMode === 'calculator'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            Curriculum Grade Calculator
          </button>
          <button
            onClick={() => setCalculatorMode('projection')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              calculatorMode === 'projection'
                ? 'bg-[#ccf32f] text-slate-950 border border-lime-400 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-800" />
            <span>Target CGPA & Honours Forecaster</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS: Real-Time Academic Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Cumulative CGPA Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-500 font-semibold uppercase tracking-wider mb-1">
            Overall Degree CGPA
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-mono tracking-tight">
              {allGradedMetrics.gpa.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 5.00</span>
          </div>
          <div className="mt-2.5 inline-flex items-center">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${degreeClassification.badge}`}>
              {degreeClassification.text}
            </span>
          </div>
        </div>

        {/* Selected View GPA Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500 font-semibold uppercase tracking-wider mb-1">
            Selected View GPA
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-mono tracking-tight">
              {currentViewMetrics.gpa.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 5.00</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-600 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-lime-700" />
            <span>{currentViewMetrics.gradedUnits} of {currentViewMetrics.totalUnits} Units Graded</span>
          </div>
        </div>

        {/* Total Quality Points */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500 font-semibold uppercase tracking-wider mb-1">
            Total Quality Points (TQP)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-mono tracking-tight">
              {allGradedMetrics.totalQualityPoints}
            </span>
            <span className="text-xs text-slate-500 font-mono">points</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-600 font-medium">
            Cumulative across all registered levels
          </div>
        </div>

        {/* Total Units Passed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-mono text-slate-500 font-semibold uppercase tracking-wider mb-1">
            Earned Credit Units (TCE)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-mono tracking-tight">
              {allGradedMetrics.totalPassedUnits}
            </span>
            <span className="text-xs text-slate-500 font-mono">credits</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-600 font-medium">
            Official degree graduation requirement
          </div>
        </div>
      </div>

      {calculatorMode === 'projection' ? (
        /* TARGET CGPA PROJECTION & WHAT-IF SIMULATOR */
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-lime-100 text-lime-900 border border-lime-300 font-bold">
              What-If Degree Forecaster
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Predict Minimum Required Performance
            </span>
          </div>
          
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Target CGPA & Graduation Honours Scenario Forecaster
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-600">
            Simulate your target honours classification upon graduation. Enter your target CGPA and outstanding credit units to instantly discover the minimum semester GPA you need to graduate with your desired honours.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Target Input Slider */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-800">Target Cumulative CGPA</label>
                  <span className="font-mono text-base font-extrabold text-slate-950 px-2.5 py-0.5 rounded-md bg-[#ccf32f] border border-lime-400">
                    {targetCgpa.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="5.0"
                  step="0.05"
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(parseFloat(e.target.value))}
                  className="w-full accent-lime-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>2.40 (2:2)</span>
                  <span>3.50 (2:1)</span>
                  <span className="font-bold text-slate-800">4.50 (First Class)</span>
                  <span>5.00</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-800">Remaining Credit Units Till Graduation</label>
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {remainingUnits} Units
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="80"
                  step="1"
                  value={remainingUnits}
                  onChange={(e) => setRemainingUnits(parseInt(e.target.value))}
                  className="w-full accent-lime-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>12 Units (1 Sem)</span>
                  <span>34 Units (Final Year)</span>
                  <span>70+ Units</span>
                </div>
              </div>

              {/* Honours Target Quick Buttons */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-500 mb-2">Preset Honours Targets:</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTargetCgpa(4.50)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-lime-400 text-slate-800 text-[11px] font-bold text-center transition-all cursor-pointer shadow-2xs"
                  >
                    First Class (4.50)
                  </button>
                  <button
                    onClick={() => setTargetCgpa(3.50)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-lime-400 text-slate-800 text-[11px] font-bold text-center transition-all cursor-pointer shadow-2xs"
                  >
                    Second Class Upper (3.50)
                  </button>
                  <button
                    onClick={() => setTargetCgpa(3.00)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-lime-400 text-slate-800 text-[11px] font-bold text-center transition-all cursor-pointer shadow-2xs"
                  >
                    Solid Standing (3.00)
                  </button>
                </div>
              </div>
            </div>

            {/* Target Result Diagnostic Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-lime-50/70 via-white to-slate-50 border border-lime-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Scenario Recommendation
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight">
                  {requiredGpaForTarget > 5.0 ? '> 5.00' : requiredGpaForTarget <= 0 ? 'Achieved!' : requiredGpaForTarget.toFixed(2)}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Minimum Average GPA required in every upcoming semester
                </div>

                <div className="mt-4 p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-2xs">
                  {requiredGpaForTarget > 5.0 ? (
                    <span className="text-rose-700 font-semibold">
                      ⚠️ Mathematically unreachable even with straight A's (5.00) in all remaining {remainingUnits} units. Consider adjusting your target to {allGradedMetrics.gpa >= 3.0 ? 'Second Class Upper (3.50)' : 'Second Class Lower (2.40)'}.
                    </span>
                  ) : requiredGpaForTarget <= 0 ? (
                    <span className="text-emerald-700 font-bold">
                      🎉 Outstanding! Your current cumulative CGPA of {allGradedMetrics.gpa.toFixed(2)} already exceeds your target of {targetCgpa.toFixed(2)}. Maintain your current momentum!
                    </span>
                  ) : (
                    <span>
                      🎯 To graduate with <strong className="text-slate-950 font-bold">{getDegreeClassification(targetCgpa).text} ({targetCgpa.toFixed(2)})</strong>, you need to average at least <strong className="font-mono text-slate-950 font-bold">{requiredGpaForTarget.toFixed(2)} GPA</strong> across your remaining <strong className="font-mono font-bold text-slate-950">{remainingUnits} units</strong>. That corresponds to approximately {requiredGpaForTarget >= 4.5 ? 'mostly A grades' : requiredGpaForTarget >= 4.0 ? 'a mix of A and B grades' : 'B and C grades'}.
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 mt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Current Units: {allGradedMetrics.gradedUnits}</span>
                <span>Target Units: {allGradedMetrics.gradedUnits + remainingUnits}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* LEVEL BY LEVEL DEGREE MATRIX CARDS */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-lime-700" />
              <span>Undergraduate Degree Progress Matrix (100L – 500L)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Click any level card to immediately inspect or compute that academic year's courses.
            </p>
          </div>
          
          <button
            onClick={() => setSelectedLevel('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedLevel === 'ALL'
                ? 'bg-[#ccf32f] text-slate-950 border border-lime-400 shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            View All Levels Full Transcript
          </button>
        </div>

        {/* Level Performance Mini Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {levelBreakdown.map((lb) => {
            const isSelected = selectedLevel === lb.level;
            const hasGrades = lb.gradedUnits > 0;
            return (
              <button
                key={lb.level}
                onClick={() => setSelectedLevel(lb.level as any)}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#ccf32f]/20 border-lime-400 shadow-xs ring-2 ring-lime-400/40'
                    : 'bg-slate-50/70 hover:bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-slate-900">{lb.level}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-lime-600 animate-pulse" />
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-black font-mono text-slate-900">
                    {hasGrades ? lb.gpa.toFixed(2) : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">GPA</span>
                </div>

                <div className="mt-1 text-[10px] text-slate-500">
                  {lb.gradedUnits} / {lb.totalUnits} Units · {lb.coursesCount} Courses
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN COURSE TABLE / CARD VIEW WITH LEVEL & SEMESTER CONTROLS */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-4 sm:p-7 space-y-6 shadow-2xs">
        
        {/* Level & Semester Switcher Header */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          
          {/* Level Selector Pills */}
          <div className="space-y-1.5 w-full xl:w-auto">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              1. Choose Academic Level:
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ALL_LEVELS.map((lvl) => {
                const isActive = selectedLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => setSelectedLevel(lvl.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ccf32f] text-slate-950 border border-lime-400 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
                    }`}
                  >
                    {lvl.shortLabel}
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedLevel('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedLevel === 'ALL'
                    ? 'bg-[#ccf32f] text-slate-950 border border-lime-400 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
                }`}
              >
                All Levels
              </button>
            </div>
          </div>

          {/* Semester Selector Pills */}
          <div className="space-y-1.5 w-full xl:w-auto">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              2. Choose Semester:
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveSemester(1)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSemester === 1
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                1st Semester (Harmattan)
              </button>
              <button
                onClick={() => setActiveSemester(2)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSemester === 2
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                2nd Semester (Rain)
              </button>
              <button
                onClick={() => setActiveSemester('both')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSemester === 'both'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                Full Session (Both)
              </button>
            </div>
          </div>

          {/* Action buttons: Quick Fill, Add Elective & Reset */}
          <div className="flex flex-wrap items-center gap-2 pt-2 xl:pt-0 w-full xl:w-auto justify-end">
            <button
              onClick={() => handleBatchSetGrades('A')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-lime-50 hover:bg-lime-100 text-slate-900 border border-lime-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Set all current courses to Grade A (5.0)"
            >
              <span>⚡ Quick All A (5.0)</span>
            </button>
            <button
              onClick={() => handleBatchSetGrades('B')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Set all current courses to Grade B (4.0)"
            >
              <span>⚡ Quick All B (4.0)</span>
            </button>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-lime-400 text-slate-700 hover:text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Elective</span>
            </button>
            <button
              onClick={handleResetCurrentGrades}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all cursor-pointer"
              title="Reset grades for this view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

        </div>

        {/* Dynamic Micro-Feedback Banner on Grade Tap */}
        {recentGradeFeedback && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-lime-50/90 border border-lime-300 text-slate-900 text-xs animate-in slide-in-from-top-2 duration-150 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#ccf32f] text-slate-950 font-black font-mono flex items-center justify-center border border-lime-500 shrink-0 text-xs shadow-2xs">
                {recentGradeFeedback.grade}
              </div>
              <div>
                <span className="font-bold text-slate-950">{recentGradeFeedback.courseCode}</span> set to Grade <strong className="font-black">{recentGradeFeedback.grade}</strong> ({recentGradeFeedback.points}.0 GP)
                <span className="text-slate-600 font-mono text-[11px] ml-2">· +{recentGradeFeedback.qp} Quality Points added to calculations</span>
              </div>
            </div>
            <span className="font-mono text-[10px] font-extrabold text-lime-900 bg-lime-200/90 px-2.5 py-1 rounded-lg">INSTANTLY CALCULATED</span>
          </div>
        )}

        {/* View Details Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">
              {selectedLevel === 'ALL' ? 'All Undergraduate Levels' : `${selectedLevel} Curriculum`}
            </span>
            <span className="text-slate-400">·</span>
            <span>
              {activeSemester === 1 ? '1st Semester' : activeSemester === 2 ? '2nd Semester' : 'Full Session (Both Semesters)'}
            </span>
          </div>
          <div className="font-mono text-slate-700 font-semibold text-[11px] flex items-center gap-3">
            <span>{currentViewCourses.length} Preset Courses</span>
            <span>·</span>
            <span>{currentViewMetrics.totalUnits} Total Credit Units</span>
            <span>·</span>
            <span className="text-lime-800 font-bold">GPA: {currentViewMetrics.gpa.toFixed(2)}</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RESPONSIVE MOBILE VIEW: Thumb-friendly cards for phone screens */}
        {/* ============================================================== */}
        <div className="block md:hidden space-y-3">
          {currentViewCourses.map((c) => {
            const pt = c.grade ? GRADE_POINTS[c.grade as Exclude<GradeLetter, ''>] : 0;
            const qp = pt * c.creditUnits;
            const courseLevel = c.level || (selectedLevel === 'ALL' ? '300L' : selectedLevel);
            const courseSem = c.semester;

            return (
              <div 
                key={`${c.courseCode}-${c.semester}`}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  c.grade 
                    ? 'bg-white border-lime-300/80 shadow-xs' 
                    : 'bg-white border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-950">
                        {c.courseCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#ccf32f] text-slate-950 border border-lime-400">
                        {c.creditUnits} {c.creditUnits === 1 ? 'Unit' : 'Units'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 mt-1 font-medium leading-snug">
                      {c.courseTitle}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 shrink-0 px-2 py-0.5 rounded bg-slate-100">
                    {c.levelTag}
                  </span>
                </div>

                {/* Grade Selection Buttons A-F */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5 flex justify-between items-center">
                    <span>Tap Grade to Calculate:</span>
                    {c.grade ? (
                      <span className="font-bold text-slate-900 bg-lime-100 border border-lime-300 px-2 py-0.5 rounded text-[10px]">
                        {pt}.0 GP · {qp} Quality Points
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">No grade set</span>
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(['A', 'B', 'C', 'D', 'E', 'F'] as Exclude<GradeLetter, ''>[]).map((g) => {
                      const isSelected = c.grade === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleGradeChange(courseLevel, courseSem, c.courseCode, isSelected ? '' : g)}
                          className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                            isSelected
                              ? g === 'A'
                                ? 'bg-[#ccf32f] text-slate-950 border border-lime-500 shadow-2xs scale-105 font-black ring-2 ring-lime-400/60'
                                : g === 'B'
                                ? 'bg-emerald-500 text-white border border-emerald-600 shadow-2xs scale-105 font-black ring-2 ring-emerald-400/60'
                                : g === 'C'
                                ? 'bg-sky-500 text-white border border-sky-600 shadow-2xs scale-105 font-black ring-2 ring-sky-400/60'
                                : g === 'D'
                                ? 'bg-amber-500 text-white border border-amber-600 shadow-2xs scale-105 font-black ring-2 ring-amber-400/60'
                                : g === 'E'
                                ? 'bg-orange-500 text-white border border-orange-600 shadow-2xs scale-105 font-black ring-2 ring-orange-400/60'
                                : 'bg-rose-500 text-white border border-rose-600 shadow-2xs scale-105 font-black ring-2 ring-rose-400/60'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{g}</span>
                          <span className="text-[9px] font-mono opacity-80">{GRADE_POINTS[g]}.0</span>
                        </button>
                      );
                    })}
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={() => handleGradeChange(courseLevel, courseSem, c.courseCode, '')}
                      className="py-2 text-[10px] font-medium text-slate-400 hover:text-rose-600 rounded-xl bg-slate-50 hover:bg-rose-50 flex flex-col items-center justify-center transition-colors"
                      title="Clear grade"
                    >
                      <X className="w-3.5 h-3.5 mb-0.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* DESKTOP VIEW: High-Precision Senior Staff Academic Table      */}
        {/* ============================================================== */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-semibold pl-2">Course Code</th>
                <th className="pb-3 font-semibold">Course Title</th>
                <th className="pb-3 font-semibold">Level / Term</th>
                <th className="pb-3 font-semibold text-center">Credit Units</th>
                <th className="pb-3 font-semibold text-center">Tap Grade to Select</th>
                <th className="pb-3 font-semibold text-center">Grade Point</th>
                <th className="pb-3 font-semibold text-center">Quality Points (QP)</th>
                <th className="pb-3 font-semibold text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentViewCourses.map((c) => {
                const pt = c.grade ? GRADE_POINTS[c.grade as Exclude<GradeLetter, ''>] : 0;
                const qp = pt * c.creditUnits;
                const courseLevel = c.level || (selectedLevel === 'ALL' ? '300L' : selectedLevel);
                const courseSem = c.semester;

                return (
                  <tr 
                    key={`${c.courseCode}-${c.semester}`}
                    className={`transition-colors group ${
                      c.grade ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 pl-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {c.courseCode}
                    </td>
                    <td className="py-3 text-slate-800 font-medium max-w-xs">
                      {c.courseTitle}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {c.levelTag}
                    </td>
                    <td className="py-3 text-center font-mono">
                      <span className="px-2.5 py-0.5 rounded-md bg-lime-100 text-lime-950 font-bold border border-lime-300">
                        {c.creditUnits}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
                        {(['A', 'B', 'C', 'D', 'E', 'F'] as Exclude<GradeLetter, ''>[]).map((g) => {
                          const isSelected = c.grade === g;
                          const points = GRADE_POINTS[g];
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => handleGradeChange(courseLevel, courseSem, c.courseCode, isSelected ? '' : g)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                                isSelected
                                  ? g === 'A'
                                    ? 'bg-[#ccf32f] text-slate-950 font-black shadow-xs ring-2 ring-lime-400/80 scale-105'
                                    : g === 'B'
                                    ? 'bg-emerald-500 text-white font-black shadow-xs ring-2 ring-emerald-400/80 scale-105'
                                    : g === 'C'
                                    ? 'bg-sky-500 text-white font-black shadow-xs ring-2 ring-sky-400/80 scale-105'
                                    : g === 'D'
                                    ? 'bg-amber-500 text-white font-black shadow-xs ring-2 ring-amber-400/80 scale-105'
                                    : g === 'E'
                                    ? 'bg-orange-500 text-white font-black shadow-xs ring-2 ring-orange-400/80 scale-105'
                                    : 'bg-rose-500 text-white font-black shadow-xs ring-2 ring-rose-400/80 scale-105'
                                  : 'bg-white hover:bg-slate-200 text-slate-700 hover:text-slate-950 shadow-2xs'
                              }`}
                              title={`Tap to select Grade ${g} (${points}.0 Grade Points)`}
                            >
                              {g}
                            </button>
                          );
                        })}
                        {c.grade && (
                          <button
                            type="button"
                            onClick={() => handleGradeChange(courseLevel, courseSem, c.courseCode, '')}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100/70 transition-colors ml-0.5"
                            title="Clear grade"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono">
                      {c.grade ? (
                        <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-900 border border-slate-200">
                          {pt}.0 GP
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-center font-mono">
                      {c.grade ? (
                        <span className="px-2.5 py-0.5 rounded-md font-extrabold text-xs bg-lime-100 text-lime-950 border border-lime-300">
                          {qp} QP
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => handleDeleteCourse(courseLevel, courseSem, c.courseCode)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove course from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Metrics Summary */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-mono">
            Calculation Formula: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">GPA = Σ(Credit Units × Grade Point) / Σ(Graded Units)</code>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-bold text-slate-800 font-mono">
              View GPA: <span className="text-slate-950 font-black text-sm px-2 py-0.5 rounded bg-lime-100 border border-lime-300">{currentViewMetrics.gpa.toFixed(2)}</span>
            </div>
            <div className="text-xs font-bold text-slate-800 font-mono">
              Cumulative CGPA: <span className="text-slate-950 font-black text-sm px-2 py-0.5 rounded bg-[#ccf32f] border border-lime-400">{allGradedMetrics.gpa.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* SAVED TRANSCRIPT CALCULATIONS & HISTORY */}
      {activeSavedCalculations.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-lime-700" />
              <span>Saved Academic Result Computations</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">
              {activeSavedCalculations.length} records saved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSavedCalculations.map((sc) => (
              <div 
                key={sc.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{sc.academicYear} Session</div>
                    <div className="text-[11px] text-slate-500">
                      {sc.semester === 'cumulative' ? 'Full Session / Cumulative' : `Semester ${sc.semester}`}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onDeleteCalculation) {
                        onDeleteCalculation(sc.id);
                      } else {
                        setLocalSaved((prev) => {
                          const next = prev.filter((c) => c.id !== sc.id);
                          localStorage.setItem('edustream_local_calculations_v1', JSON.stringify(next));
                          return next;
                        });
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">Semester GPA</div>
                    <div className="text-lg font-black font-mono text-slate-900">{sc.gpa.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-mono">Cumulative CGPA</div>
                    <div className="text-lg font-black font-mono text-lime-800">{sc.cgpa.toFixed(2)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(sc.calculatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDownloadPdf(sc)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-900 hover:text-lime-700 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD CUSTOM COURSE / ELECTIVE MODAL */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-lime-700" />
                <span>Add Elective or Special Course</span>
              </h3>
              <button 
                onClick={() => setShowAddCourseModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomCourse} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. CSC 315"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Cloud Computing"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Credit Units (Points)</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={newCourseUnits}
                  onChange={(e) => setNewCourseUnits(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
              </div>

              <div className="text-[11px] text-slate-500">
                Course will be assigned to: <strong className="text-slate-900">{selectedLevel === 'ALL' ? '300L' : selectedLevel}</strong> · <strong className="text-slate-900">{activeSemester === 'both' ? '1st Semester' : `Semester ${activeSemester}`}</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#ccf32f] hover:bg-[#bfe628] text-slate-950 text-xs font-bold border border-lime-400 cursor-pointer shadow-2xs"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
