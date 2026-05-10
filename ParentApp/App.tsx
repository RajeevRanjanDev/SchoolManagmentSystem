/**
 * SMS Parent App — Root component.
 *
 * Wires up:
 *  - Redux store (global state)
 *  - React Query (server-state + caching)
 *  - Safe area provider (notch / home bar handling)
 *  - Toast messages
 *  - Navigation
 *  - Push notifications
 */
import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { store } from '@store/index';
import AppNavigator from '@navigation/AppNavigator';
import { Colors } from '@constants/colors';

// React Query client — 5 min stale time, 2 retries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar
            barStyle="light-content"
            backgroundColor={Colors.primaryDark}
            translucent
          />
          <AppNavigator />
          <Toast />
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  </GestureHandlerRootView>
);

export default App;
