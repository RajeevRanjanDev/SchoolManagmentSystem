import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { studentPortalService } from '@api/services/studentPortalService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatDate } from '@utils/dateUtils';

const StudentAssignmentsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { data, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => studentPortalService.getAssignments(),
  });

  return (
    <View style={styles.root}>
      <Header title="Assignments" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => `${item.type}-${item.id}`}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="book-open-variant" title="No assignments" subtitle="Homework and classwork will appear here." />}
          renderItem={({ item }) => {
            const isHw = item.type === 'HOMEWORK';
            return (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.icon, { backgroundColor: (isHw ? Colors.tilePurpleFg : Colors.tileBlueFg) + '18' }]}>
                    <Icon name={isHw ? 'book-open-variant' : 'pencil-box-outline'} size={20} color={isHw ? Colors.tilePurpleFg : Colors.tileBlueFg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.sub} numberOfLines={2}>
                      {[item.subject, item.description].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={styles.meta}>
                      {isHw ? 'Homework' : 'Classwork'}
                      {item.dueDate ? `  ·  Due ${formatDate(item.dueDate)}` : item.date ? `  ·  ${formatDate(item.date)}` : ''}
                    </Text>
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
  list: { padding: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', gap: Sizes.sm },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  meta: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 4 },
});

export default StudentAssignmentsScreen;
