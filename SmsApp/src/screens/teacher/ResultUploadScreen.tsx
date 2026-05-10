import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../../api/students.api';
import { examsApi } from '../../api/exams.api';
import { QUERY_KEYS, CURRENT_ACADEMIC_YEAR } from '../../constants';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Card } from '../../components/common/Card';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';
import type { Student, Exam } from '../../types';

const DEFAULT_SECTION_ID = 1;
const GRADES = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];

export function ResultUploadScreen() {
  const queryClient = useQueryClient();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [marksMap, setMarksMap] = useState<Record<number, { marks: string; grade: string }>>({});

  const { data: exams, isLoading: loadingExams } = useQuery({
    queryKey: QUERY_KEYS.EXAMS(DEFAULT_SECTION_ID),
    queryFn: () => examsApi.getBySection(DEFAULT_SECTION_ID, CURRENT_ACADEMIC_YEAR),
  });

  const { data: studentsPage, isLoading: loadingStudents } = useQuery({
    queryKey: QUERY_KEYS.STUDENTS,
    queryFn: () => studentsApi.getAll(0, 200),
  });

  const students = studentsPage?.content ?? [];

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedExam) return;
      const uploads = Object.entries(marksMap).map(([studentId, data]) =>
        examsApi.uploadResult({
          examId: selectedExam.id,
          studentId: Number(studentId),
          marksObtained: Number(data.marks),
          grade: data.grade || undefined,
        }),
      );
      await Promise.all(uploads);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Results uploaded successfully!');
      setMarksMap({});
      setSelectedExam(null);
    },
    onError: () => Alert.alert('Error', 'Failed to upload some results.'),
  });

  function setMarks(studentId: number, marks: string) {
    setMarksMap(m => ({ ...m, [studentId]: { ...(m[studentId] ?? { grade: '' }), marks } }));
  }

  function setGrade(studentId: number, grade: string) {
    setMarksMap(m => ({ ...m, [studentId]: { ...(m[studentId] ?? { marks: '' }), grade } }));
  }

  if (loadingExams || loadingStudents) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <Header title="Upload Results" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Exam Selector */}
        <Text style={styles.label}>Select Exam</Text>
        {(exams ?? []).length === 0 ? (
          <Card><Text style={styles.noExam}>No exams scheduled for this section</Text></Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examScroll}>
            {(exams ?? []).map((exam: Exam) => (
              <TouchableOpacity
                key={exam.id}
                style={[styles.examChip, selectedExam?.id === exam.id && styles.examChipActive]}
                onPress={() => setSelectedExam(exam)}
              >
                <Text style={[styles.examChipText, selectedExam?.id === exam.id && styles.examChipTextActive]}>
                  {exam.examName}
                </Text>
                <Text style={[styles.examSubject, selectedExam?.id === exam.id && { color: Colors.white }]}>
                  {exam.subject} / {exam.totalMarks} marks
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedExam && (
          <>
            <Text style={[styles.label, { marginTop: Spacing.lg }]}>
              Enter Marks — {selectedExam.examName} ({selectedExam.subject})
            </Text>
            <Text style={styles.sublabel}>Total Marks: {selectedExam.totalMarks}</Text>

            {students.map((student: Student) => (
              <View key={student.id} style={styles.studentResultRow}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.firstName} {student.lastName}</Text>
                  <Text style={styles.admNo}>#{student.admissionNumber}</Text>
                </View>
                <TextInput
                  style={styles.marksInput}
                  placeholder="Marks"
                  keyboardType="numeric"
                  value={marksMap[student.id]?.marks ?? ''}
                  onChangeText={v => setMarks(student.id, v)}
                  maxLength={4}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
                  {GRADES.map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.gradeBtn, marksMap[student.id]?.grade === g && styles.gradeBtnActive]}
                      onPress={() => setGrade(student.id, g)}
                    >
                      <Text style={[styles.gradeText, marksMap[student.id]?.grade === g && styles.gradeTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}

            <Button
              label={`Submit Results for ${Object.keys(marksMap).length} Students`}
              onPress={() => mutation.mutate()}
              loading={mutation.isPending}
              fullWidth
              style={styles.submitBtn}
              size="lg"
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  label: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sublabel: { ...Typography.body2, color: Colors.textSecondary, marginBottom: Spacing.md },
  examScroll: { marginBottom: Spacing.md },
  examChip: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    minWidth: 140,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  examChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  examChipText: { ...Typography.h5, color: Colors.textPrimary },
  examChipTextActive: { color: Colors.white },
  examSubject: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  studentResultRow: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  studentInfo: { marginBottom: Spacing.sm },
  studentName: { ...Typography.body2, color: Colors.textPrimary, fontWeight: '600' },
  admNo: { ...Typography.caption, color: Colors.textTertiary },
  marksInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    width: 100,
  },
  gradeScroll: { marginBottom: 4 },
  gradeBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  gradeBtnActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  gradeText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  gradeTextActive: { color: Colors.white },
  submitBtn: { marginTop: Spacing.lg },
  noExam: { ...Typography.body2, color: Colors.textSecondary, textAlign: 'center' },
});
