import React from 'react';
import { View, Text, StyleSheet, FlatList, Linking, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { studentService } from '@api/services/studentService';
import { useAppSelector } from '@store/hooks';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { getInitials } from '@utils/formatters';
import { currentAcademicYear } from '@utils/dateUtils';

const ChildTeachersScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);
  const academicYear = currentAcademicYear();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['child-teachers', student?.studentId, academicYear],
    queryFn: () =>
      student ? studentService.getChildTeachers(student.studentId, academicYear) : Promise.resolve([]),
    enabled: !!student,
  });

  return (
    <View style={styles.root}>
      <Header title="Teachers" subtitle={student?.firstName} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingSpinner message="Loading teachers…" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => `${item.teacherId ?? i}-${item.subjectName ?? item.subject ?? i}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="account-tie-outline" title="No teachers" subtitle="No subject teachers assigned yet." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(item.teacherName ?? 'T')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.teacherName ?? 'Teacher'}</Text>
                  <Text style={styles.subject}>
                    {item.subjectName ?? item.subject ?? 'Subject'}
                    {item.isClassTeacher ? '  ·  Class Teacher' : ''}
                  </Text>
                </View>
                {item.mobile ? (
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.mobile}`)}>
                    <Icon name="phone-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                ) : null}
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
  list: { padding: Sizes.md, gap: Sizes.sm, paddingBottom: 120 },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sizes.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  name: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  subject: { fontSize: Sizes.fontXs, color: Colors.textSecondary, marginTop: 2 },
  callBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
});

export default ChildTeachersScreen;
