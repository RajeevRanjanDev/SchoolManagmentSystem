import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear } from '@utils/dateUtils';

const AdminTeacherAssignmentsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const qc = useQueryClient();
  const teacherId: number = route.params?.teacherId;
  const academicYear = currentAcademicYear();

  const [classId, setClassId] = useState<number | undefined>();
  const [sectionId, setSectionId] = useState<number | undefined>();
  const [subjectId, setSubjectId] = useState<number | undefined>();
  const [classTeacher, setClassTeacher] = useState(false);

  const { data: assignments } = useQuery({ queryKey: ['teacher-assignments-admin', teacherId, academicYear], queryFn: () => adminService.teacherAssignments(teacherId, academicYear) });
  const { data: classes } = useQuery({ queryKey: ['admin-classes', academicYear], queryFn: () => adminService.listClasses(academicYear) });
  const { data: sections } = useQuery({ queryKey: ['admin-sections', classId], queryFn: () => adminService.listSections(classId!), enabled: classId != null });
  const { data: subjects } = useQuery({ queryKey: ['admin-subjects'], queryFn: () => adminService.listSubjects() });
  useEffect(() => { setSectionId(undefined); }, [classId]);

  const key = ['teacher-assignments-admin', teacherId, academicYear];
  const addMut = useMutation({
    mutationFn: () => adminService.assignTeacher(teacherId, { classId: classId!, sectionId: sectionId!, subjectId: subjectId!, academicYear, isClassTeacher: classTeacher }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Assigned' }); setSubjectId(undefined); setClassTeacher(false); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });
  const removeMut = useMutation({
    mutationFn: (id: number) => adminService.removeAssignment(id),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Removed' }); qc.invalidateQueries({ queryKey: key }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const canAdd = classId != null && sectionId != null && subjectId != null;

  return (
    <View style={styles.root}>
      <Header title="Assignments" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        <Card style={styles.card}>
          <Text style={styles.section}>Add assignment</Text>
          <Text style={styles.label}>Class</Text>
          <Chips items={(classes ?? []).map(c => ({ id: c.id, name: c.name }))} value={classId} onChange={setClassId} />
          {classId != null && (<><Text style={[styles.label, { marginTop: Sizes.sm }]}>Section</Text>
            <Chips items={(sections ?? []).map(s => ({ id: s.id, name: s.name }))} value={sectionId} onChange={setSectionId} /></>)}
          <Text style={[styles.label, { marginTop: Sizes.sm }]}>Subject</Text>
          <Chips items={(subjects ?? []).map(s => ({ id: s.id, name: s.subjectName }))} value={subjectId} onChange={setSubjectId} />
          <TouchableOpacity style={styles.ctRow} onPress={() => setClassTeacher(v => !v)}>
            <Icon name={classTeacher ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={classTeacher ? Colors.primary : Colors.border} />
            <Text style={styles.ctText}>Class teacher for this section</Text>
          </TouchableOpacity>
          <AppButton title={addMut.isPending ? 'Adding…' : 'Add Assignment'} onPress={() => addMut.mutate()} loading={addMut.isPending} disabled={!canAdd} size="sm" style={{ marginTop: Sizes.sm }} />
        </Card>

        <Text style={styles.heading}>Current</Text>
        {(assignments ?? []).length === 0 ? (
          <Text style={styles.empty}>No assignments yet.</Text>
        ) : (
          (assignments ?? []).map((a: any) => (
            <Card key={a.id ?? `${a.sectionId}-${a.subjectId}`} style={styles.item}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{a.className ?? 'Class'}{a.sectionName ? ` · ${a.sectionName}` : ''}</Text>
                  <Text style={styles.itemSub}>{a.subjectName ?? a.subject ?? ''}{a.isClassTeacher ? '  ·  Class Teacher' : ''}</Text>
                </View>
                {a.id != null ? (
                  <TouchableOpacity onPress={() => Alert.alert('Remove', 'Remove this assignment?', [
                    { text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removeMut.mutate(a.id) },
                  ])}>
                    <Icon name="trash-can-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const Chips = ({ items, value, onChange }: { items: { id: number; name: string }[]; value?: number; onChange: (v: number) => void }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
    {items.map(it => {
      const active = it.id === value;
      return (
        <TouchableOpacity key={it.id} onPress={() => onChange(it.id)} style={[styles.chip, active && styles.chipActive]}>
          <Text style={[styles.chipText, active && styles.chipTextActive]}>{it.name}</Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  section: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  chipsRow: { gap: Sizes.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  ctRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, marginTop: Sizes.sm },
  ctText: { fontSize: Sizes.fontSm, color: Colors.textPrimary },
  heading: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginTop: Sizes.md },
  empty: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  item: { padding: Sizes.md, marginTop: Sizes.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm },
  itemTitle: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  itemSub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
});

export default AdminTeacherAssignmentsScreen;
