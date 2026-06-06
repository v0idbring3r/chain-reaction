import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types/navigation.types';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameSetupScreen } from './src/screens/GameSetupScreen';
import { GameScreen } from './src/screens/GameScreen';
import { WinScreen } from './src/screens/WinScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { THEME } from './src/utils/colors';
import { loadSounds } from './src/utils/sounds';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    loadSounds();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: THEME.background },
          animation: 'none',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Setup" component={GameSetupScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Win" component={WinScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
