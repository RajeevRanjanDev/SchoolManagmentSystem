import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear } from '@utils/dateUtils';

const AdminClassesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  const [classId, setClassId] = useState<number | undefined>();
  const [showClassForm, setShowClassForm] = useState(false);
  const [newClass, setNewClass] = useState('');
  const [newSection, setNewSection] = useState('');

  const { data: classes, isLoading } = useQuery({ queryKey: ['admin-classes', academicYear], queryFn: () => adminService.listClasses(academicYear) });
  useEffect(() => { if (classId == null && (classes ?? []).length > 0) setClassId(classes![0].id); }, [classes, classId]);

  const { data: sections } = useQuery({ queryKey: ['admin-sections', classId], queryFn: () => adminService.listSections(classId!), enabled: classId != null });

  const createClassMut = useMutation({
    mutationFn: () => adminService.createClass({ name: newClass.trim(), academicYear }),
    onSuccess: (c) => { Toast.show({ type: 'success', text1: 'Class created' }); setNewClass(''); setShowClassForm(false); qc.invalidateQueries({ queryKey: ['admin-classes', academicYear] }); setClassId(c.id); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });
  const createSectionMut = useMutation({
    mutationFn: () => adminService.createSection(classId!, { name: newSection.trim() }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Section added' }); setNewSection(''); qc.invalidateQueries({ queryKey: ['admin-sections', classId] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Classes & Sections" onBack={() => navigation.goBack()} rightIcon={showClassForm ? 'close' : 'plus'} onRightPress={() => setShowClassForm(s => !s)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}>

        {showClassForm && (
          <Card style={styles.formCard}>
            <Text style={styles.label}>New class name</Text>
            <View style={styles.inlineRow}>
              <TextInput value={newClass} onChangeText={setNewClass} placeholder="e.g. Grade 5"
                placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 1 }]} />
              <AppButton title="Add" onPress={() => createClassMut.mutate()} loading={createClassMut.isPending} disabled={!newClass.trim()} size="sm" style={{ width: 80 }} />
            </View>
          </Card>
        )}

        {isLoading ? (
          <LoadingSpinner message="Loading…" />
        ) : (classes ?? []).length === 0 ? (
          <EmptyState icon="google-classroom" title="No classes" subtitle="Tap + to add a class." />
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {(classes ?? []).map(c => {
                const active = c.id === classId;
                return (
                  <TouchableOpacity key={c.id} onPress={() => setClassId(c.id)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Card style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Sections</Text>
              {(sections ?? []).length === 0 ? (
                <Text style={styles.empty}>No sections yet.</Text>
              ) : (
                (sections ?? []).map(s => (
                  <View key={s.id} style={styles.sectionRow}>
                    <Icon name="view-grid-outline" size={18} color={Colors.primary} />
                    <Text style={styles.sectionName}>{s.name}</Text>
                    <View style={{ flex: 1 }} />
                    {s.classTeacherName ? <Text style={styles.ct}>{s.classTeacherName}</Text> : null}
                  </View>
                ))
              )}
              <View style={styles.inlineRow}>
                <TextInput value={newSection} onChangeText={setNewSection} placeholder="New section (e.g. A)"
                  placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 1 }]} />
                <AppButton title="Add" onPress={() => createSectionMut.mutate()} loading={createSectionMut.isPending} disabled={!newSection.trim() || classId == null} size="sm" style={{ width: 80 }} />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.sm },
  formCard: { padding: Sizes.md },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, marginTop: Sizes.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  chipsRow: { gap: Sizes.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  sectionCard: { padding: Sizes.md, marginTop: Sizes.sm },
  cardTitle: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  empty: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  sectionName: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  ct: { fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default AdminClassesScreen;
