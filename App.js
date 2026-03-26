import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback, useRef } from 'react'; 
import { useColorScheme, Alert, View, Platform } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import BottomTabs from './app/component/BottomTabs';
import AuthNavigator from './app/component/AuthNavigator';

// ✅ 1. CRITICAL: This MUST be uncommented to show banners while app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

SplashScreen.preventAutoHideAsync();
const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Check Login Status
        const token = await AsyncStorage.getItem('token');
        setIsLoggedIn(!!token);

        // Request Media Permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery permissions are needed!');
        }

        // ✅ NOTE: Registration is now handled in HomePage.js to ensure we have the userId
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    };

    prepareApp();

    // ✅ 2. Listeners to confirm notifications are arriving
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification Received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("User tapped on notification:", response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isLoggedIn ? (
            <Stack.Screen name="Auth">
              {(props) => (
                <AuthNavigator 
                  {...props} 
                  isLoggedIn={isLoggedIn} 
                  setIsLoggedIn={setIsLoggedIn} 
                />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="MainTabs">
              {(props) => <BottomTabs {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </NavigationContainer>
    </View>
  );
}