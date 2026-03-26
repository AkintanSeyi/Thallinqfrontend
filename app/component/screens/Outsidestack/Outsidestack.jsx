import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

const Outsidestack = () => {
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
          } else if (route.name === 'Conversation') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: focused ? '#1E2035' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={iconName}
                size={26}
                color={focused ? '#FFFFFF' : '#999'}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Landingpage">
        {(props) => <HomePageStack {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Tab.Screen>

      <Tab.Screen name="Groups" component={GroupStack} />
      <Tab.Screen name="Conversation" component={Conversationstack} />

    </Tab.Navigator>
  )
}

export default Outsidestack

const styles = StyleSheet.create({})