import jsPDF from 'jspdf';
import { CourseGradeInput, GradeLetter, SavedCalculation, User } from '../types';

export const GRADE_POINTS: Record<Exclude<GradeLetter, ''>, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

export const getGradePoint = (grade: GradeLetter): number => {
  if (!grade) return 0;
  return GRADE_POINTS[grade] ?? 0;
};

export const getDegreeClassification = (cgpa: number): { text: string; color: string; badge: string } => {
  if (cgpa >= 4.5) {
    return {
      text: 'First Class Honours',
      color: 'text-slate-950 font-bold',
      badge: 'bg-[#ccf32f] text-slate-950 border border-lime-400 shadow-xs font-bold',
    };
  } else if (cgpa >= 3.5) {
    return {
      text: 'Second Class Honours (Upper Division)',
      color: 'text-emerald-800 font-bold',
      badge: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold',
    };
  } else if (cgpa >= 2.4) {
    return {
      text: 'Second Class Honours (Lower Division)',
      color: 'text-sky-800 font-bold',
      badge: 'bg-sky-100 text-sky-900 border border-sky-300 font-semibold',
    };
  } else if (cgpa >= 1.5) {
    return {
      text: 'Third Class Honours',
      color: 'text-amber-800 font-bold',
      badge: 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold',
    };
  } else if (cgpa >= 1.0) {
    return {
      text: 'Pass Degree',
      color: 'text-orange-800 font-bold',
      badge: 'bg-orange-100 text-orange-900 border border-orange-300 font-semibold',
    };
  } else {
    return {
      text: 'Academic Probation / Fail',
      color: 'text-rose-800 font-bold',
      badge: 'bg-rose-100 text-rose-900 border border-rose-300 font-semibold',
    };
  }
};

export const calculateSemesterMetrics = (courses: CourseGradeInput[]) => {
  let totalUnits = 0;
  let totalQualityPoints = 0;
  let gradedUnits = 0;
  let totalPassedUnits = 0;

  for (const c of courses) {
    totalUnits += c.creditUnits;
    if (c.grade) {
      const pt = GRADE_POINTS[c.grade];
      const qp = pt * c.creditUnits;
      totalQualityPoints += qp;
      gradedUnits += c.creditUnits;
      if (pt > 0) {
        totalPassedUnits += c.creditUnits;
      }
    }
  }

  const gpa = gradedUnits > 0 ? Number((totalQualityPoints / gradedUnits).toFixed(2)) : 0;

  return {
    totalUnits,
    gradedUnits,
    totalPassedUnits,
    totalQualityPoints,
    gpa,
  };
};

export const exportOfficialTranscriptPdf = (
  student: User,
  calc: SavedCalculation | null,
  activeCourses: CourseGradeInput[],
  currentGpa: number,
  currentCgpa: number
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('NOVALIS UNIVERSITY OF TECHNOLOGY', pageWidth / 2, y, { align: 'center' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('OFFICE OF THE REGISTRAR & ACADEMIC AFFAIRS', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('STUDENT INFORMATION DISSEMINATION SYSTEM (SIDS) • OFFICIAL STATEMENT OF RESULTS', pageWidth / 2, y, { align: 'center' });

  // Student Bio Section
  y = 46;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('STUDENT ACADEMIC PROFILE', 14, y);

  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);

  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Full Name:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.name, 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Matriculation No:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.matricNumber || 'N/A', 158, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Faculty:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.faculty || 'Science', 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.department || 'Computer Science', 158, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Current Level:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.level || '300L', 45, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Academic Session:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text('2026/2027 Academic Session', 158, y);

  // Table of Courses & Grades
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('COURSE GRADE BREAKDOWN', 14, y);

  y += 4;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.text('COURSE CODE', 17, y + 5.5);
  doc.text('COURSE TITLE', 45, y + 5.5);
  doc.text('UNITS', 125, y + 5.5);
  doc.text('GRADE', 145, y + 5.5);
  doc.text('POINTS', 165, y + 5.5);
  doc.text('QP', 185, y + 5.5);

  y += 8;
  const coursesToRender = calc ? calc.courses : activeCourses;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  let sumUnits = 0;
  let sumQp = 0;

  for (const c of coursesToRender) {
    const pt = c.grade ? GRADE_POINTS[c.grade as Exclude<GradeLetter, ''>] : 0;
    const qp = pt * c.creditUnits;
    sumUnits += c.creditUnits;
    sumQp += qp;

    // Row alternating background
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 7, pageWidth - 14, y + 7);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(c.courseCode, 17, y + 5);

    doc.setFont('helvetica', 'normal');
    const truncatedTitle = c.courseTitle.length > 38 ? c.courseTitle.substring(0, 36) + '...' : c.courseTitle;
    doc.text(truncatedTitle, 45, y + 5);
    doc.text(String(c.creditUnits), 128, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(c.grade || '-', 148, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(String(pt), 168, y + 5);
    doc.text(String(qp), 187, y + 5);

    y += 7.5;
  }

  // Summary Metrics Box
  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  const gpaVal = calc ? calc.gpa : currentGpa;
  const cgpaVal = calc ? calc.cgpa : currentCgpa;
  const classObj = getDegreeClassification(cgpaVal);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.text(`Total Registered Units: ${sumUnits}`, 20, y + 8);
  doc.text(`Total Quality Points (TQP): ${sumQp}`, 20, y + 16);
  doc.text(`Semester GPA: ${gpaVal.toFixed(2)}`, 80, y + 8);
  doc.text(`Cumulative CGPA: ${cgpaVal.toFixed(2)}`, 80, y + 16);

  doc.setTextColor(15, 23, 42);
  doc.text('Standing:', 140, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(classObj.text, 140, y + 16);

  // Authentication Stamp & Signatures
  y += 36;
  doc.setDrawColor(203, 213, 225);
  doc.line(18, y, 75, y);
  doc.line(135, y, 192, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('HOD Computer Science', 30, y + 4);
  doc.text('Barr. Margaret Adebayo (Registrar)', 138, y + 4);

  // Security Footer
  const footerY = 282;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Generated via SIDS Portal on ${dateStr} • Electronic verification barcode: NOVALIS-SIDS-${student.matricNumber || '001'}`, 14, footerY);
  doc.text('Page 1 of 1', pageWidth - 28, footerY);

  // Trigger download
  const filename = `SIDS_Transcript_${(student.matricNumber || 'student').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
};
