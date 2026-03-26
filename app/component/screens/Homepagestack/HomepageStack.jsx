import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// Import your pages
import HomePage from "./Homepage";

import GroupDetail from "./GroupDetail"; // Create this to show specific group info
import Notification from "../Profilepages.jsx/Notification";
import Viewuserdetails from "./Viewuserdetails";
import EditProfile from "../Profilepages.jsx/Editprofile";
import Postingroup from "./Postingroup";
import EditGroup from "./EditGroup";
import Messages from "../Conversationstack/Messages";
import Adminview from "./Adminview";
import Joinstream from "./Joinstream";
import LiveStream from "./LiveStream";
import Explorestreampage from "./Explorestreampage";

const Stack = createStackNavigator();

const HomePageStack = ({ setIsLoggedIn }) => {
  return (
    <Stack.Navigator
      initialRouteName="HomeMain"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="HomeMain">
        {(props) => <HomePage {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
      <Stack.Screen name="GroupDetail" component={GroupDetail} />
      <Stack.Screen name="Message" component={Messages} />
      <Stack.Screen name="EditGroup" component={EditGroup} />
      <Stack.Screen name="Viewuserdetails" component={Viewuserdetails} />
      <Stack.Screen name="Adminview" component={Adminview} />
      <Stack.Screen name="Postingroup" component={Postingroup} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="Notification" component={Notification} />
      <Stack.Screen name="Joinstreams" component={Joinstream} />
      <Stack.Screen name="LiveStream" component={LiveStream} />
      <Stack.Screen name="Explorestreampage" component={Explorestreampage} />
    </Stack.Navigator>
  );
};

export default HomePageStack;
