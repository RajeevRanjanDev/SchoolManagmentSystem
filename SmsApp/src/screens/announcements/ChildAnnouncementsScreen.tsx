import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
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
import { formatDate } from '@utils/dateUtils';

const ChildAnnouncementsScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['child-announcements', student?.studentId],
    queryFn: () =>
      student ? studentService.getChildAnnouncements(student.studentId) : Promise.resolve([]),
    enabled: !!student,
  });

  return (
    <View style={styles.root}>
      <Header title="Announcements" subtitle={student?.firstName} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="bullhorn-outline" title="No announcements" subtitle="Class announcements will appear here." />}
          renderItem={({ item }) => {
            const date = item.date ?? item.createdAt ?? item.publishedAt;
            return (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.icon}>
                    <Icon name="bullhorn-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.content ? <Text style={styles.body} numberOfLines={4}>{item.content}</Text> : null}
                    {date ? <Text style={styles.date}>{formatDate(date)}</Text> : null}
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, gap: Sizes.sm, paddingBottom: 120 },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', gap: Sizes.sm },
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  body: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 19 },
  date: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 6 },
});

export default ChildAnnouncementsScreen;
