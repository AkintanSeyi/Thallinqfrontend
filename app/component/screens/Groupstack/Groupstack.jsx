import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Groups from '../Groups';
import GroupDetail from '../Homepagestack/GroupDetail'; 
import PostGroup from '../Homepagestack/PostGroup';

const Stack = createStackNavigator();



const GroupStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Groups" component={Groups} />
      <Stack.Screen name="GroupDetail" component={GroupDetail} />
        <Stack.Screen name="CreateGroup" component={PostGroup} />
    </Stack.Navigator>
  );
};

export default GroupStack;