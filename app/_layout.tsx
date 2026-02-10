import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0b1220' },
          headerTitleStyle: { color: '#fff', fontWeight: '700' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#0b1220' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: 'Scan Coin' }} />
        <Stack.Screen name="coin/[id]" options={{ title: 'Coin Details' }} />
      </Stack>
    </QueryClientProvider>
  );
}
