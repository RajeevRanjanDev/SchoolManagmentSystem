import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { hydrateAuthThunk } from '../store/slices/authSlice';
import { useNotifications } from '../hooks/useNotifications';
import { AuthNavigator } from './AuthNavigator';
import { AdminNavigator } from './AdminNavigator';
import { TeacherNavigator } from './TeacherNavigator';
import { AccountantNavigator } from './AccountantNavigator';
import { LibrarianNavigator } from './LibrarianNavigator';
import { TransportNavigator } from './TransportNavigator';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { RoleName } from '../types';

function getRoleNavigator(roles: RoleName[]) {
  if (roles.includes('SUPER_ADMIN') || roles.includes('SCHOOL_ADMIN')) return AdminNavigator;
  if (roles.includes('TEACHER')) return TeacherNavigator;
  if (roles.includes('ACCOUNTANT')) return AccountantNavigator;
  if (roles.includes('LIBRARIAN')) return LibrarianNavigator;
  if (roles.includes('TRANSPORT_MANAGER')) return TransportNavigator;
  return null;
}

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector(s => s.auth);

  // Register FCM device on login
  useNotifications(user?.id);

  useEffect(() => {
    // Try to restore session from SecureStorage on app launch
    dispatch(hydrateAuthThunk());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  const roles = (user?.roles ?? []) as RoleName[];
  const AppNavigator = getRoleNavigator(roles);

  if (!AppNavigator) {
    // Unknown role — send back to login
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
