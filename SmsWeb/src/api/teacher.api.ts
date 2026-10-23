import { apiClient } from './client';

const unwrap = (r: any) => r.data?.data ?? r.data;

export interface ClassTeacherSection {
  sectionId: number;
  sectionName: string;
  classId: number;
  className: string;
  studentCount: number;
}

export const teacherApi = {
  // Dashboard
  getDashboard: (academicYear?: string) =>
    apiClient.get('/api/v1/teacher/dashboard', { params: { academicYear } }).then(unwrap),

  getMyAssignments: (academicYear?: string) =>
    apiClient.get('/api/v1/teacher/my-assignments', { params: { academicYear } }).then(unwrap),

  // Sections the teacher is class teacher of (operation scope)
  getMyClassSections: (academicYear?: string): Promise<ClassTeacherSection[]> =>
    apiClient.get('/api/v1/teacher/my-class-sections', { params: { academicYear } }).then(unwrap),

  // Fuller read-only student profile for the class teacher
  getStudentCard: (studentId: number) =>
    apiClient.get(`/api/v1/teacher/students/${studentId}`).then(unwrap),

  // Timetable (teacher view)
  getMyTimetable: (teacherId: number, academicYear: string) =>
    apiClient.get(`/api/v1/timetable/teacher/${teacherId}`, { params: { academicYear } }).then(unwrap),

  // Classwork
  createClasswork: (data: any) =>
    apiClient.post('/api/v1/teacher/classwork', data).then(unwrap),
  getMyClasswork: (sectionId: number, academicYear?: string) =>
    apiClient.get('/api/v1/teacher/classwork', { params: { sectionId, academicYear } }).then(unwrap),

  // Homework (teacher view)
  createHomework: (data: any) =>
    apiClient.post('/api/v1/teacher/homework', data).then(unwrap),
  getMyHomework: (sectionId: number, academicYear?: string) =>
    apiClient.get('/api/v1/teacher/homework', { params: { sectionId, academicYear } }).then(unwrap),
  getSubmissions: (homeworkId: number) =>
    apiClient.get(`/api/v1/homework/${homeworkId}/submissions`).then(unwrap),
  reviewSubmission: (submissionId: number, data: any) =>
    apiClient.patch(`/api/v1/homework/submissions/${submissionId}/review`, data).then(unwrap),

  // Attendance
  markAttendance: (data: any) =>
    apiClient.post('/api/v1/teacher/attendance', data).then(unwrap),

  // Lesson Plans
  createLessonPlan: (data: any) =>
    apiClient.post('/api/v1/teacher/lesson-plans', data).then(unwrap),
  getMyLessonPlans: (academicYear?: string) =>
    apiClient.get('/api/v1/teacher/lesson-plans', { params: { academicYear } }).then(unwrap),
  addTopic: (planId: number, data: any) =>
    apiClient.post(`/api/v1/teacher/lesson-plans/${planId}/topics`, data).then(unwrap),
  updateTopicProgress: (planId: number, topicId: number, data: any) =>
    apiClient.patch(`/api/v1/teacher/lesson-plans/${planId}/topics/${topicId}/progress`, data).then(unwrap),

  // Marks
  enterMarks: (data: any) =>
    apiClient.post('/api/v1/teacher/marks', data).then(unwrap),

  // Announcements
  createAnnouncement: (data: any) =>
    apiClient.post('/api/v1/teacher/announcements', data).then(unwrap),
  getMyAnnouncements: () =>
    apiClient.get('/api/v1/teacher/announcements').then(unwrap),
};
