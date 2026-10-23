import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { adminService } from '@api/services/adminService';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import AttachmentButton, { AttachmentValue } from '@components/common/AttachmentButton';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatDate } from '@utils/dateUtils';

const AUDIENCES = [
  { key: 'ALL_SCHOOL', label: 'All School' },
  { key: 'TEACHERS', label: 'Teachers' },
  { key: 'FEE_DEFAULTERS', label: 'Fee Defaulters' },
];

const AdminBroadcastScreen = () => {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('ALL_SCHOOL');
  const [attachment, setAttachment] = useState<AttachmentValue | null>(null);

  const { data: sent } = useQuery({ queryKey: ['admin-sent'], queryFn: () => adminService.sentHistory() });

  const mutation = useMutation({
    mutationFn: () => adminService.broadcast({ title: title.trim(), body: body.trim(), type: 'GENERAL', audience, attachmentUrl: attachment?.url, attachmentName: attachment?.fileName }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Broadcast sent' });
      setTitle(''); setBody(''); setAttachment(null);
      qc.invalidateQueries({ queryKey: ['admin-sent'] });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const canSend = title.trim().length > 0 && body.trim().length > 0;
  const history: any[] = sent?.content ?? [];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Sizes.md, paddingBottom: insets.bottom + 110 }]}>
        <Text style={styles.screenTitle}>Broadcast</Text>
        <Text style={styles.screenSub}>Send a notification to the school</Text>

        <Text style={styles.label}>Audience</Text>
        <View style={styles.chipsRow}>
          {AUDIENCES.map(a => {
            const active = audience === a.key;
            return (
              <TouchableOpacity key={a.key} onPress={() => setAudience(a.key)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{a.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.label}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Holiday notice" placeholderTextColor={Colors.textMuted} style={styles.input} />
          <Text style={[styles.label, { marginTop: Sizes.md }]}>Message</Text>
          <TextInput value={body} onChangeText={setBody} placeholder="Write your message…" placeholderTextColor={Colors.textMuted} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />
          <AttachmentButton value={attachment} onChange={setAttachment} />
          <AppButton title={mutation.isPending ? 'Sending…' : 'Send Broadcast'} onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={!canSend} style={{ marginTop: Sizes.md }} />
        </Card>

        <Text style={styles.heading}>Sent</Text>
        {history.length === 0 ? (
          <EmptyState icon="bullhorn-outline" title="Nothing sent yet" />
        ) : (
          history.map((h, i) => (
            <Card key={h.id ?? i} style={styles.item}>
              <View style={styles.itemRow}>
                <View style={styles.icon}><Icon name="bullhorn-outline" size={16} color={Colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{h.title ?? 'Notification'}</Text>
                  <Text style={styles.itemMeta}>
                    {[h.audience, (h.createdAt ?? h.sentAt ?? h.scheduledAt) ? formatDate(h.createdAt ?? h.sentAt ?? h.scheduledAt) : null].filter(Boolean).join('  ·  ')}
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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.sm },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  formCard: { padding: Sizes.md, marginTop: Sizes.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  textarea: { minHeight: 110 },
  heading: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginTop: Sizes.md },
  item: { padding: Sizes.md, marginTop: Sizes.sm },
  itemRow: { flexDirection: 'row', gap: Sizes.sm, alignItems: 'center' },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  itemMeta: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 2 },
});

export default AdminBroadcastScreen;
