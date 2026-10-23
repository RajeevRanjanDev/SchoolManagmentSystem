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

import { adminService } from '@api/services/adminService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import LoadingSpinner from '@components/common/LoadingSpinner';
import EmptyState from '@components/common/EmptyState';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

const AdminSubjectsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['admin-subjects'], queryFn: () => adminService.listSubjects() });

  const mutation = useMutation({
    mutationFn: () => adminService.createSubject({ subjectName: name.trim(), subjectCode: code.trim() }),
    onSuccess: () => { Toast.show({ type: 'success', text1: 'Subject added' }); setName(''); setCode(''); qc.invalidateQueries({ queryKey: ['admin-subjects'] }); },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Subjects" onBack={() => navigation.goBack()} />
      <Card style={styles.formCard}>
        <View style={styles.inlineRow}>
          <TextInput value={name} onChangeText={setName} placeholder="Subject name" placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 2 }]} />
          <TextInput value={code} onChangeText={setCode} placeholder="Code" placeholderTextColor={Colors.textMuted} style={[styles.input, { flex: 1 }]} autoCapitalize="characters" />
        </View>
        <AppButton title={mutation.isPending ? 'Adding…' : 'Add Subject'} onPress={() => mutation.mutate()} loading={mutation.isPending} disabled={!name.trim() || !code.trim()} size="sm" style={{ marginTop: Sizes.sm }} />
      </Card>

      {isLoading ? (
        <LoadingSpinner message="Loading…" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="book-outline" title="No subjects" />}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.icon}><Icon name="book-outline" size={18} color={Colors.primary} /></View>
                <Text style={styles.name}>{item.subjectName}</Text>
                <View style={{ flex: 1 }} />
                {item.subjectCode ? <Text style={styles.code}>{item.subjectCode}</Text> : null}
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
  inlineRow: { flexDirection: 'row', gap: Sizes.sm },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  list: { paddingHorizontal: Sizes.md, gap: Sizes.sm },
  card: { padding: Sizes.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Sizes.sm },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.softBlueBg, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: Sizes.fontMd, fontWeight: '700', color: Colors.textPrimary },
  code: { fontSize: Sizes.fontXs, color: Colors.textMuted, fontWeight: '600' },
});

export default AdminSubjectsScreen;
