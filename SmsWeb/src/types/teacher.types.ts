export interface TeacherAssignment {
  id: number;
  teacherId: number;
  teacherName: string;
  classId: number;
  className: string;
  sectionId: number;
  sectionName: string;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  academicYear: string;
  classTeacher: boolean;
  status: string;
}

export interface ClassTeacherSection {
  sectionId: number;
  sectionName: string;
  classId: number;
  className: string;
  studentCount: number;
}

export interface TeacherDashboard {
  teacherId: number;
  teacherName: string;
  employeeCode?: string;
  photoUrl?: string;
  academicYear: string;
  assignments: TeacherAssignment[];
  classTeacherSections: ClassTeacherSection[];
  totalSections: number;
  totalSubjects: number;
  homeworkPostedThisWeek: number;
  classworkPostedThisWeek: number;
}

export interface TimetablePeriod {
  id: number;
  subject: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  academicYear: string;
  section?: { id: number; name: string };
  schoolClass?: { id: number; name: string };
}

export interface LessonPlan {
  id: number;
  teacherName: string;
  sectionName: string;
  className: string;
  subjectName: string;
  academicYear: string;
  planType: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status: string;
  totalTopics: number;
  completedTopics: number;
  pendingTopics: number;
  delayedTopics: number;
  completionPercent: number;
  topics: LessonPlanTopic[];
  createdAt: string;
}

export interface LessonPlanTopic {
  id: number;
  chapterName: string;
  topicName: string;
  learningOutcomes?: string;
  plannedDate?: string;
  actualDate?: string;
  periodsRequired: number;
  periodsCompleted: number;
  completionStatus: string;
  sequenceNo: number;
}
