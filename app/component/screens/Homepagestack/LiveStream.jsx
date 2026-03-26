import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Text, 
  PermissionsAndroid, 
  Platform 
} from 'react-native';
import { 
  createAgoraRtcEngine, 
  ChannelProfileType, 
  ClientRoleType, 
  RtcSurfaceView 
} from 'react-native-agora';
import { Ionicons } from "@expo/vector-icons";
import * as api from "../../../../api/index";

const appId = "3b55520bc2c74fdc9d90a84694a80002";

const LiveStream = ({ route, navigation }) => {
  const { groupId, token, channelName, uid, role, currentUserId } = route.params;
  
  const engine = useRef(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);

  useEffect(() => {
    const init = async () => {
      const hasPermissions = await requestPermissions();
      if (hasPermissions) {
        setupAgora();
      } else {
        Alert.alert("Permissions Denied", "Camera and Mic are required to stream.");
        navigation.goBack();
      }
    };
    init();

    return () => {
      leaveAndCleanup();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const grants = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      return (
        grants['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
        grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true; // iOS permissions are usually handled via Info.plist and triggered on enableVideo
  };

  const leaveAndCleanup = async () => {
    if (role === 'broadcaster') {
      try {
        await api.stopGroupLive(groupId, currentUserId);
      } catch (e) {
        console.error("Error stopping live in DB", e);
      }
    }
    engine.current?.leaveChannel();
    engine.current?.release();
  };

  const setupAgora = async () => {
    try {
      engine.current = createAgoraRtcEngine();
      engine.current.initialize({ appId });

      engine.current.registerEventHandler({
        onJoinChannelSuccess: (connection, uid) => {
          console.log("Successfully joined:", uid);
          setJoined(true);
        },
        onUserJoined: (connection, remoteUid) => {
          console.log("Remote user joined:", remoteUid);
          setRemoteUid(remoteUid);
        },
        onUserOffline: () => {
          Alert.alert("Stream Ended", "The broadcaster has left.");
          navigation.goBack();
        },
        onError: (err) => console.error("Agora Error", err)
      });

      engine.current.enableVideo();
      engine.current.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);

      engine.current.setClientRole(
        role === 'broadcaster' 
          ? ClientRoleType.ClientRoleBroadcaster 
          : ClientRoleType.ClientRoleAudience
      );

      // CRITICAL: Ensure UID is a Number, not a String
      const numericUid = Number(uid) || 0;
      engine.current.joinChannel(token, channelName, numericUid, {});
      
    } catch (e) {
      console.error("Agora Setup Error", e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Loading State */}
      {!joined && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Connecting to Stream...</Text>
        </View>
      )}

      {/* Video Rendering */}
      {joined && (
        role === 'broadcaster' ? (
          <RtcSurfaceView 
            style={styles.fullVideo} 
            canvas={{ uid: 0 }} 
          />
        ) : (
          remoteUid ? (
            <RtcSurfaceView 
              style={styles.fullVideo} 
              canvas={{ uid: remoteUid }} 
            />
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.loadingText}>Waiting for broadcaster...</Text>
            </View>
          )
        )
      )}
      
      {/* UI Controls */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  fullVideo: { 
    flex: 1 
  },
  loading: { 
    ...StyleSheet.absoluteFill, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)'
  },
  loadingText: { 
    color: 'white', 
    marginTop: 15,
    fontSize: 16 
  },
  closeBtn: { 
    position: 'absolute', 
    top: 50, 
    right: 20, 
    padding: 10, 
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25
  }
});

export default LiveStream;