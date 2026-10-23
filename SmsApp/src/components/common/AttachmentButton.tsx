import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentPicker from 'react-native-document-picker';
import Toast from 'react-native-toast-message';
import { attachmentService } from '@api/services/attachmentService';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

export interface AttachmentValue { url: string; fileName: string }

interface Props {
  value: AttachmentValue | null;
  onChange: (v: AttachmentValue | null) => void;
}

/** Pick a PDF/image, upload it, and surface {url, fileName}. Reused by notice/broadcast screens. */
const AttachmentButton: React.FC<Props> = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    try {
      const results: any[] = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        allowMultiSelection: false,
      });
      const f = results[0];
      if (!f) return;
      setUploading(true);
      const a = await attachmentService.upload({
        uri: f.uri,
        name: f.name ?? 'attachment',
        type: f.type ?? 'application/octet-stream',
      });
      onChange({ url: a.url, fileName: a.fileName ?? f.name ?? 'attachment' });
    } catch (e: any) {
      if (!DocumentPicker.isCancel(e)) {
        Toast.show({ type: 'error', text1: 'Upload failed', text2: e?.response?.data?.message ?? 'Try again' });
      }
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <View style={styles.chip}>
        <Icon name="paperclip" size={16} color={Colors.primary} />
        <Text style={styles.chipText} numberOfLines={1}>{value.fileName}</Text>
        <TouchableOpacity onPress={() => onChange(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="close-circle" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.btn} onPress={pick} disabled={uploading}>
      {uploading ? <ActivityIndicator size="small" color={Colors.primary} /> : <Icon name="paperclip" size={18} color={Colors.primary} />}
      <Text style={styles.btnText}>{uploading ? 'Uploading…' : 'Attach PDF / image'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8 },
  btnText: { fontSize: Sizes.fontSm, color: Colors.primary, fontWeight: '700' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: Colors.softBlueBg, borderRadius: Sizes.radiusFull, paddingHorizontal: Sizes.md, paddingVertical: 6, maxWidth: '100%',
  },
  chipText: { flexShrink: 1, fontSize: Sizes.fontSm, color: Colors.textPrimary, fontWeight: '600' },
});

export default AttachmentButton;
