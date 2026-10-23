import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Modal, Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { eventService } from '@api/services/eventService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorView from '@components/common/ErrorView';
import EmptyState from '@components/common/EmptyState';
import Badge from '@components/common/Badge';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { formatDate } from '@utils/dateUtils';
import { SchoolEvent } from '@app-types/index';

const { width } = Dimensions.get('window');
const IMG_SIZE = (width - Sizes.md * 2 - Sizes.sm) / 2;

const EventGalleryScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [galleryIndex, setGalleryIndex]   = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents(),
  });

  return (
    <View style={styles.root}>
      <Header title="Event Gallery" subtitle="Photos & Events" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingSpinner message="Loading events..." />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : (
        <FlatList
          data={data?.content}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="image-multiple-outline" title="No Events" subtitle="Event photos will appear here." />
          }
          renderItem={({ item }) => (
            <Card style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <View style={styles.metaRow}>
                    <Icon name="calendar-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{formatDate(item.eventDate)}</Text>
                    <Icon name="map-marker-outline" size={13} color={Colors.textMuted} style={{ marginLeft: 8 }} />
                    <Text style={styles.metaText}>{item.venue}</Text>
                  </View>
                </View>
                <Badge label={item.category} color={Colors.primary} />
              </View>
              <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>

              {/* Photo grid */}
              {item.photoUrls?.length > 0 ? (
                <View style={styles.photoGrid}>
                  {item.photoUrls.slice(0, 4).map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => { setSelectedEvent(item); setGalleryIndex(idx); }}>
                      <Image
                        source={{ uri: url }}
                        style={[styles.photo, { width: IMG_SIZE, height: IMG_SIZE }]}
                      />
                      {idx === 3 && item.photoUrls.length > 4 && (
                        <View style={styles.moreOverlay}>
                          <Text style={styles.moreText}>+{item.photoUrls.length - 4}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noPhoto}>
                  <Icon name="image-outline" size={32} color={Colors.border} />
                  <Text style={styles.noPhotoText}>No photos uploaded</Text>
                </View>
              )}
            </Card>
          )}
        />
      )}

      {/* Full-screen gallery modal */}
      <Modal visible={!!selectedEvent} animationType="fade" statusBarTranslucent>
        <View style={styles.gallery}>
          <TouchableOpacity style={styles.galleryClose} onPress={() => setSelectedEvent(null)}>
            <Icon name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
          {selectedEvent && (
            <>
              <Image
                source={{ uri: selectedEvent.photoUrls[galleryIndex] }}
                style={styles.galleryImage}
                resizeMode="contain"
              />
              <View style={styles.galleryNav}>
                <TouchableOpacity
                  onPress={() => setGalleryIndex(i => Math.max(0, i - 1))}
                  disabled={galleryIndex === 0}>
                  <Icon name="chevron-left" size={40} color={galleryIndex === 0 ? 'rgba(255,255,255,0.3)' : Colors.white} />
                </TouchableOpacity>
                <Text style={styles.galleryCount}>
                  {galleryIndex + 1} / {selectedEvent.photoUrls.length}
                </Text>
                <TouchableOpacity
                  onPress={() => setGalleryIndex(i => Math.min(selectedEvent.photoUrls.length - 1, i + 1))}
                  disabled={galleryIndex === selectedEvent.photoUrls.length - 1}>
                  <Icon name="chevron-right" size={40} color={galleryIndex === selectedEvent.photoUrls.length - 1 ? 'rgba(255,255,255,0.3)' : Colors.white} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Sizes.md, paddingBottom: 32 },
  eventCard: { marginBottom: Sizes.md },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Sizes.sm },
  eventTitle: { fontSize: Sizes.fontLg, fontWeight: '700', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  metaText: { fontSize: Sizes.fontXs, color: Colors.textMuted },
  eventDesc: { fontSize: Sizes.fontSm, color: Colors.textSecondary, marginBottom: Sizes.sm, lineHeight: 18 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Sizes.xs },
  photo: { borderRadius: Sizes.radiusSm },
  moreOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: Sizes.radiusSm,
  },
  moreText: { color: Colors.white, fontSize: Sizes.fontXl, fontWeight: '700' },
  noPhoto: { alignItems: 'center', paddingVertical: Sizes.lg, gap: 8 },
  noPhotoText: { fontSize: Sizes.fontSm, color: Colors.textMuted },
  // Gallery modal
  gallery: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  galleryClose: { position: 'absolute', top: 56, right: Sizes.lg, zIndex: 10 },
  galleryImage: { width: '100%', height: '70%' },
  galleryNav: { flexDirection: 'row', alignItems: 'center', gap: Sizes.xl, marginTop: Sizes.lg },
  galleryCount: { color: Colors.white, fontSize: Sizes.fontMd },
});

export default EventGalleryScreen;
