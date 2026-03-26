// ./app/navigation/AuthNavigator.js

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import the components used in the Auth flow
import SignIn from "../component/Auth/Sigin"; // Assuming these imports need relative paths
import SignUp from "../component/Auth/Signup"; // Assuming these imports need relative paths
import SocialPartyPlatform from "./screens/Outsidestack/Dashboard"; // Assuming Dashboard is the component you want as the root
import Completeprofilescreen from "./Auth/Completeprofilescreen";
import OTP from "./Auth/OTP";
import VerifyFPotpADChnagepw from "./Auth/VerifyFPotpADChnagepw";
import SendEmailOtpforgetpassword from "./Auth/SendEmailOtpforgetpassword";
import HomePageStack from "./screens/Homepagestack/HomepageStack";
import TermsCondition from "./Auth/TermsCondition";
import Privatepolicy from "./Auth/Privatepolicy";
import BottomTabs from "./BottomTabs";

const AuthStack = createNativeStackNavigator();

const AuthNavigator = ({ setIsLoggedIn, isLoggedIn }) => {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false }}
      // --- MODIFICATION: Set Dashboard as the initial route ---
      initialRouteName="MainTabs"
    >
      {/* The order of definition doesn't matter when initialRouteName is set, 
        but placing the root screen first is good practice.
      */}
      <AuthStack.Screen name="MainTabs">
        {(props) => (
          <BottomTabs
                {...props}
            setIsLoggedIn={setIsLoggedIn}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Home" component={HomePageStack} />

      <AuthStack.Screen name="SignIn">
        {(props) => (
          <SignIn
            {...props}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="SignUp">
        {(props) => (
          <SignUp
            {...props}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Completeprofile">
        {(props) => (
          <Completeprofilescreen
            {...props}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="OTP">
        {(props) => (
          <OTP
            {...props}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Verify" component={VerifyFPotpADChnagepw} />
      <AuthStack.Screen name="terms&condition" component={TermsCondition} />
      <AuthStack.Screen name="privatepolicy" component={Privatepolicy} />
      <AuthStack.Screen
        name="SendEmail"
        component={SendEmailOtpforgetpassword}
      />
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
