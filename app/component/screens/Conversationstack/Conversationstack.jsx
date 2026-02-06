import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import Conversation from './Conversation';
import Messages from './Messages';

const Stack = createNativeStackNavigator();

const ConversationStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="ConversationList"
     screenOptions={{ headerShown: false }}
    >

        
     
      <Stack.Screen 
        name="ConversationList" 
        component={Conversation} 
        
      />

      {/* The actual chat thread */}
      <Stack.Screen 
        name="Message" 
        component={Messages} 
       
      />

    
    </Stack.Navigator>
  );
};

export default ConversationStack;