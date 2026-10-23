import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeacherTabNavigator from './TeacherTabNavigator';
import TeacherHomeworkScreen    from '@screens/teacher/TeacherHomeworkScreen';
import TeacherClassworkScreen   from '@screens/teacher/TeacherClassworkScreen';
import TeacherStudentsScreen    from '@screens/teacher/TeacherStudentsScreen';
import TeacherStudentCardScreen from '@screens/teacher/TeacherStudentCardScreen';
import TeacherTimetableScreen   from '@screens/teacher/TeacherTimetableScreen';
import TeacherSubmissionsScreen from '@screens/teacher/TeacherSubmissionsScreen';
import TeacherLessonPlansScreen from '@screens/teacher/TeacherLessonPlansScreen';
import NotificationsScreen      from '@screens/notifications/NotificationsScreen';
import CircularsScreen          from '@screens/comms/CircularsScreen';
import { TeacherStackParams } from './types';

const Stack = createNativeStackNavigator<TeacherStackParams>();

const TeacherNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
    <Stack.Screen name="Homework"    component={TeacherHomeworkScreen} />
    <Stack.Screen name="Classwork"   component={TeacherClassworkScreen} />
    <Stack.Screen name="Students"    component={TeacherStudentsScreen} />
    <Stack.Screen name="StudentCard" component={TeacherStudentCardScreen} />
    <Stack.Screen name="Timetable"   component={TeacherTimetableScreen} />
    <Stack.Screen name="Submissions" component={TeacherSubmissionsScreen} />
    <Stack.Screen name="LessonPlans" component={TeacherLessonPlansScreen} />
    <Stack.Screen name="Inbox"       component={NotificationsScreen} />
    <Stack.Screen name="Circulars"   component={CircularsScreen} />
  </Stack.Navigator>
);

export default TeacherNavigator;
