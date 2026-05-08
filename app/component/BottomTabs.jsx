import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

// Import your screens
import ProfileStack from './screens/Profilestackpages';
import GroupStack from './screens/Groupstack/Groupstack';
import HomePageStack from './screens/Homepagestack/HomepageStack';
import Conversationstack from './screens/Conversationstack/Conversationstack';
import Postmoments from './screens/Postmoments'; // Import your new screen

const Tab = createBottomTabNavigator();

export default function BottomTabs({ setIsLoggedIn }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#0B0C1B',
          height: 85,
          borderTopWidth: 0,
          paddingBottom: 10,
        },
        tabBarIcon: ({ focused }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Post') {
            iconName = 'add'; // The plus sign
          } else if (route.name === 'Conversation') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // Special styling for the middle Plus button
          const isPost = route.name === 'Post';

          return (
            <View
              style={{
                width: isPost ? 55 : 50,
                height: isPost ? 55 : 50,
                borderRadius: isPost ? 28 : 25,
                backgroundColor: isPost ? '#6366F1' : (focused ? '#1E2035' : 'transparent'),
                justifyContent: 'center',
                alignItems: 'center',
                // Optional: lift the plus button slightly
                marginBottom: isPost ? 10 : 0, 
                elevation: isPost ? 5 : 0,
                shadowColor: isPost ? '#6366F1' : 'transparent',
                shadowOpacity: isPost ? 0.4 : 0,
                shadowRadius: 5,
              }}
            >
              <Ionicons
                name={iconName}
                size={isPost ? 32 : 26}
                color="#FFFFFF"
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home">
        {(props) => <HomePageStack {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>

      <Tab.Screen name="Groups" component={GroupStack} />

      {/* --- The New Plus Button --- */}
      <Tab.Screen name="Post" component={Postmoments} />

      <Tab.Screen name="Conversation" component={Conversationstack} />

      <Tab.Screen name="Profile">
        {(props) => <ProfileStack {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}