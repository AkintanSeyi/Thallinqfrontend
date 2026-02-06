import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const axiosInstance = axios.create({
  // Use your production URL or your local IP for testing on physical devices
  baseURL: "http://192.168.122.160:5000",   //http://192.168.51.160:5000   //https://tlbackend.onrender.com
 
});

// Use async/await inside the interceptor for AsyncStorage
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error fetching token", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Auth routes
export const login = (formdata) => axiosInstance.post("/api/auth/login", formdata);
export const signup = (formdata) => axiosInstance.post("/api/auth/signup", formdata);
export const completeProfile = (formData) => axiosInstance.patch("/api/auth/complete-profile", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const sendOTP = (email) => axiosInstance.post("/api/auth/send-otp", { email });
export const verifyOTP = (email, otp) => axiosInstance.post("/api/auth/verify-otp", { email, otp });
export const generateResetCode = (email) => axiosInstance.post("/api/auth/generate-reset", { email });
export const verifyResetCode = (email, code) => axiosInstance.post("/api/auth/verify-reset", { email, code });
export const resetPassword = (email, code, newpassword) => axiosInstance.post("/api/auth/reset-password", { email, code, newpassword });
// Groups
// api/index.js

// api/index.js
// api/index.js
export const createGroup = (formData) => {
  return axiosInstance.post("/api/create-group", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: (data) => data, // This is key for React Native
  });
};
export const getLatestGroups = () => axiosInstance.get("/api/latest-groups");

// api/index.js
export const getGroups = (page, category, search) => {
  // This builds the URL: /api/all-groups?page=1&category=Social&search=club
  return axiosInstance.get(`/api/all-groups`, {
    params: {
      page,
      category,
      search
    }
  });
};

export const getUserProfile = (email) => axiosInstance.get(`/api/auth/user-profile/${email}`); 
export const getBlockedUsers = (email) => axiosInstance.get(`/api/blocked-users/${email}`);
export const getGroupDetails = (id) => axiosInstance.get(`/api/group-details/${id}`);
export const toggleMembership = (data) => axiosInstance.post(`/api/toggle-membership`, data);
export const getUserPublicProfile = (userId) => axiosInstance.get(`/api/user-profile/${userId}`);
// Ensure 'data' is the second argument for POST requests
export const blockUser = (data) => axiosInstance.post(`/api/block-user`, data);
export const unblockUser = (data) => axiosInstance.post('/api/unblock-user', data);
export const getMyMemberships = (email, page = 1) => 
  axiosInstance.get(`/api/user-memberships/${email}?page=${page}`);

export const updatePrivacy = (data) => axiosInstance.put('/api/update-privacy', data);
export const updateProfile = (formData) => axiosInstance.patch("/api/auth/edit-profile", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

export const removeUserFromGroup = (groupId, adminId, targetUserId) => 
  axiosInstance.delete(`/api/${groupId}/remove-user/${adminId}/${targetUserId}`);
export const updateGroup = (groupId, userId, formData) => 
  axiosInstance.put(`/api/update-group/${groupId}/${userId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Fetch all posts for a specific group
export const getGroupPosts = (groupId, userId) => 
  axiosInstance.get(`/api/groups/${groupId}/posts?userId=${userId}`);
export const getUserNotifications = (userId) => axiosInstance.get(`/api/notifications/${userId}`);
export const deleteGroup = (groupId, userId) => axiosInstance.delete(`/api/delete-group/${groupId}/${userId}`);

// Create a new post
export const toggleGroupNotifications = (groupId, userId) => axiosInstance.patch(`/api/notifications/${groupId}/notifications`, { userId });
export const createPost = (data) => axiosInstance.post('/api/groups/create-post', data);

// Toggle Like (Like/Unlike logic handled by one endpoint)
export const toggleLikePost = (postId, userId) => axiosInstance.post(`/api/groups/posts/like`, { postId, userId });

// Add a comment
export const addComment = (data) => axiosInstance.post('/api/groups/posts/comment', data);
export const deleteComment = (postId, commentId, userId) => 
  axiosInstance.delete(`/api/groups/${postId}/comments/${commentId}`, { data: { userId } });

export const changePassword = (data) => axiosInstance.post(`/api/auth/change-password`, data);

export const deletePost = (postId, userId) => axiosInstance.delete(`/api/groups/${postId}`, { data: { userId } });

export const sendMessage = (formData) => 
  axiosInstance.post(`/api/message/messages`, formData, {
    headers: { 
      "Content-Type": "multipart/form-data" 
    }
    
  });

  
export const getMessages = (conversationId) => 
  axiosInstance.get(`/api/message/messages/${conversationId}`);

// Mark messages as read
export const markAsRead = (data) => 
  axiosInstance.patch(`/api/message/messages/read`, data);

// Example in your api/index.js
export const createConversation = (data) => axiosInstance.post('/api/message/conversations', data);

export const getConversations = (userId) => axiosInstance.get(`/api/message/conversations/${userId}`);
export const deleteAccount = (email) => axiosInstance.post('/api/auth/delete-account', { email });
export const getGroupAnalytics = (groupId) => axiosInstance.get(`/api/groups/${groupId}/analytics`);

export const createPaymentIntent = (data) => axiosInstance.post('/api/payments/create-intent', data);
export const verifyPaymentAndJoin = (data) => axiosInstance.post('/api/payments/verify-and-join', data);