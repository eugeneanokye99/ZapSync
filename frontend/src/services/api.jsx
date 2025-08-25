import axios from "axios";

const BASE_URL = "http://localhost:5000/api"; 
// const BASE_URL = "https://zapsync.onrender.com/api";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("zapsync_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access (e.g., logout user)
      localStorage.removeItem("zapsync_token");
      // You might want to redirect to login page here
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Function to register a new user
export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
};

export const loginUser = async (email, password, latitude, longitude) => {
  try {
    // Fetch IP, city, and country using ipapi
    const locationRes = await axios.get("https://ipapi.co/json/");
    const { ip, country_name, city, region } = locationRes.data;

    const response = await api.post("/auth/login/", {
      email,
      password,
      latitude,
      longitude,
      ip_address: ip,
      country: country_name,
      city: region + ", " + city,
    });

    return response.data;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const googleLogin = async (googleToken, latitude, longitude) => {
  try {
    // Fetch IP, city, and country using ipapi
    const locationRes = await axios.get("https://ipapi.co/json/");
    const { ip, country_name, city, region } = locationRes.data;
    const response = await api.post("/google-login/", {
      token: googleToken,
      latitude,
      longitude,
      ip_address: ip,
      country: country_name,
      city: region + ", " + city,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to log out a user
export const logoutUser = () => {
  localStorage.removeItem("zapsync_token"); 
};


export const uploadFile = async (file, description) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", description);

  const response = await api.post("/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getFiles = async () => {
  try {
    const response = await api.get("/files/all");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchFiles = async (query) => {
  try {
    const response = await api.get(`/files/search/?q=${query}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStorageUsage = async () => {
  try {
    const response = await api.get("/storage/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  } catch (error) {
    console.error("Update Profile Error:", error);
    throw error;
  }
};



export const createFolder = async (folderData) => {
  const response = await api.post('/folders/create', folderData);
  return response.data;
};

export const uploadFilesToFolder = async (folderId, files) => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files[]', file);  // Changed from files[index] to files[]
  });

  const response = await api.post(`/folders/${folderId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getFolders = async () => {
  try {
    const response = await api.get("/folders/all");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Group-related API functions
export const getAvailableGroups = async () => {
  try {
    const response = await api.get('/groups/available');
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || error.message;
  }
};

export const joinGroupWithToken = async (token) => {
  try {
    const response = await api.post('/groups/join', { token });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || error.message;
  }
};

export const joinGroup = async (groupId) => {
  try {
    const response = await api.post(`/groups/${groupId}/join`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || error.message;
  }
};

// Add to your existing api.js
export const getAnalytics = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    throw error;
  }
};



export const smartSearch = async (query) => {
  try {
    const response = await api.post('/search/smart', {
      query: query
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Smart Search Error:", error);
    throw error;
  }
};



export const activateStar = async (id, type, isStarred) => {
  try {
    const response = await api.patch('/starred/', {
      id,
      type,
      isStarred
    });
    return response.data;
  } catch (error) {
    console.error("failed to toggle star:", error);
  }
};

export const checkForStarred = async (id, type) => {
  try {
    const response = await api.get(`/starred/${id}/${type}`, {
      id,
      type,
    });
    return response.data;
  } catch (error) {
    console.error("failed to toggle star:", error);
  }
};

export const getStarred = async () => {
  try {
    const response = await api.get('/starred/get');
    return response.data;
  } catch (error) {
    console.error("failed to get all starred:", error);
  }
};

export const moveToTrash = async (id, type) => {
  try {
    const response = await api.put('/trash/move', {
      id,
      type
    });
    return response.data;
  } catch (error) {
    console.error("failed to move to trash:", error);
  }
};

export const getTrash = async () => {
  try {
    const response = await api.get('/trash/all');
    return response.data;
  } catch (error) {
    console.error("failed to get all trash:", error);
  }
};

export const restoreFromTrash = async (id, type) => {
  try {
    const response = await api.put(`/${type}s/${id}/restore`);
    return response.data;
  } catch (error) {
    console.error(`Failed to restore ${type}:`, error);
    throw error;
  }
};

export const permanentlyDelete = async (id, type) => {
  try {
    const response = await api.delete(`/${type}s/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to permanently delete ${type}:`, error);
    throw error;
  }
};

export const emptyTrash = async () => {
  try {
    const response = await api.delete('/trash/empty');
    return response.data;
  } catch (error) {
    console.error("Failed to empty trash:", error);
    throw error;
  }
};

export const getTrashExpiration = async () => {
  try {
    const response = await api.get('/trash/expiration');
    return response.data;
  } catch (error) {
    console.error("Failed to get trash expiration:", error);
    throw error;
  }
};
