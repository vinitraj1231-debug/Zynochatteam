export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  senderPhotoURL?: string;
  recipientId?: string; // For private chats
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'system' | 'file' | 'voice';
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  groundingUrls?: string[];
  replyTo?: string;
  reactions?: Record<string, string[]>; // emoji -> userIds
  status?: 'sent' | 'delivered' | 'read';
  isDeleted?: boolean;
  deletedBy?: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  createdAt: number;
  isOnline?: boolean;
  lastSeen?: number;
  role: 'user' | 'admin' | 'moderator';
  isSuspended?: boolean;
  blockedUids?: string[];
  blockedByUids?: string[];
  privacy?: {
    showProfile: 'all' | 'contacts' | 'none';
    canMessage: 'all' | 'contacts';
    showLastSeen: boolean;
  };
  stats?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface GroupPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddUsers: boolean;
  canPinMessages: boolean;
  canChangeInfo: boolean;
}

export interface VideoChatState {
  isActive: boolean;
  startedBy: string;
  startTime: number;
  participants: string[];
}

export interface Group {
  id: string;
  name: string;
  handle?: string;
  description?: string;
  type: 'public' | 'private' | 'supergroup' | 'broadcast';
  adminIds: string[];
  memberIds: string[];
  createdAt: number;
  createdBy: string;
  photoURL?: string;
  pinnedMessageId?: string;
  slowMode?: number; // seconds
  isSupergroup?: boolean;
  permissions?: GroupPermissions;
  videoChat?: VideoChatState;
}

export interface Channel {
  id: string;
  name: string;
  handle?: string;
  description?: string;
  type: 'public' | 'private';
  adminIds: string[];
  subscriberIds: string[];
  createdAt: number;
  createdBy: string;
  photoURL?: string;
  viewCount: number;
  isBroadcast?: boolean;
  videoChat?: VideoChatState;
}

export interface Story {
  id: string;
  userId: string;
  authorId?: string;
  mediaUrl: string;
  contentUrl?: string;
  type: 'image' | 'video';
  createdAt: number;
  expiresAt: number;
  viewers: string[];
}

export interface Post {
  id: string;
  userId: string;
  authorId?: string;
  content: string;
  mediaUrls: string[];
  createdAt: number;
  likes: string[];
  likesCount?: number;
  comments: Comment[];
  commentsCount?: number;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
}

export interface HelpTicket {
  id: string;
  userId: string;
  title: string;
  category: 'login' | 'chat' | 'payment' | 'report' | 'account' | 'other';
  description: string;
  status: 'open' | 'pending' | 'resolved';
  createdAt: number;
  updatedAt: number;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string; // userId or handle
  reason: 'spam' | 'abuse' | 'impersonation' | 'scam' | 'inappropriate' | 'other';
  details?: string;
  status: 'pending' | 'reviewed' | 'action_taken';
  createdAt: number;
}

export interface Banner {
  id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}
