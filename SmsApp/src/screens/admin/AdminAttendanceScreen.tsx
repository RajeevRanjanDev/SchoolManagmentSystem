import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { attendanceColor } from '@utils/formatters';
import { currentAcademicYear } from '@utils/dateUtils';

const AdminAttendanceScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const academicYear = currentAcademicYear();
  const [classId, setClassId] = useState<number | undefined>();
  const [sectionId, setSectionId] = useState<number | undefined>();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: classes } = useQuery({ queryKey: ['admin-classes', academicYear], queryFn: () => adminService.listClasses(academicYear) });
  const { data: sections } = useQuery({ queryKey: ['admin-sections', classId], queryFn: () => adminService.listSections(classId!), enabled: classId != null });
  useEffect(() => { setSectionId(undefined); }, [classId]);

  const { data: records, isLoading, isFetching } = useQuery({
    queryKey: ['admin-attendance', sectionId, date],
    queryFn: () => adminService.sectionAttendance(sectionId!, date),
    enabled: sectionId != null && /^\d{4}-\d{2}-\d{2}$/.test(date),
  });

  const summary = useMemo(() => {
    const r = records ?? [];
    return {
      present: r.filter((x: any) => x.status === 'PRESENT').length,
      absent: r.filter((x: any) => x.status === 'ABSENT').length,
      total: r.length,
    };
  }, [records]);

  return (
    <View style={styles.root}>
      <Header title="Attendance" onBack={() => navigation.goBack()} />
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
      {classId != null && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {(sections ?? []).map(s => {
            const active = s.id === sectionId;
            return (
              <TouchableOpacity key={s.id} onPress={() => setSectionId(s.id)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Date</Text>
        <TextInput value={date} onChangeText={setDate} placeholder="yyyy-MM-dd" placeholderTextColor={Colors.textMuted} style={styles.dateInput} />
      </View>

      {sectionId == null ? (
        <EmptyState icon="calendar-search" title="Pick a section" subtitle="Choose class, section and date." />
      ) : (isLoading || isFetching) ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={records ?? []}
          keyExtractor={(item: any, i) => String(item.id ?? item.studentId ?? i)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            (records ?? []).length ? (
              <Text style={styles.summary}>{summary.present} present · {summary.absent} absent · {summary.total} total</Text>
            ) : null
          }
          ListEmptyComponent={<EmptyState icon="calendar-blank" title="No records" subtitle="No attendance marked for this date." />}
          renderItem={({ item }: any) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: attendanceColor(item.status) }]} />
                <Text style={styles.name}>{item.studentName ?? `#${item.studentId}`}</Text>
                <View style={{ flex: 1 }} />
                <Badge label={item.status} color={attendanceColor(item.status)} />
              </View>
            </Card>
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
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, paddingHorizontal: Sizes.md, paddingBottom: Sizes.sm },
  dateLabel: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary },
  dateInput: { flex: 1, backgroundColor: Colors.white, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: 8, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  summary: { fontSize: Sizes.fontSm, color: Colors.textMuted, fontWeight: '600', marginBottom: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary },
});

export default AdminAttendanceScreen;
