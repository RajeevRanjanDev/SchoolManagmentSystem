import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Colors, Typography, Spacing } from '../../theme';

// Classwork follows the same pattern as Homework (POST /api/v1/homework with type=CLASSWORK)
// This screen is a simplified placeholder — extend same as HomeworkScreen
export function ClassworkScreen() {
  return (
    <View style={styles.container}>
      <Header title="Classwork" showBack />
      <Card style={styles.card}>
        <Text style={styles.note}>
          Classwork management follows the same flow as Homework.
          Use the Homework screen to assign classwork by setting the due date to today.
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { margin: Spacing.md },
  note: { ...Typography.body2, color: Colors.textSecondary, lineHeight: 24 },
});
