import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { teacherService } from '@api/services/teacherService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';
import { currentAcademicYear } from '@utils/dateUtils';

interface SectionOpt { sectionId: number; label: string }

const TeacherStudentsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const academicYear = currentAcademicYear();
  const [sectionId, setSectionId] = useState<number | undefined>();

  const { data: classSections } = useQuery({
    queryKey: ['teacher-class-sections', academicYear],
    queryFn: () => teacherService.getMyClassSections(academicYear),
  });
  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments', academicYear],
    queryFn: () => teacherService.getMyAssignments(academicYear),
  });

  const sectionOpts: SectionOpt[] = useMemo(() => {
    const map = new Map<number, string>();
    (classSections ?? []).forEach(c => map.set(c.sectionId, `${c.className ?? 'Class'}${c.sectionName ? ' · ' + c.sectionName : ''}`));
    (assignments ?? []).forEach(a => { if (!map.has(a.sectionId)) map.set(a.sectionId, `${a.className ?? 'Class'}${a.sectionName ? ' · ' + a.sectionName : ''}`); });
    return Array.from(map.entries()).map(([id, label]) => ({ sectionId: id, label }));
  }, [classSections, assignments]);

  useEffect(() => { if (sectionId == null && sectionOpts.length > 0) setSectionId(sectionOpts[0].sectionId); }, [sectionOpts, sectionId]);

  const { data: students, isLoading } = useQuery({
    queryKey: ['section-students', sectionId],
    queryFn: () => teacherService.getSectionStudents(sectionId!),
    enabled: sectionId != null,
  });

  return (
    <View style={styles.root}>
      <Header title="My Students" onBack={() => navigation.goBack()} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {sectionOpts.map(opt => {
          const active = opt.sectionId === sectionId;
          return (
            <TouchableOpacity key={opt.sectionId} onPress={() => setSectionId(opt.sectionId)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <LoadingSpinner message="Loading students…" />
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="account-off" title="No students" />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('StudentCard', { studentId: item.id })}>
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(`${item.firstName} ${item.lastName}`)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
                    <Text style={styles.sub}>
                      {item.rollNumber ? `Roll ${item.rollNumber}` : ''}{item.admissionNumber ? `  ·  ${item.admissionNumber}` : ''}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={22} color={Colors.textMuted} />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  chipsRow: { gap: Sizes.sm, paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  list: { padding: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  name: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
});

export default TeacherStudentsScreen;
