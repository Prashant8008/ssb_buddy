/**
 * SSB Connect — Centralized API Service Layer
 * All backend calls go through this file.
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── JWT: attach access token to every request ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── JWT: auto-refresh on 401 ────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', res.data.access);
        orig.headers.Authorization = `Bearer ${res.data.access}`;
        return api(orig);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Feed / Posts (MongoDB) ──────────────────────────────────────────────────
export const FeedService = {
  getPosts: (page = 1, options?: { postType?: string; feed?: 'all' | 'friends' }) =>
    api.get('/posts/', {
      params: {
        page,
        feed: options?.feed ?? 'all',
        ...(options?.postType ? { post_type: options.postType } : {}),
      },
    }),
  createPost: (data: {
    body: string;
    title?: string;
    post_type?: string;
    image_url?: string;
    video_url?: string;
    document_url?: string;
  }) => api.post('/posts/', data),
  likePost: (id: string) => api.post(`/posts/${id}/like/`),
  savePost: (id: string) => api.post(`/posts/${id}/save/`),
  getComments: (postId: string) => api.get(`/posts/${postId}/comments/`),
  addComment: (postId: string, body: string) =>
    api.post('/comments/', { post_id: postId, body }),
  deletePost: (id: string) => api.delete(`/posts/${id}/`),
};

// ── Auth ────────────────────────────────────────────────────────────────────
export const AuthService = {
  me: () => api.get('/users/me/'),
  updateMe: (data: { first_name?: string; last_name?: string; email?: string }) =>
    api.patch('/users/me/', data),
  logout: async () => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      if (refresh) {
        await api.post('/auth/token/blacklist/', { refresh });
      }
    } catch {
      // Clear local session even if blacklist fails (expired/invalid token)
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  },
};

// ── Profile ──────────────────────────────────────────────────────────────────
export const ProfileService = {
  getMe: () => api.get('/profiles/me/'),
  updateMe: (data: any) => api.patch('/profiles/me/', data),
  getByUsername: (username: string) => api.get(`/profiles/u/${username}/`),
  getConnectionStatus: (username: string) => api.get(`/profiles/u/${username}/connection/`),
  discover: (params?: { search?: string; city?: string; entry_type?: string; page?: number }) =>
    api.get('/profiles/', { params }),
  getUserPosts: (userId: number, page = 1) =>
    api.get('/posts/', { params: { author: userId, page } }),
};

// ── Network (follow & friend requests) ───────────────────────────────────────
export const NetworkService = {
  getFriendRequests: (status?: string) =>
    api.get('/friend-requests/', { params: status ? { status } : {} }),
  sendFriendRequest: (toUserId: number) =>
    api.post('/friend-requests/', { to_user_id: toUserId }),
  respondToFriendRequest: (id: number, status: 'ACCEPTED' | 'DECLINED') =>
    api.post(`/friend-requests/${id}/respond/`, { status }),
  getFriends: () => api.get('/friend-requests/friends/'),
  toggleFollow: (userId: number) => api.post('/follows/toggle/', { user_id: userId }),
};

// ── AI Features ─────────────────────────────────────────────────────────────
export const AIService = {
  evaluatePPDT: (params: { story?: string; context?: string; storyImage?: File | null }) => {
    const form = new FormData();
    if (params.story) form.append('story', params.story);
    if (params.context) form.append('context', params.context);
    if (params.storyImage) form.append('story_image', params.storyImage);
    return api.post('/ai/ppdt-evaluator/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  evaluateTAT: (params: { story?: string; context?: string; storyImage?: File | null }) => {
    const form = new FormData();
    if (params.story) form.append('story', params.story);
    if (params.context) form.append('context', params.context);
    if (params.storyImage) form.append('story_image', params.storyImage);
    return api.post('/ai/tat-evaluator/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  evaluateWAT: (items: { prompt: string; response: string }[]) =>
    api.post('/ai/wat-evaluator/', { items }),
  evaluateSRT: (items: { prompt: string; response: string }[]) =>
    api.post('/ai/srt-evaluator/', { items }),
  getInterviewFeedback: (transcript: string) =>
    api.post('/ai/interview-coach/', { transcript }),
};

// ── SSB Practice (PPDT / TAT images) ────────────────────────────────────────
export const PracticeService = {
  getRandomPrompt: (type: 'PPDT' | 'TAT' | 'WAT' | 'SRT') =>
    api.get('/practice-prompts/random/', { params: { type } }),
  getRandomSet: (type: 'WAT' | 'SRT', count = 10) =>
    api.get('/practice-prompts/random_set/', { params: { type, count } }),
  getImageStats: () => api.get('/practice-prompts/stats/'),
  saveSubmission: (data: {
    practice_type: string;
    prompt?: number | null;
    response: string;
    metadata?: Record<string, unknown>;
    evaluation?: Record<string, unknown>;
  }) => api.post('/practice-submissions/', data),
  getMySubmissions: (practiceType?: string) =>
    api.get('/practice-submissions/', {
      params: practiceType ? { practice_type: practiceType } : {},
    }),
};

export const AIMentorService = {
  sendMessage: (module: string, message: string, history: any[]) =>
    api.post('/ai/mentor/', { module, message, history }),
};

// ── Groups ──────────────────────────────────────────────────────────────────
export const GroupService = {
  list: (params?: { search?: string; category?: string }) =>
    api.get('/groups/', { params }),
  create: (data: {
    name: string;
    slug: string;
    description?: string;
    category: string;
    city?: string;
    state?: string;
    is_private?: boolean;
  }) => api.post('/groups/', data),
  join: (groupId: number) => api.post(`/groups/${groupId}/join/`),
  myMemberships: () => api.get('/group-members/'),
};

// ── Events ──────────────────────────────────────────────────────────────────
export const EventService = {
  list: (params?: { search?: string; event_type?: string; ordering?: string }) =>
    api.get('/events/', { params }),
  create: (data: {
    title: string;
    description?: string;
    event_type: string;
    starts_at: string;
    ends_at?: string;
    city?: string;
    state?: string;
    online_url?: string;
  }) => api.post('/events/', data),
  rsvp: (eventId: number, status = 'GOING') =>
    api.post(`/events/${eventId}/rsvp/`, { status }),
  myRsvps: () => api.get('/rsvps/'),
};

// ── Fitness ─────────────────────────────────────────────────────────────────
export const FitnessService = {
  listRuns: () => api.get('/fitness-runs/'),
  createRun: (data: {
    started_at: string;
    ended_at: string;
    distance_m: number;
    duration_sec: number;
    avg_pace: string;
    route_points: unknown[];
  }) => api.post('/fitness-runs/', data),
  deleteRun: (id: number) => api.delete(`/fitness-runs/${id}/`),
};

// ── Chat ────────────────────────────────────────────────────────────────────
export const ChatService = {
  /** List all conversations the current user belongs to */
  getConversations: () => api.get('/conversations/'),

  /** Get messages for a conversation (also marks them as read) */
  getMessages: (conversationId: number) =>
    api.get(`/conversations/${conversationId}/messages/`),

  /** Send a new message in a conversation */
  sendMessage: (conversationId: number, body: string) =>
    api.post('/messages/', { conversation: conversationId, body }),

  /** Find or create a 1:1 DM with another user */
  getOrCreateDM: (userId: number) =>
    api.get('/conversations/with_user/', { params: { user_id: userId } }),

  /** Create a new group conversation */
  createGroupChat: (title: string, participantIds: number[]) =>
    api.post('/conversations/', {
      title,
      is_group_chat: true,
      participant_ids: participantIds,
    }),

  /** Clear messages for the current user; chat stays in the list */
  clearMessages: (conversationId: number) =>
    api.delete(`/conversations/${conversationId}/`),
};

/** Build a WebSocket URL for a conversation */
export const getChatWebSocketUrl = (conversationId: number): string => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${wsProtocol}://localhost:8001/ws/chat/${conversationId}/`;
};

export default api;
