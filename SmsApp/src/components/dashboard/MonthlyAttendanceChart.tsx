import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';

export interface MonthBucket {
  label: string;   // e.g. "May"
  present: number;
  absent: number;
}

interface Props {
  data: MonthBucket[];
}

const CHART_HEIGHT = 140;

/**
 * Lightweight grouped bar chart (Present / Absent per month) rendered with
 * plain Views so it matches the soft portal tone and needs no chart library.
 */
const MonthlyAttendanceChart: React.FC<Props> = ({ data }) => {
  const max = Math.max(
    1,
    ...data.map(d => Math.max(d.present, d.absent)),
  );

  return (
    <View>
      <View style={styles.chartArea}>
        {data.map(bucket => (
          <View key={bucket.label} style={styles.group}>
            <View style={styles.barsRow}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.round((bucket.present / max) * CHART_HEIGHT) || 2,
                    backgroundColor: Colors.present,
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.round((bucket.absent / max) * CHART_HEIGHT) || 2,
                    backgroundColor: Colors.absent,
                  },
                ]}
              />
            </View>
            <Text style={styles.monthLabel}>{bucket.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.legendRow}>
        <Legend color={Colors.present} label="Present" />
        <Legend color={Colors.absent} label="Absent" />
      </View>
    </View>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: CHART_HEIGHT + 20,
    paddingTop: Sizes.sm,
  },
  group: { alignItems: 'center', flex: 1 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: CHART_HEIGHT },
  bar: { width: 9, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  monthLabel: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 6 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: Sizes.lg, marginTop: Sizes.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: Sizes.fontXs, color: Colors.textSecondary },
});

export default MonthlyAttendanceChart;
