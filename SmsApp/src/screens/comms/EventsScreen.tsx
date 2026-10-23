import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';

import { commsService } from '@api/services/commsService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatDate } from '@utils/dateUtils';

const EventsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [venue, setVenue] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['events'], queryFn: () => commsService.getEvents(0, 30) });
  const events = data?.content ?? [];

  const mutation = useMutation({
    mutationFn: () => commsService.createEvent({ title: title.trim(), description: description.trim() || undefined, eventDate, venue: venue.trim() || undefined, publish: true }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Event published' }); setTitle(''); setDescription(''); setVenue(''); setShow(false); qc.invalidateQueries({ queryKey: ['events'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  const canCreate = title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(eventDate);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Events" onBack={() => navigation.goBack()} rightIcon={show ? 'close' : 'plus'} onRightPress={() => setShow(s => !s)} />
      {show && (
        <Card style={styles.formCard}>
          <TextInput value={title} onChangeText={setTitle} placeholder="Event title" placeholderTextColor={Colors.textMuted} style={styles.input} />
          <TextInput value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor={Colors.textMuted} style={[styles.input, styles.textarea, { marginTop: Sizes.sm }]} multiline textAlignVertical="top" />
          <View style={styles.inlineRow}>
            <TextInput value={eventDate} onChangeText={setEventDate} placeholder="yyyy-MM-dd" placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 1 }]} />
            <TextInput value={venue} onChangeText={setVenue} placeholder="Venue" placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 1 }]} />
          </View>
          <AppButton title={mutation.isPending ? 'Publishing…' : 'Publish Event'} onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={!canCreate} size="sm" style={{ marginTop: Sizes.sm }} />
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="calendar-star" title="No events" subtitle="Tap + to add one." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.icon}><Icon name="calendar-star" size={18} color={Colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  {item.description ? <Text style={styles.body} numberOfLines={2}>{item.description}</Text> : null}
                  <Text style={styles.date}>
                    {item.eventDate ? formatDate(item.eventDate) : ''}{item.venue ? `  ·  ${item.venue}` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  formCard: { padding: Sizes.md, margin: Sizes.md },
  inlineRow: { flexDirection: 'row', gap: Sizes.sm, marginTop: Sizes.sm },
  input: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  textarea: { minHeight: 70 },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', gap: Sizes.sm },
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  body: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  date: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 6 },
});

export default EventsScreen;
