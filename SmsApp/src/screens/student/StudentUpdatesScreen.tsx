import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const StudentUpdatesScreen = () => {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useQuery({
    queryKey: ['student-circulars'],
    queryFn: () => studentPortalService.getCirculars(),
  });

  return (
    <View style={styles.root}>
      <Header title="Updates" />
      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="bullhorn-outline" title="No updates" subtitle="Circulars and notices will appear here." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.icon}>
                  <Icon name="bullhorn-outline" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  {item.body ? <Text style={styles.body} numberOfLines={2}>{item.body}</Text> : null}
                  <View style={styles.metaRow}>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{item.category || 'Circulars & Notices'}</Text>
                    </View>
                    {item.date ? <Text style={styles.date}>{formatDate(item.date)}</Text> : null}
                  </View>
                </View>
                {!item.read && <View style={styles.dot} />}
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
  list: { padding: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', gap: Sizes.sm, alignItems: 'flex-start' },
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  body: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm, marginTop: 6 },
  chip: { backgroundColor: Colors.chipBg, borderRadius: Sizes.radiusFull, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: Sizes.fontXs, color: Colors.chipFg, fontWeight: '600' },
  date: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
});

export default StudentUpdatesScreen;
