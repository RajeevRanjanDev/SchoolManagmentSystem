import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { teacherService, TeacherAssignment } from '@api/services/teacherService';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import AttachmentButton, { AttachmentValue } from '@components/common/AttachmentButton';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear, relativeDate } from '@utils/dateUtils';

interface TargetOpt { key: string; label: string; classId?: number; sectionId: number }

const TeacherNoticeScreen = () => {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  const [target, setTarget] = useState<TargetOpt | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<AttachmentValue | null>(null);

  const { data: assignments } = useQuery({
    queryKey: ['teacher-assignments', academicYear],
    queryFn: () => teacherService.getMyAssignments(academicYear),
  });

  const targets: TargetOpt[] = useMemo(() => {
    const map = new Map<number, TargetOpt>();
    (assignments ?? []).forEach((a: TeacherAssignment) => {
      if (!map.has(a.sectionId)) {
        map.set(a.sectionId, {
          key: String(a.sectionId),
          label: `${a.className ?? 'Class'}${a.sectionName ? ' · ' + a.sectionName : ''}`,
          classId: a.classId,
          sectionId: a.sectionId,
        });
      }
    });
    return Array.from(map.values());
  }, [assignments]);

  useEffect(() => {
    if (!target && targets.length > 0) setTarget(targets[0]);
  }, [targets, target]);

  const { data: sent } = useQuery({
    queryKey: ['teacher-announcements'],
    queryFn: () => teacherService.getAnnouncements(),
  });

  const canSend = !!target && title.trim().length > 0 && content.trim().length > 0;

  const mutation = useMutation({
    mutationFn: () =>
      teacherService.createAnnouncement({
        classId: target?.classId,
        sectionId: target?.sectionId,
        title: title.trim(),
        content: content.trim(),
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.fileName,
        published: true,
      }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Notice sent' });
      setTitle('');
      setContent('');
      setAttachment(null);
      qc.invalidateQueries({ queryKey: ['teacher-announcements'] });
    },
    onError: (e: any) => {
      Toast.show({ type: 'error', text1: 'Failed to send', text2: e?.response?.data?.message ?? 'Try again' });
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Sizes.md, paddingBottom: insets.bottom + 110 }]}>

        <Text style={styles.screenTitle}>Send Notice</Text>
        <Text style={styles.screenSub}>Post an announcement to a class/section</Text>

        {/* Target */}
        <Text style={styles.label}>Send to</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {targets.map(t => {
            const active = target?.sectionId === t.sectionId;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTarget(t)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Form */}
        <Card style={styles.formCard}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. PTM on Saturday"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />
          <Text style={[styles.label, { marginTop: Sizes.md }]}>Message</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write your notice…"
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, styles.textarea]}
            multiline
            textAlignVertical="top"
          />
          <AttachmentButton value={attachment} onChange={setAttachment} />
          <AppButton
            title={mutation.isPending ? 'Sending…' : 'Send Notice'}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!canSend}
            style={{ marginTop: Sizes.md }}
          />
        </Card>

        {/* Sent list */}
        <Text style={styles.sectionHeading}>Recent notices</Text>
        {(sent ?? []).length === 0 ? (
          <EmptyState icon="bullhorn-outline" title="No notices yet" subtitle="Your sent notices will appear here." />
        ) : (
          (sent ?? []).map(a => (
            <Card key={a.id} style={styles.noticeCard}>
              <View style={styles.noticeRow}>
                <View style={styles.noticeIcon}>
                  <Icon name="bullhorn-outline" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noticeTitle} numberOfLines={1}>{a.title}</Text>
                  {a.content ? <Text style={styles.noticeBody} numberOfLines={2}>{a.content}</Text> : null}
                  <Text style={styles.noticeMeta}>
                    {[a.className, a.sectionName].filter(Boolean).join(' · ')}
                    {a.createdAt || a.date || a.publishedAt
                      ? `  ·  ${relativeDate((a.createdAt ?? a.date ?? a.publishedAt) as string)}`
                      : ''}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.sm },
  screenTitle: { fontSize: Sizes.fontXl, fontWeight: '800', color: Colors.textPrimary },
  screenSub: { fontSize: Sizes.fontSm, color: Colors.textMuted, marginBottom: Sizes.sm },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  chipsRow: { gap: Sizes.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  formCard: { padding: Sizes.md, marginTop: Sizes.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  textarea: { minHeight: 110 },
  sectionHeading: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginTop: Sizes.md, marginBottom: Sizes.sm },
  noticeCard: { padding: Sizes.md, marginBottom: Sizes.sm },
  noticeRow: { flexDirection: 'row', gap: Sizes.sm },
  noticeIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.softBlueBg,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeTitle: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  noticeBody: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  noticeMeta: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 4 },
});

export default TeacherNoticeScreen;
