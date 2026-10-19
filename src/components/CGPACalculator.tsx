import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { User, Course, CourseGradeInput, GradeLetter, SavedCalculation } from '../types';
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
  BookOpen
} from 'lucide-react';

interface CGPACalculatorProps {
  currentUser: User;
  courses: Course[];
  savedCalculations: SavedCalculation[];
  onSaveCalculation: (calc: SavedCalculation) => void;
  onDeleteCalculation: (id: string) => void;
}

export const CGPACalculator: React.FC<CGPACalculatorProps> = ({
  currentUser,
  courses,
  savedCalculations,
  onSaveCalculation,
  onDeleteCalculation,
}) => {
  const [activeSemester, setActiveSemester] = useState<1 | 2 | 'both'>(1);
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previousCgpa, setPreviousCgpa] = useState<number>(3.85); // Prior cumulative base CGPA for 100L-200L
  const [previousTotalUnits, setPreviousTotalUnits] = useState<number>(72);
  const [calculatorMode, setCalculatorMode] = useState<'calculator' | 'projection'>('calculator');
  const [targetCgpa, setTargetCgpa] = useState<number>(4.50); // Target: First Class
  const [remainingUnits, setRemainingUnits] = useState<number>(34); // Remaining units till graduation

  // Initialize course grades based on registered courses with fixed units
  const initialGradeInputs: CourseGradeInput[] = useMemo(() => {
    return courses.map((c) => ({
      courseCode: c.code,
      courseTitle: c.title,
      creditUnits: c.creditUnits, // Fixed credit points by lecturer
      grade: '' as GradeLetter,
      semester: c.semester,
      academicYear: '2026/2027',
    }));
  }, [courses]);

  const [courseGrades, setCourseGrades] = useState<CourseGradeInput[]>(initialGradeInputs);

  // Sync fixed units if lecturer updated course units in real-time
  useEffect(() => {
    setCourseGrades((prev) =>
      prev.map((cg) => {
        const liveCourse = courses.find((c) => c.code === cg.courseCode);
        return liveCourse ? { ...cg, creditUnits: liveCourse.creditUnits } : cg;
      })
    );
  }, [courses]);

  // Pre-fill some realistic grades for sample student on first view
  useEffect(() => {
    setCourseGrades((prev) => {
      // If none have grades yet, set sample grades
      const hasAny = prev.some((g) => g.grade !== '');
      if (hasAny) return prev;
      return prev.map((c) => {
        if (c.courseCode === 'CSC 301') return { ...c, grade: 'A' };
        if (c.courseCode === 'CSC 303') return { ...c, grade: 'B' };
        if (c.courseCode === 'CSC 305') return { ...c, grade: 'A' };
        if (c.courseCode === 'CSC 307') return { ...c, grade: 'B' };
        if (c.courseCode === 'MTH 311') return { ...c, grade: 'A' };
        if (c.courseCode === 'GST 301') return { ...c, grade: 'A' };
        return c;
      });
    });
  }, []);

  const handleGradeChange = (code: string, newGrade: GradeLetter) => {
    setCourseGrades((prev) =>
      prev.map((c) => (c.courseCode === code ? { ...c, grade: newGrade } : c))
    );
  };

  // Filter courses by selected view (Semester 1, Semester 2, or both)
  const currentSemesterCourses = useMemo(() => {
    if (activeSemester === 'both') return courseGrades;
    return courseGrades.filter((c) => c.semester === activeSemester);
  }, [courseGrades, activeSemester]);

  // Compute live metrics for active semester view
  const semesterMetrics = useMemo(() => {
    return calculateSemesterMetrics(currentSemesterCourses);
  }, [currentSemesterCourses]);

  // Compute Cumulative CGPA (combining previous sessions + current session)
  const cumulativeCGPA = useMemo(() => {
    const currentQp = semesterMetrics.totalQualityPoints;
    const currentGradedUnits = semesterMetrics.gradedUnits;

    const totalQp = previousCgpa * previousTotalUnits + currentQp;
    const totalUnits = previousTotalUnits + currentGradedUnits;

    if (totalUnits === 0) return 0;
    return Number((totalQp / totalUnits).toFixed(2));
  }, [previousCgpa, previousTotalUnits, semesterMetrics]);

  // Classification info
  const classification = getDegreeClassification(cumulativeCGPA);

  // Trigger confetti if First Class is achieved!
  const triggerCelebration = () => {
    if (cumulativeCGPA >= 4.5) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    }
  };

  const handleSave = () => {
    const newCalc: SavedCalculation = {
      id: `calc-${Date.now()}`,
      studentId: currentUser.id,
      studentMatric: currentUser.matricNumber || 'CSC/2021/042',
      studentName: currentUser.name,
      academicYear,
      semester: activeSemester === 'both' ? 'cumulative' : activeSemester,
      gpa: semesterMetrics.gpa,
      cgpa: cumulativeCGPA,
      totalUnits: semesterMetrics.totalUnits,
      totalQualityPoints: semesterMetrics.totalQualityPoints,
      classification: classification.text,
      calculatedAt: new Date().toISOString(),
      courses: currentSemesterCourses,
    };

    onSaveCalculation(newCalc);
    setSaveSuccess(true);
    triggerCelebration();
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleDownloadPdf = (calcToExport?: SavedCalculation) => {
    exportOfficialTranscriptPdf(
      currentUser,
      calcToExport || null,
      currentSemesterCourses,
      semesterMetrics.gpa,
      cumulativeCGPA
    );
  };

  const handleResetGrades = () => {
    setCourseGrades((prev) => prev.map((c) => ({ ...c, grade: '' })));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* CGPA Header Banner */}
      <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Official Senate 5.00 Grading Scale
              </span>
              <span className="text-xs text-slate-400 font-mono">
                A=5, B=4, C=3, D=2, E=1, F=0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-400" />
              Automated CGPA & GPA Academic Engine
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Course credit points are permanently anchored by curriculum regulations and managed by course lecturers. Enter your grades beside each course to compute real-time Semester GPA and Cumulative CGPA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownloadPdf()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Transcript</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Results</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Academic results saved to history successfully! You can download your transcript at any time.</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-300">SAVED</span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2">
          <button
            onClick={() => setCalculatorMode('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              calculatorMode === 'calculator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Live Semester Grades & CGPA Calculator
          </button>
          <button
            onClick={() => setCalculatorMode('projection')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              calculatorMode === 'projection'
                ? 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white shadow-md shadow-amber-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Target CGPA & Academic Scenario Planner</span>
          </button>
        </div>
      </div>

      {calculatorMode === 'projection' ? (
        /* TARGET CGPA PROJECTION & WHAT-IF SIMULATOR */
        <div className="rounded-3xl liquid-glass p-6 sm:p-8 space-y-6 text-left animate-in fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                What-If Degree Forecaster
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Predict Minimum Required Performance
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Target CGPA & Graduating Class Simulator
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Input your target degree class (e.g. First Class 4.50 or Second Class Upper 3.50). The mathematical engine computes the exact minimum GPA and letter grade distribution required across your remaining academic semesters.
            </p>
          </div>

          {/* Projection Input Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target CGPA Benchmark
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="5.0"
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-sm font-mono font-bold text-amber-300 text-center"
                />
                <button
                  type="button"
                  onClick={() => setTargetCgpa(4.50)}
                  className="px-2.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 cursor-pointer"
                >
                  1st Class
                </button>
                <button
                  type="button"
                  onClick={() => setTargetCgpa(3.50)}
                  className="px-2.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 cursor-pointer"
                >
                  2:1
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Remaining Units to Graduation
              </label>
              <input
                type="number"
                min="6"
                max="120"
                value={remainingUnits}
                onChange={(e) => setRemainingUnits(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-sm font-mono font-bold text-white text-center"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                Approx. 400L & 500L curriculum units
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Cumulative Base
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-cyan-300">
                {cumulativeCGPA.toFixed(2)} CGPA ({previousTotalUnits + semesterMetrics.gradedUnits} Units Graded)
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                Includes completed semesters
              </span>
            </div>
          </div>

          {/* Mathematical Forecast Output */}
          {(() => {
            const completedUnits = previousTotalUnits + semesterMetrics.gradedUnits;
            const currentQp = (previousCgpa * previousTotalUnits) + semesterMetrics.totalQualityPoints;
            const totalProjectedUnits = completedUnits + remainingUnits;
            const targetTotalQp = targetCgpa * totalProjectedUnits;
            const requiredQp = Math.max(0, targetTotalQp - currentQp);
            const requiredGpa = remainingUnits > 0 ? Number((requiredQp / remainingUnits).toFixed(2)) : 0;
            const maxPossibleCgpa = Number(((currentQp + (5.0 * remainingUnits)) / totalProjectedUnits).toFixed(2));
            const isAchievable = requiredGpa <= 5.00;

            return (
              <div className="space-y-4">
                <div className={`p-6 rounded-2xl border ${
                  isAchievable
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-rose-950/30 border-rose-500/40'
                }`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300 mb-1">
                        Academic Target Verdict
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-white">
                        {isAchievable ? (
                          <span className="text-emerald-300">Achievable Target! Required Future GPA: {requiredGpa.toFixed(2)}</span>
                        ) : (
                          <span className="text-rose-300">Mathematically Out of Reach ({requiredGpa.toFixed(2)} needed &gt; 5.00)</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        {isAchievable
                          ? `To graduate with a ${targetCgpa.toFixed(2)} CGPA, you must average at least a ${requiredGpa.toFixed(2)} Semester GPA across your remaining ${remainingUnits} credit units.`
                          : `The highest possible graduating CGPA you can attain if you score straight A's (5.00 GPA) in all remaining ${remainingUnits} units is ${maxPossibleCgpa.toFixed(2)}.`}
                      </p>
                    </div>

                    <div className="text-right p-4 rounded-xl bg-black/30 border border-white/10 shrink-0">
                      <div className="text-[10px] text-slate-400 font-mono">Max Achievable CGPA</div>
                      <div className="text-2xl font-bold font-mono text-cyan-300">{maxPossibleCgpa.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">With Straight A's</div>
                    </div>
                  </div>
                </div>

                {/* Grade Distribution Recipe */}
                {isAchievable && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Recommended Future Grade Distribution Strategy
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-lg font-bold text-emerald-300 font-mono">
                          {Math.ceil((remainingUnits / 3) * (requiredGpa >= 4.5 ? 0.8 : requiredGpa >= 3.5 ? 0.5 : 0.2))} Courses
                        </div>
                        <div className="text-[10px] text-slate-400">Grade 'A' (5 Points)</div>
                      </div>

                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="text-lg font-bold text-blue-300 font-mono">
                          {Math.floor((remainingUnits / 3) * 0.4)} Courses
                        </div>
                        <div className="text-[10px] text-slate-400">Grade 'B' (4 Points)</div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div className="text-lg font-bold text-amber-300 font-mono">
                          &le; 1 Course
                        </div>
                        <div className="text-[10px] text-slate-400">Grade 'C' (3 Points)</div>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <div className="text-lg font-bold text-rose-300 font-mono">0 Courses</div>
                        <div className="text-[10px] text-slate-400">Zero Tolerated F's</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : null}

      {/* Primary KPI Results Cards */}
      {calculatorMode === 'calculator' && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Semester GPA */}
        <div className="p-5 rounded-2xl liquid-glass border border-white/10 relative overflow-hidden">
          <div className="text-xs text-slate-400 font-medium mb-1">
            {activeSemester === 'both' ? 'Session Combined GPA' : `Semester ${activeSemester} GPA`}
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {semesterMetrics.gpa.toFixed(2)}
            <span className="text-sm font-normal text-slate-400 ml-1">/ 5.00</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            TQP: {semesterMetrics.totalQualityPoints} · Graded Units: {semesterMetrics.gradedUnits}
          </div>
        </div>

        {/* Cumulative CGPA */}
        <div className="p-5 rounded-2xl liquid-glass border border-blue-500/30 bg-blue-500/[0.05] relative overflow-hidden">
          <div className="text-xs text-blue-300 font-medium mb-1 flex items-center justify-between">
            <span>Cumulative CGPA</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-blue-300 font-mono tabular-nums tracking-tight">
            {cumulativeCGPA.toFixed(2)}
            <span className="text-sm font-normal text-blue-200/60 ml-1">/ 5.00</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-200/80 font-mono">
            All Sessions (100L - 300L)
          </div>
        </div>

        {/* Degree Classification Standing */}
        <div className="p-5 rounded-2xl liquid-glass border border-white/10">
          <div className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Degree Classification</span>
          </div>
          <div className={`text-base font-bold truncate ${classification.color}`}>
            {classification.text}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Based on 5.00 Grade Benchmark
          </div>
        </div>

        {/* Total Registered vs Passed Units */}
        <div className="p-5 rounded-2xl liquid-glass border border-white/10">
          <div className="text-xs text-slate-400 font-medium mb-1">
            Registered & Passed Units
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums tracking-tight">
            {semesterMetrics.totalPassedUnits}
            <span className="text-sm font-normal text-slate-400 ml-1">/ {semesterMetrics.totalUnits} Units</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Passed Rate: {semesterMetrics.totalUnits > 0 ? Math.round((semesterMetrics.totalPassedUnits / semesterMetrics.totalUnits) * 100) : 0}%
          </div>
        </div>

      </div>

      {/* Grade Entry Table & Controls */}
      <div className="rounded-3xl liquid-glass p-6 sm:p-8 space-y-6">
        
        {/* Semester Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveSemester(1)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSemester === 1
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              First Semester (300L)
            </button>
            <button
              onClick={() => setActiveSemester(2)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSemester === 2
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Second Semester (300L)
            </button>
            <button
              onClick={() => setActiveSemester('both')}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSemester === 'both'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Academic Year (CGPA)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetGrades}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Grades</span>
            </button>
          </div>
        </div>

        {/* Mobile Course Cards (Responsive for App/Phone Screen Sizes) */}
        <div className="block md:hidden space-y-3">
          {currentSemesterCourses.map((c) => {
            const pt = c.grade ? GRADE_POINTS[c.grade as Exclude<GradeLetter, ''>] : 0;
            const qp = pt * c.creditUnits;

            return (
              <div 
                key={c.courseCode}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300 text-sm">{c.courseCode}</span>
                      <span className="text-[10px] font-mono text-slate-400">Sem {c.semester}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-100 mt-0.5 leading-snug">{c.courseTitle}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shrink-0">
                    {c.creditUnits} Units
                  </span>
                </div>

                {/* Grade Selection Buttons */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Grade (0–5 Pts):</span>
                    <span className="font-bold text-slate-200">
                      {c.grade ? `${pt} Pts · ${qp} QP` : 'Tap to assign'}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {(['A', 'B', 'C', 'D', 'E', 'F'] as GradeLetter[]).map((letter) => {
                      const isSelected = c.grade === letter;
                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => handleGradeChange(c.courseCode, letter)}
                          className={`h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Mobile Totals Footer */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Total Units: <strong className="text-amber-300">{semesterMetrics.totalUnits}</strong></span>
            <span className="text-slate-400">Quality Points: <strong className="text-emerald-400">{semesterMetrics.totalQualityPoints} QP</strong></span>
          </div>
        </div>

        {/* Desktop Course Grades Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Course Code</th>
                <th className="py-3 px-4">Course Title</th>
                <th className="py-3 px-4 text-center">Credit Units</th>
                <th className="py-3 px-4">Enter Grade</th>
                <th className="py-3 px-4 text-center">Points (0 - 5)</th>
                <th className="py-3 px-4 text-right">Quality Points (Units × Points)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {currentSemesterCourses.map((c) => {
                const pt = c.grade ? GRADE_POINTS[c.grade as Exclude<GradeLetter, ''>] : 0;
                const qp = pt * c.creditUnits;

                return (
                  <tr
                    key={c.courseCode}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Course Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      {c.courseCode}
                    </td>

                    {/* Course Title */}
                    <td className="py-3.5 px-4 text-white font-medium max-w-xs">
                      {c.courseTitle}
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        Fixed curriculum · Sem {c.semester}
                      </span>
                    </td>

                    {/* Fixed Credit Units */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono font-bold">
                        {c.creditUnits} Units
                      </span>
                    </td>

                    {/* Grade Selector (A, B, C, D, E, F) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        {(['A', 'B', 'C', 'D', 'E', 'F'] as GradeLetter[]).map((letter) => {
                          const isSelected = c.grade === letter;
                          return (
                            <button
                              key={letter}
                              type="button"
                              onClick={() => handleGradeChange(c.courseCode, letter)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400'
                                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                              }`}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Grade Points */}
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-200">
                      {c.grade ? pt : '-'}
                    </td>

                    {/* Quality Points */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 tabular-nums">
                      {c.grade ? qp : '0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/10 text-white font-bold bg-white/[0.02]">
                <td className="py-3.5 px-4 font-mono">TOTALS</td>
                <td className="py-3.5 px-4 text-slate-400 font-normal text-xs">
                  {currentSemesterCourses.length} Courses evaluated
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-amber-300">
                  {semesterMetrics.totalUnits} Units
                </td>
                <td className="py-3.5 px-4 text-slate-400 font-normal">
                  Weighted Scale (5.00 Max)
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                  -
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-400 text-sm">
                  {semesterMetrics.totalQualityPoints} QP
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Prior CGPA Configuration (Cumulative Bridge) */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">
                Cumulative CGPA Carrier (100L & 200L Academic Foundation)
              </div>
              <div className="text-[11px] text-slate-400">
                Prior cumulative units and grade point average from past academic years
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="font-mono text-[11px]">Prior CGPA:</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5.00"
                value={previousCgpa}
                onChange={(e) => setPreviousCgpa(Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/20 text-white font-mono text-xs text-center"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="font-mono text-[11px]">Prior Units:</span>
              <input
                type="number"
                min="0"
                max="200"
                value={previousTotalUnits}
                onChange={(e) => setPreviousTotalUnits(Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-white/20 text-white font-mono text-xs text-center"
              />
            </div>
          </div>
        </div>

      </div>
      </>
      )}

      {/* Saved Calculation History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Saved Academic Calculations & Official Statements ({savedCalculations.length})
            </h2>
            <p className="text-xs text-slate-400">
              Historical calculations saved by {currentUser.name} ({currentUser.matricNumber})
            </p>
          </div>
        </div>

        {savedCalculations.length === 0 ? (
          <div className="p-8 rounded-2xl liquid-glass text-center text-slate-400 text-xs">
            No calculations saved yet. Click <strong>"Save Results"</strong> above to store your semester result history.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedCalculations.map((calc) => (
              <div
                key={calc.id}
                className="p-5 rounded-2xl liquid-glass border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {calc.semester === 'cumulative' ? 'Full Session' : `Semester ${calc.semester}`} · {calc.academicYear}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(calc.calculatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-3">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-left">
                      <div className="text-[10px] text-slate-400">GPA Calculated</div>
                      <div className="text-lg font-bold text-white font-mono tabular-nums">
                        {calc.gpa.toFixed(2)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-left">
                      <div className="text-[10px] text-slate-400">Cumulative CGPA</div>
                      <div className="text-lg font-bold text-cyan-300 font-mono tabular-nums">
                        {calc.cgpa.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 font-semibold mb-1">
                    Standing: <span className="text-amber-300">{calc.classification}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Total Units: {calc.totalUnits} · Quality Points: {calc.totalQualityPoints}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => handleDownloadPdf(calc)}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => onDeleteCalculation(calc.id)}
                    className="text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
