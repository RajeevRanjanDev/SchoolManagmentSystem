import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { restoreSession } from '@store/slices/authSlice';
import { getUser, getAccessToken } from '@utils/storage';
import { AuthUser } from '@app-types/index';

// Navigators
import TabNavigator from './TabNavigator';
import TeacherNavigator from './TeacherNavigator';
import StudentNavigator from './StudentNavigator';
import AdminNavigator from './AdminNavigator';
import SupportNavigator from './SupportNavigator';
import FinanceNavigator from './FinanceNavigator';
import TransportNavigator from './TransportNavigator';
import { isTeacher, isStudent, isAdmin, isSupport, isFinance, isTransport } from '@utils/roles';

// Auth screens
import LoginScreen from '@screens/auth/LoginScreen';

// Feature screens
import HomeworkScreen    from '@screens/homework/HomeworkScreen';
import ClassworkScreen   from '@screens/classwork/ClassworkScreen';
import TimetableScreen   from '@screens/timetable/TimetableScreen';
import CircularScreen    from '@screens/circular/CircularScreen';
import EventGalleryScreen from '@screens/events/EventGalleryScreen';
import ResultsScreen     from '@screens/results/ResultsScreen';
import FeePaymentScreen  from '@screens/fees/FeePaymentScreen';
import BusTrackingScreen from '@screens/bus/BusTrackingScreen';
import LibraryScreen     from '@screens/library/LibraryScreen';
import ChildTeachersScreen from '@screens/teachers/ChildTeachersScreen';
import ChildAnnouncementsScreen from '@screens/announcements/ChildAnnouncementsScreen';
import SplashScreen      from '@screens/splash/SplashScreen';

import { AuthStackParams, RootStackParams } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const RootStack = createNativeStackNavigator<RootStackParams>();

// â”€â”€ Root stack â€” wraps tabs + all feature screens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const RootNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Tabs"         component={TabNavigator} />
    <RootStack.Screen name="Homework"     component={HomeworkScreen} />
    <RootStack.Screen name="Classwork"    component={ClassworkScreen} />
    <RootStack.Screen name="Timetable"    component={TimetableScreen} />
    <RootStack.Screen name="Circulars"    component={CircularScreen} />
    <RootStack.Screen name="EventGallery" component={EventGalleryScreen} />
    <RootStack.Screen name="Results"      component={ResultsScreen} />
    <RootStack.Screen name="FeePayment"   component={FeePaymentScreen} />
    <RootStack.Screen name="FeeHistory"   component={() => null as any} />
    <RootStack.Screen name="BusTracking"  component={BusTrackingScreen} />
    <RootStack.Screen name="Library"      component={LibraryScreen} />
    <RootStack.Screen name="ChildTeachers" component={ChildTeachersScreen} />
    <RootStack.Screen name="ChildAnnouncements" component={ChildAnnouncementsScreen} />
    <RootStack.Screen name="StudentDetail" component={() => null as any} />
  </RootStack.Navigator>
);

// â”€â”€ Main app navigator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const user = await getUser<AuthUser>();
          if (user) dispatch(restoreSession(user));
        }
      } catch {
        // No session saved
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, [dispatch]);

  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        isAdmin(user?.roles) ? (
          <AdminNavigator />
        ) : isSupport(user?.roles) ? (
          <SupportNavigator />
        ) : isFinance(user?.roles) ? (
          <FinanceNavigator />
        ) : isTransport(user?.roles) ? (
          <TransportNavigator />
        ) : isTeacher(user?.roles) ? (
          <TeacherNavigator />
        ) : isStudent(user?.roles) ? (
          <StudentNavigator />
        ) : (
          <RootNavigator />
        )
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
