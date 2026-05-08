import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Groups from "../Groups";
import GroupDetail from "../Homepagestack/GroupDetail";
import PostGroup from "../Homepagestack/PostGroup";
import Profileview from "../Profileview";
import MomentDetail from "../MomentDetail";
import EditGroup from "../Profilepages.jsx/Editprofile";
import Message from "../Conversationstack/Messages";
import EditProfile from "../Profilepages.jsx/Editprofile";
import Settingshow from "../Profilepages.jsx/Settingshow";

const Stack = createStackNavigator();

const GroupStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Groups" component={Groups} />
      <Stack.Screen name="GroupDetail" component={GroupDetail} />
      <Stack.Screen name="CreateGroup" component={PostGroup} />
      <Stack.Screen name="Profileview" component={Profileview} />
      <Stack.Screen name="MomentDetail" component={MomentDetail} />
      <Stack.Screen name="EditGroup" component={EditGroup} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="Message" component={Message} />
       <Stack.Screen name="Settings" component={Settingshow} />
    </Stack.Navigator>
  );
};

export default GroupStack;
