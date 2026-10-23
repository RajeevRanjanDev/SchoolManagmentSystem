import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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

const CircularsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['circulars'], queryFn: () => commsService.getCirculars(0, 30) });
  const circulars = data?.content ?? [];

  const mutation = useMutation({
    mutationFn: () => commsService.createCircular({ title: title.trim(), content: content.trim(), publish: true }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Circular published' }); setTitle(''); setContent(''); setShow(false); qc.invalidateQueries({ queryKey: ['circulars'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Circulars" onBack={() => navigation.goBack()} rightIcon={show ? 'close' : 'plus'} onRightPress={() => setShow(s => !s)} />
      {show && (
        <Card style={styles.formCard}>
          <TextInput value={title} onChangeText={setTitle} placeholder="Circular title" placeholderTextColor={Colors.textMuted} style={styles.input} />
          <TextInput value={content} onChangeText={setContent} placeholder="Content…" placeholderTextColor={Colors.textMuted} style={[styles.input, styles.textarea, { marginTop: Sizes.sm }]} multiline textAlignVertical="top" />
          <AppButton title={mutation.isPending ? 'Publishing…' : 'Publish Circular'} onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={!title.trim() || !content.trim()} size="sm" style={{ marginTop: Sizes.sm }} />
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={circulars}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="newspaper-variant-outline" title="No circulars" subtitle="Tap + to publish one." />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.icon}><Icon name="newspaper-variant-outline" size={18} color={Colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  {item.content ? <Text style={styles.body} numberOfLines={3}>{item.content}</Text> : null}
                  <Text style={styles.date}>{item.category ? `${item.category}  ·  ` : ''}{item.publishedDate ? formatDate(item.publishedDate) : ''}</Text>
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
  input: { backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary },
  textarea: { minHeight: 90 },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', gap: Sizes.sm },
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  body: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  date: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 6 },
});

export default CircularsScreen;
