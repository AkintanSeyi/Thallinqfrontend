import { createStackNavigator } from '@react-navigation/stack';
import ProfilePage from './ProfilePage';
import PersonalInfo from './Profilepages.jsx/Personalinfo'; // Ensure the filename matches
import Notification from './Profilepages.jsx/Notification';
import PrivacyAndSecurity from './Profilepages.jsx/PrivacyAndSecurity/PrivacyAndSecurity';
import HelpCenter from './Profilepages.jsx/HelpCenter';
import PrivacyAndSecurityStack from './Profilepages.jsx/PrivacyAndSecurity/PrivacyAndSecurityStack';
import Editprofile from './Profilepages.jsx/Editprofile';
import GroupsUserBelong from './Profilepages.jsx/GroupsUserBelong';
import GroupDetail from './Homepagestack/GroupDetail';
import Viewuserdetails from './Homepagestack/Viewuserdetails';
import Postingroup from './Homepagestack/Postingroup';
import Messages from './Conversationstack/Messages';
import EditGroup from './Homepagestack/EditGroup';
import Adminview from './Homepagestack/Adminview';


const Stack = createStackNavigator();

const ProfileStack = ({setIsLoggedIn}) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
   
        <Stack.Screen name="ProfileMain">
        {(props) => <ProfilePage {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
      <Stack.Screen name="PersonalInfo" component={PersonalInfo} />
        <Stack.Screen name="Notification" component={Notification} />

           <Stack.Screen name="Privacy">
        {(props) => <PrivacyAndSecurityStack {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
           <Stack.Screen name="HelpCenter" component={HelpCenter} />
                  <Stack.Screen name="EditProfile" component={Editprofile} />
                   <Stack.Screen name="MyGroups" component={GroupsUserBelong} />
                     <Stack.Screen name="Viewuserdetails" component={Viewuserdetails} />
                        <Stack.Screen name="GroupDetail" component={GroupDetail} />
                            <Stack.Screen name="Postingroup" component={Postingroup} />
   <Stack.Screen name="Message" component={Messages} />
   <Stack.Screen name="EditGroup" component={EditGroup} />
           <Stack.Screen name="Adminview" component={Adminview} />
       
      {/* Add Notifications or Privacy screens here later */}
    </Stack.Navigator>
  );
};

export default ProfileStack;