import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Ensure you have this installed

// Import your screens
import HomePage from './screens/Homepagestack/Homepage';

import Groups from './screens/Groups';
import ProfilePage from "./screens/ProfilePage";
import ProfileStack from './screens/Profilestackpages';
import GroupStack from './screens/Groupstack/Groupstack';
import HomePageStack from './screens/Homepagestack/HomepageStack';
import Conversationstack from './screens/Conversationstack/Conversationstack';

const Tab = createBottomTabNavigator();

export default function BottomTabs({setIsLoggedIn}) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF4A57',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { 
          backgroundColor: '#0B0C1B', 
          height: 85, 
          paddingBottom: 10,
          borderTopWidth: 0 
        },         
        // Function to define the icon for each tab
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Conversation') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
    
  <Tab.Screen name="Home">
  {(props) => <HomePageStack {...props} setIsLoggedIn={setIsLoggedIn} />}
</Tab.Screen>
      <Tab.Screen name="Groups" component={GroupStack} />
            <Tab.Screen name="Conversation" component={Conversationstack} />
     
        <Tab.Screen name="Profile">
  {(props) => <ProfileStack {...props} setIsLoggedIn={setIsLoggedIn} />}
</Tab.Screen>
    </Tab.Navigator>
  );
}
