import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useColorScheme, Alert, View } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';


// --- ADD THIS IMPORT ---
import * as SplashScreen from 'expo-splash-screen';

import BottomTabs from './app/component/BottomTabs';
import AuthNavigator from './app/component/AuthNavigator';

// --- ADD THIS LINE (Must be outside the component) ---
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const prepareApp = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsLoggedIn(!!token);

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery permissions are needed!');
        }
      } catch (e) {
        console.warn(e);
      } finally {
        // We set loading to false, but we don't hide the splash yet
        setIsLoading(false);
      }
    };

    prepareApp();
  }, []);

  // --- ADD THIS FUNCTION ---
  // This hides the splash only once the actual UI has finished its first "paint"
  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) return null;

  return (
    /* Wrap everything in a View with onLayout to trigger the hide */
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