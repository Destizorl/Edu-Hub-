import { CourseGradeInput, GradeLetter } from '../types';

export interface CurriculumCourse {
  code: string;
  title: string;
  creditUnits: number;
  level: '100L' | '200L' | '300L' | '400L' | '500L';
  semester: 1 | 2;
  department: string;
  isCore?: boolean;
}

export const PRESET_CURRICULUM: Record<string, CurriculumCourse[]> = {
  // Official B.Sc (Hons.) Computer Science Curriculum
  '100L-1': [
    { code: 'GST 111.1', title: 'Communication in English', creditUnits: 2, level: '100L', semester: 1, department: 'General Studies', isCore: true },
    { code: 'MTH 101.1', title: 'Elementary Mathematics I', creditUnits: 2, level: '100L', semester: 1, department: 'Mathematics', isCore: true },
    { code: 'MTH 102.1', title: 'Elementary Mathematics II', creditUnits: 2, level: '100L', semester: 1, department: 'Mathematics', isCore: true },
    { code: 'PHY 101.1', title: 'General Physics I', creditUnits: 2, level: '100L', semester: 1, department: 'Physics', isCore: true },
    { code: 'PHY 107.1', title: 'General Practical Physics I', creditUnits: 1, level: '100L', semester: 1, department: 'Physics', isCore: true },
    { code: 'COS 101.1', title: 'Introduction to Computing Sciences', creditUnits: 3, level: '100L', semester: 1, department: 'Computer Science', isCore: true },
  ],
  '100L-2': [
    { code: 'GST 112.2', title: 'Nigerian Peoples and Culture', creditUnits: 2, level: '100L', semester: 2, department: 'General Studies', isCore: true },
    { code: 'PHY 102.2', title: 'General Physics II', creditUnits: 2, level: '100L', semester: 2, department: 'Physics', isCore: true },
    { code: 'PHY 108.2', title: 'General Practical Physics II', creditUnits: 1, level: '100L', semester: 2, department: 'Physics', isCore: true },
    { code: 'COS 102.2', title: 'Problem Solving', creditUnits: 3, level: '100L', semester: 2, department: 'Computer Science', isCore: true },
    { code: 'STA 111.2', title: 'Descriptive Statistics', creditUnits: 3, level: '100L', semester: 2, department: 'Mathematics & Statistics', isCore: true },
  ],
  '200L-1': [
    { code: 'GST 212.1', title: 'Philosophy, Logic and Human Existence', creditUnits: 2, level: '200L', semester: 1, department: 'General Studies', isCore: true },
    { code: 'COS 201.1', title: 'Computer Programming I', creditUnits: 3, level: '200L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'CSC 203.1', title: 'Discrete Structures', creditUnits: 2, level: '200L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'IFT 211.1', title: 'Digital Logic Design', creditUnits: 2, level: '200L', semester: 1, department: 'Information Technology', isCore: true },
    { code: 'UPH-CSC 270.1', title: 'User Interface and User Experience (UI/UX) Design', creditUnits: 2, level: '200L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'MTH 201.1', title: 'Mathematical Methods I', creditUnits: 2, level: '200L', semester: 1, department: 'Mathematics', isCore: true },
    { code: 'UPH-CSC 281.1', title: 'Introduction to Cyber Technologies', creditUnits: 2, level: '200L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'UPH-CSC 238.1', title: 'VB.Net Programming', creditUnits: 2, level: '200L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'UPH-CSC 286.1', title: 'Cloud Application and Development', creditUnits: 2, level: '200L', semester: 1, department: 'Computer Science', isCore: false },
  ],
  '200L-2': [
    { code: 'ENT 211.2', title: 'Entrepreneurship and Innovation', creditUnits: 2, level: '200L', semester: 2, department: 'Entrepreneurship', isCore: true },
    { code: 'COS 202.2', title: 'Computer Programming II', creditUnits: 3, level: '200L', semester: 2, department: 'Computer Science', isCore: true },
    { code: 'MTH 202.2', title: 'Elementary Differential Equations', creditUnits: 2, level: '200L', semester: 2, department: 'Mathematics', isCore: true },
    { code: 'IFT 212.2', title: 'Computer Architecture and Organisation', creditUnits: 2, level: '200L', semester: 2, department: 'Information Technology', isCore: true },
    { code: 'SEN 201.2', title: 'Introduction to Software Engineering', creditUnits: 2, level: '200L', semester: 2, department: 'Software Engineering', isCore: true },
    { code: 'DTS 204.2', title: 'Data Management I', creditUnits: 3, level: '200L', semester: 2, department: 'Data Science', isCore: true },
    { code: 'UPH-CSC 288.2', title: 'General Community Service', creditUnits: 2, level: '200L', semester: 2, department: 'General Studies', isCore: true },
    { code: 'UPH-CSC 298.2', title: 'Interactive Programming Using JavaScript', creditUnits: 3, level: '200L', semester: 2, department: 'Computer Science', isCore: true },
    { code: 'UPH-CSC 273.2', title: 'Introduction to Cryptography and Blockchain Technologies', creditUnits: 2, level: '200L', semester: 2, department: 'Computer Science', isCore: false },
  ],
  '300L-1': [
    { code: 'GST 312.1', title: 'Peace and Conflict Resolution', creditUnits: 2, level: '300L', semester: 1, department: 'General Studies', isCore: true },
    { code: 'IFT 302.1', title: 'Web Application Development', creditUnits: 2, level: '300L', semester: 1, department: 'Information Technology', isCore: true },
    { code: 'CSC 301.1', title: 'Data Structures', creditUnits: 3, level: '300L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'IFT 310.1', title: 'Mobile Application Development', creditUnits: 2, level: '300L', semester: 1, department: 'Information Technology', isCore: true },
    { code: 'CSC 322.1', title: 'Computer Science Innovation and Entrepreneurship', creditUnits: 2, level: '300L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'CSC 308.1', title: 'Operating Systems', creditUnits: 3, level: '300L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'CSC 309.1', title: 'Artificial Intelligence', creditUnits: 3, level: '300L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'ENT 312.1', title: 'Venture Creation', creditUnits: 2, level: '300L', semester: 1, department: 'Entrepreneurship', isCore: true },
    { code: 'ICT 305.1', title: 'Data Communication Network and Systems', creditUnits: 3, level: '300L', semester: 1, department: 'Information & Comm. Tech', isCore: true },
    { code: 'UPH-CSC 362.1', title: 'NoSQL Databases Programming', creditUnits: 2, level: '300L', semester: 1, department: 'Computer Science', isCore: false },
  ],
  '300L-2': [
    { code: 'CSC 399.2', title: 'SIWES II (Industrial Training Scheme)', creditUnits: 9, level: '300L', semester: 2, department: 'Computer Science', isCore: true },
  ],
  '400L-1': [
    { code: 'COS 409.1', title: 'Research Methodology and Technical Report Writing', creditUnits: 3, level: '400L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'CSC 401.1', title: 'Algorithms and Complexity Analysis', creditUnits: 2, level: '400L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'IFT 410.1', title: 'System Integration and Architecture', creditUnits: 2, level: '400L', semester: 1, department: 'Information Technology', isCore: true },
    { code: 'UPH-CSC 486.1', title: 'Web 3 Full Stack Technologies', creditUnits: 2, level: '400L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'UPH-CSC 454.1', title: 'Ethics of Artificial Intelligence', creditUnits: 2, level: '400L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'UPH-CSC 498.1', title: 'Python Modules', creditUnits: 3, level: '400L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'UPH-CSC 476.1', title: 'Cloud Computing', creditUnits: 3, level: '400L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'UPH-CSC 488.1', title: 'Game Application Development', creditUnits: 2, level: '400L', semester: 1, department: 'Computer Science', isCore: true },
  ],
  '400L-2': [
    { code: 'INS 401.2', title: 'Project Management', creditUnits: 2, level: '400L', semester: 2, department: 'Information Systems', isCore: true },
    { code: 'CSC 402.2', title: 'Ethics and Legal issues in Computer Science', creditUnits: 3, level: '400L', semester: 2, department: 'Computer Science', isCore: true },
    { code: 'CSC 499.2', title: 'Final Year Research Project & Oral Defense', creditUnits: 6, level: '400L', semester: 2, department: 'Computer Science', isCore: true },
  ],
  '500L-1': [
    { code: 'ENG 501.1', title: 'Engineering Management & Industrial Law', creditUnits: 2, level: '500L', semester: 1, department: 'Computer Engineering', isCore: true },
    { code: 'CSC 503.1', title: 'Advanced High-Performance Distributed Clusters', creditUnits: 3, level: '500L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'CSC 505.1', title: 'Autonomous Robotics & Cyber-Physical Systems', creditUnits: 3, level: '500L', semester: 1, department: 'Computer Science', isCore: true },
    { code: 'CSC 507.1', title: 'Quantum Computing Foundations & Algorithms', creditUnits: 3, level: '500L', semester: 1, department: 'Computer Science', isCore: true },
  ],
  '500L-2': [
    { code: 'CSC 599.2', title: 'Final Comprehensive Engineering Capstone Project', creditUnits: 6, level: '500L', semester: 2, department: 'Computer Science', isCore: true },
    { code: 'CSC 502.2', title: 'Technology Commercialization & Venture Pitching', creditUnits: 2, level: '500L', semester: 2, department: 'Computer Science', isCore: true },
    { code: 'CSC 504.2', title: 'Critical Infrastructure Security & Forensics', creditUnits: 3, level: '500L', semester: 2, department: 'Computer Science', isCore: true },
    { code: 'CSC 506.2', title: 'Enterprise System Architecture & Scalability', creditUnits: 3, level: '500L', semester: 2, department: 'Computer Science', isCore: true },
  ],
};

export const ALL_LEVELS = [
  { id: '100L', label: '100 Level (Year 1)', shortLabel: '100L' },
  { id: '200L', label: '200 Level (Year 2)', shortLabel: '200L' },
  { id: '300L', label: '300 Level (Year 3)', shortLabel: '300L' },
  { id: '400L', label: '400 Level (Year 4)', shortLabel: '400L' },
  { id: '500L', label: '500 Level (Year 5 - Engr/Tech)', shortLabel: '500L' },
] as const;

export const SEMESTERS = [
  { id: 1, label: '1st Semester (Harmattan / Fall)' },
  { id: 2, label: '2nd Semester (Rain / Spring)' },
  { id: 'both', label: 'Full Academic Year (Both Semesters)' },
] as const;
