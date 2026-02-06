import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import your pages
import PrivacyAndSecurity from './PrivacyAndSecurity';
import ChangePassword from './Changepassword'; // Create this file
import Blockeduser from './Blockeduser';
// import BlockedUsers from './BlockedUsers'; // Create this file later

const Stack = createStackNavigator();

const PrivacyAndSecurityStack = ({setIsLoggedIn}) => {
  return (
    <Stack.Navigator 
      initialRouteName="PrivacyMain"
      screenOptions={{ 
        headerShown: false,
        // Optional: Add a slide animation
        gestureEnabled: true 
      }}
    >
      
        <Stack.Screen name="PrivacyMain">
              {(props) => <PrivacyAndSecurity {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
      <Stack.Screen name="ChangePassword" component={ChangePassword} />

      <Stack.Screen name="BlockedUsers" component={Blockeduser} /> 
    </Stack.Navigator>
  );
};

export default PrivacyAndSecurityStack;