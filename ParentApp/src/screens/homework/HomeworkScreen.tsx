import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeworkService } from '@api/services/homeworkService';
import { useAppSelector } from '@store/hooks';
import { useNavigation } from '@react-navigation/native';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import Badge from '@components/common/Badge';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatDate, relativeDate } from '@utils/dateUtils';
import { Homework } from '@app-types/index';

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#4F46E5', English: '#06B6D4', Science: '#10B981',
  Hindi: '#F59E0B', History: '#EF4444', Geography: '#8B5CF6',
  Physics: '#3B82F6', Chemistry: '#EC4899', Biology: '#14B8A6',
};

const HomeworkScreen = () => {
  const navigation = useNavigation<any>();
  const student    = useAppSelector(s => s.student.selectedStudent);
  const [expanded, setExpanded] = useState<number | null>(null);

  const sectionId = student?.sectionId ?? 0;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['homework', sectionId],
    queryFn: () =>
      sectionId
        ? homeworkService.getHomeworkBySection(sectionId)
        : homeworkService.getAllHomework(),
  });

  return (
    <View style={styles.root}>
      <Header title="Homework" subtitle={student?.firstName} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingSpinner message="Loading homework..." />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="book-open-outline"
              title="No Homework"
              subtitle="Great! No pending homework at the moment."
            />
          }
          renderItem={({ item }) => (
            <HomeworkCard
              item={item}
              isExpanded={expanded === item.id}
              onToggle={() => setExpanded(p => (p === item.id ? null : item.id))}
            />
          )}
        />
      )}
    </View>
  );
};

const HomeworkCard = ({
  item,
  isExpanded,
  onToggle,
}: {
  item: Homework;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const color = SUBJECT_COLORS[item.subject] ?? Colors.primary;
  const isOverdue = new Date(item.dueDate) < new Date() && item.status !== 'SUBMITTED';

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View style={[styles.subjectDot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.subject}>{item.subject}</Text>
            <Text style={styles.title} numberOfLines={isExpanded ? undefined : 2}>
              {item.title}
            </Text>
          </View>
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.textMuted}
          />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="account-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.teacherName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="calendar-outline" size={13} color={isOverdue ? Colors.danger : Colors.textMuted} />
            <Text style={[styles.metaText, isOverdue && { color: Colors.danger }]}>
              Due: {formatDate(item.dueDate)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expanded}>
          <Text style={styles.description}>{item.description}</Text>
          {item.attachmentUrl && (
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => Linking.openURL(item.attachmentUrl!)}>
              <Icon name="paperclip" size={16} color={Colors.primary} />
              <Text style={styles.attachText}>View Attachment</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.assigned}>Assigned: {relativeDate(item.assignedDate)}</Text>
        <Badge
          label={item.status ?? 'PENDING'}
          color={
            item.status === 'SUBMITTED' ? Colors.success
            : item.status === 'GRADED' ? Colors.primary
            : isOverdue ? Colors.danger
            : Colors.warning
          }
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 32 },
  card: { marginBottom: Sizes.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Sizes.sm },
  subjectDot: { width: 4, height: '100%' as any, borderRadius: 2, minHeight: 40 },
  subject: { fontSize: Sizes.fontXs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Sizes.fontMd, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: Sizes.md, marginTop: Sizes.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  expanded: { marginTop: Sizes.md, paddingTop: Sizes.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  description: { fontSize: Sizes.fontSm, color: Colors.textSecondary, lineHeight: 20 },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Sizes.sm },
  attachText: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Sizes.sm },
  assigned: { fontSize: Sizes.fontXs, color: Colors.textMuted },
});

export default HomeworkScreen;
