import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Linking, Modal, ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { circularService } from '@api/services/circularService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatDate, timeAgo } from '@utils/dateUtils';
import { Circular } from '@app-types/index';

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMIC: '#4F46E5', EVENT: '#F59E0B', HOLIDAY: '#10B981',
  SPORTS: '#EF4444', EXAMINATION: '#8B5CF6', GENERAL: '#06B6D4',
};

const CircularScreen = () => {
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState<Circular | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['circulars'],
    queryFn: () => circularService.getCirculars(),
  });

  return (
    <View style={styles.root}>
      <Header title="Circulars" subtitle="School Announcements" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingSpinner message="Loading circulars..." />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data?.content}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="newspaper-variant-outline" title="No Circulars" subtitle="No announcements at this time." />
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelected(item)} activeOpacity={0.8}>
              <Card style={[styles.card, !item.isRead && styles.unread]}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconBox, { backgroundColor: (CATEGORY_COLORS[item.category] ?? Colors.primary) + '18' }]}>
                    <Icon name="newspaper-variant" size={22} color={CATEGORY_COLORS[item.category] ?? Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                      {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.preview} numberOfLines={2}>{item.content}</Text>
                    <View style={styles.meta}>
                      <Badge
                        label={item.category}
                        color={CATEGORY_COLORS[item.category] ?? Colors.primary}
                        style={{ marginRight: 8 }}
                      />
                      <Icon name="clock-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{timeAgo(item.publishedDate)}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>{selected.title}</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                <Icon name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalMeta}>
              <Badge label={selected.category} color={CATEGORY_COLORS[selected.category] ?? Colors.primary} />
              <Text style={styles.modalDate}>{formatDate(selected.publishedDate)}</Text>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalContent}>{selected.content}</Text>
              {selected.attachmentUrl && (
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={() => Linking.openURL(selected.attachmentUrl!)}>
                  <Icon name="file-pdf-box" size={20} color={Colors.primary} />
                  <Text style={styles.attachText}>Download Attachment</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 32 },
  card: { marginBottom: Sizes.sm },
  unread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  cardRow: { flexDirection: 'row', gap: Sizes.md },
  iconBox: { width: 48, height: 48, borderRadius: Sizes.radiusMd, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  title: { flex: 1, fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4 },
  preview: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: Sizes.sm, gap: 4 },
  metaText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  // Modal
  modal: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Sizes.md, paddingTop: Sizes.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { flex: 1, fontSize: Sizes.fontXl, fontWeight: '700', color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  modalMeta: {
    flexDirection: 'row', alignItems: 'center', gap: Sizes.sm,
    paddingHorizontal: Sizes.md, paddingVertical: Sizes.sm,
  },
  modalDate: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  modalBody: { flex: 1, padding: Sizes.md },
  modalContent: { fontSize: Sizes.fontMd, color: Colors.textSecondary, lineHeight: 24 },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: Sizes.lg, padding: Sizes.md,
    backgroundColor: Colors.primary + '10',
    borderRadius: Sizes.radiusMd,
  },
  attachText: { fontSize: Sizes.fontMd, color: Colors.primary, fontWeight: '600' },
});

export default CircularScreen;
