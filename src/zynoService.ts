import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  onSnapshot, 
  orderBy, 
  limit, 
  arrayUnion, 
  arrayRemove,
  updateDoc,
  getDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { UserProfile, Group, Channel, Message, Story, Post, HelpTicket, Report, Banner, VideoChatState } from './types';

const clean = (obj: any) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
};

export const ZynoService = {
  async getUserByUsername(username: string) {
    const q = query(collection(db, 'users'), where('username', '==', username));
    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as UserProfile;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
    }
  },

  async getUserProfile(uid: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const docRef = doc(db, 'users', uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return snapshot.data() as UserProfile;
        }
        return null;
      } catch (e) {
        if (i === retries - 1) {
          handleFirestoreError(e, OperationType.GET, `users/${uid}`);
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return null;
  },

  async createUserProfile(profile: UserProfile) {
    try {
      await setDoc(doc(db, 'users', profile.uid), clean(profile));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${profile.uid}`);
    }
  },

  async createGroup(group: Omit<Group, 'id'>) {
    try {
      const docRef = doc(collection(db, 'groups'));
      const id = docRef.id;
      await setDoc(docRef, clean({ ...group, id }));
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'groups');
    }
  },

  async createChannel(channel: Omit<Channel, 'id'>) {
    try {
      const docRef = doc(collection(db, 'channels'));
      const id = docRef.id;
      await setDoc(docRef, clean({ ...channel, id }));
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'channels');
    }
  },

  getPrivateChatId(uid1: string, uid2: string) {
    return [uid1, uid2].sort().join('_');
  },

  async sendMessage(message: Omit<Message, 'id'>) {
    try {
      const docRef = doc(collection(db, 'messages'));
      const id = docRef.id;
      // Ensure sender info is included if available
      const senderProfile = auth.currentUser ? await this.getUserProfile(auth.currentUser.uid) : null;
      const finalMessage = {
        ...message,
        id,
        senderName: senderProfile?.displayName || message.senderName,
        senderPhotoURL: senderProfile?.photoURL || message.senderPhotoURL,
        status: 'sent'
      };
      await setDoc(docRef, clean(finalMessage));
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'messages');
    }
  },

  async deleteMessage(messageId: string, userId: string) {
    try {
      const docRef = doc(db, 'messages', messageId);
      await updateDoc(docRef, {
        isDeleted: true,
        deletedBy: userId,
        content: 'This message was deleted'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `messages/${messageId}`);
    }
  },

  async updateGroupSettings(groupId: string, updates: Partial<Group>) {
    try {
      const docRef = doc(db, 'groups', groupId);
      await updateDoc(docRef, clean(updates));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `groups/${groupId}`);
    }
  },

  async updateChannelSettings(channelId: string, updates: Partial<Channel>) {
    try {
      const docRef = doc(db, 'channels', channelId);
      await updateDoc(docRef, clean(updates));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `channels/${channelId}`);
    }
  },

  async toggleVideoChat(chatId: string, type: 'group' | 'channel', isActive: boolean, userId: string) {
    try {
      const collectionName = type === 'group' ? 'groups' : 'channels';
      const docRef = doc(db, collectionName, chatId);
      const videoChat: VideoChatState = {
        isActive,
        startedBy: userId,
        startTime: isActive ? Date.now() : 0,
        participants: isActive ? [userId] : []
      };
      await updateDoc(docRef, { videoChat });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${type}s/${chatId}`);
    }
  },

  async joinVideoCall(chatId: string, type: 'group' | 'channel', userId: string) {
    try {
      const collectionName = type === 'group' ? 'groups' : 'channels';
      const docRef = doc(db, collectionName, chatId);
      await updateDoc(docRef, {
        'videoChat.participants': arrayUnion(userId)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${type}s/${chatId}`);
    }
  },

  async leaveVideoCall(chatId: string, type: 'group' | 'channel', userId: string) {
    try {
      const collectionName = type === 'group' ? 'groups' : 'channels';
      const docRef = doc(db, collectionName, chatId);
      await updateDoc(docRef, {
        'videoChat.participants': arrayRemove(userId)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${type}s/${chatId}`);
    }
  },

  async markMessagesAsRead(chatId: string, userId: string) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        where('status', '!=', 'read')
      );
      const snapshot = await getDocs(q);
      
      // Filter out messages sent by the current user and update status to read
      const updates = snapshot.docs
        .filter(docSnap => docSnap.data().senderId !== userId)
        .map(docSnap => 
          updateDoc(doc(db, 'messages', docSnap.id), { status: 'read' })
            .catch(err => console.warn(`Failed to mark message ${docSnap.id} as read:`, err))
        );
      
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (e) {
      // Don't throw here to avoid crashing the UI, just log it
      console.error('Error in markMessagesAsRead:', e);
    }
  },

  subscribeToStories(callback: (stories: Story[]) => void) {
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', Date.now()),
      orderBy('expiresAt', 'desc'),
      limit(20)
    );
    return onSnapshot(q, (snapshot) => {
      const stories = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Story));
      callback(stories);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'stories'));
  },

  async getTrendingChannels() {
    try {
      const q = query(
        collection(db, 'channels'),
        where('type', '==', 'public'),
        orderBy('viewCount', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Channel));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'channels');
      return [];
    }
  },

  async searchAll(searchTerm: string) {
    if (!searchTerm) return { users: [], groups: [], channels: [] };
    const term = searchTerm.toLowerCase();
    
    try {
      const usersQ = query(collection(db, 'users'), limit(50));
      const groupsQ = query(collection(db, 'groups'), where('type', '==', 'public'), limit(50));
      const channelsQ = query(collection(db, 'channels'), where('type', '==', 'public'), limit(50));

      const [uSnap, gSnap, cSnap] = await Promise.all([
        getDocs(usersQ),
        getDocs(groupsQ),
        getDocs(channelsQ)
      ]);

      const users = uSnap.docs
        .map(d => d.data() as UserProfile)
        .filter(u => u.username.toLowerCase().includes(term) || u.displayName?.toLowerCase().includes(term));
      
      const groups = gSnap.docs
        .map(d => d.data() as Group)
        .filter(g => g.name.toLowerCase().includes(term) || g.handle?.toLowerCase().includes(term));

      const channels = cSnap.docs
        .map(d => d.data() as Channel)
        .filter(c => c.name.toLowerCase().includes(term) || c.handle?.toLowerCase().includes(term));

      return { users, groups, channels };
    } catch (e) {
      console.error('Search error:', e);
      return { users: [], groups: [], channels: [] };
    }
  },

  async joinVideoChat(chatId: string, type: 'group' | 'channel', userId: string) {
    try {
      const collectionName = type === 'group' ? 'groups' : 'channels';
      const docRef = doc(db, collectionName, chatId);
      await updateDoc(docRef, {
        'videoChat.participants': arrayUnion(userId)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${type}s/${chatId}`);
    }
  },

  async leaveVideoChat(chatId: string, type: 'group' | 'channel', userId: string) {
    try {
      const collectionName = type === 'group' ? 'groups' : 'channels';
      const docRef = doc(db, collectionName, chatId);
      await updateDoc(docRef, {
        'videoChat.participants': arrayRemove(userId)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${type}s/${chatId}`);
    }
  },

  async getUserStats(uid: string) {
    try {
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', uid));
      const postsSnapshot = await getDocs(postsQuery);
      
      // In a real app, followers/following would be in a separate collection
      // For now we'll return real post count and mock followers based on something real-ish
      return {
        posts: postsSnapshot.size,
        followers: Math.floor(postsSnapshot.size * 1.5), // Real-ish
        following: Math.floor(postsSnapshot.size * 0.8)
      };
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'posts');
      return { posts: 0, followers: 0, following: 0 };
    }
  },

  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'messages'), 
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as Message);
      callback(messages);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'messages'));
  },

  subscribeToUserChats(uid: string, callback: (chats: { groups: Group[], channels: Channel[], personal: any[] }) => void) {
    const groupsQuery = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));
    const channelsQuery = query(collection(db, 'channels'), where('subscriberIds', 'array-contains', uid));

    let groups: Group[] = [];
    let channels: Channel[] = [];
    let personal: any[] = [];

    const unsubGroups = onSnapshot(groupsQuery, (snapshot) => {
      groups = snapshot.docs.map(doc => doc.data() as Group);
      callback({ groups, channels, personal });
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'groups'));

    const unsubChannels = onSnapshot(channelsQuery, (snapshot) => {
      channels = snapshot.docs.map(doc => doc.data() as Channel);
      callback({ groups, channels, personal });
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'channels'));

    // For personal chats, we'll fetch users that we have messages with
    const messagesQ = query(
      collection(db, 'messages'),
      where('senderId', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const unsubMessages = onSnapshot(messagesQ, async (snapshot) => {
      const chatIds = new Set<string>();
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.chatId && data.chatId.includes('_')) {
          chatIds.add(data.chatId);
        }
      });

      const personalChats = await Promise.all(Array.from(chatIds).map(async (chatId) => {
        const otherUid = chatId.split('_').find(id => id !== uid);
        if (!otherUid) return null;
        const userProfile = await this.getUserProfile(otherUid);
        if (!userProfile) return null;
        return {
          id: chatId,
          name: userProfile.displayName || userProfile.username,
          photoURL: userProfile.photoURL,
          type: 'private',
          isOnline: userProfile.isOnline,
          lastMessage: '',
          unreadCount: 0
        };
      }));

      personal = personalChats.filter(c => c !== null);
      callback({ groups, channels, personal });
    });

    return () => {
      unsubGroups();
      unsubChannels();
      unsubMessages();
    };
  },

  // New methods for Zynochat
  async createStory(story: Omit<Story, 'id'>) {
    try {
      const docRef = doc(collection(db, 'stories'));
      const id = docRef.id;
      await setDoc(docRef, clean({ ...story, id }));
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'stories');
    }
  },

  async createPost(post: Omit<Post, 'id'>) {
    try {
      const docRef = doc(collection(db, 'posts'));
      const id = docRef.id;
      await setDoc(docRef, clean({ ...post, id }));
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'posts');
    }
  },

  async createHelpTicket(ticket: Omit<HelpTicket, 'id'>) {
    try {
      const docRef = doc(collection(db, 'help_tickets'));
      const id = docRef.id;
      await setDoc(docRef, clean({ ...ticket, id }));
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'help_tickets');
    }
  },

  async createReport(report: Omit<Report, 'id'>) {
    try {
      const docRef = doc(collection(db, 'reports'));
      const id = docRef.id;
      await setDoc(docRef, clean({ ...report, id }));
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'reports');
    }
  },

  async updateProfile(uid: string, updates: Partial<UserProfile>) {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, updates);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
    }
  },

  async blockUser(uid: string, targetUid: string) {
    try {
      const userRef = doc(db, 'users', uid);
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { blockedUids: arrayUnion(targetUid) });
      await updateDoc(targetRef, { blockedByUids: arrayUnion(uid) });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
    }
  },

  async unblockUser(uid: string, targetUid: string) {
    try {
      const userRef = doc(db, 'users', uid);
      const targetRef = doc(db, 'users', targetUid);
      const userSnap = await getDoc(userRef);
      const targetSnap = await getDoc(targetRef);
      
      if (userSnap.exists()) {
        const blockedUids = (userSnap.data() as UserProfile).blockedUids || [];
        await updateDoc(userRef, { blockedUids: blockedUids.filter(id => id !== targetUid) });
      }
      if (targetSnap.exists()) {
        const blockedByUids = (targetSnap.data() as UserProfile).blockedByUids || [];
        await updateDoc(targetRef, { blockedByUids: blockedByUids.filter(id => id !== uid) });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
    }
  },

  async joinGroup(groupId: string, userId: string) {
    try {
      const docRef = doc(db, 'groups', groupId);
      await updateDoc(docRef, {
        memberIds: arrayUnion(userId)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `groups/${groupId}`);
    }
  },

  async joinChannel(channelId: string, userId: string) {
    try {
      const docRef = doc(db, 'channels', channelId);
      await updateDoc(docRef, {
        subscriberIds: arrayUnion(userId)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `channels/${channelId}`);
    }
  },

  async createBanner(banner: Omit<Banner, 'id'>) {
    try {
      const docRef = doc(collection(db, 'banners'));
      const id = docRef.id;
      await setDoc(docRef, clean({ ...banner, id }));
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'banners');
    }
  },

  subscribeToBanners(callback: (banners: Banner[]) => void) {
    const q = query(collection(db, 'banners'), where('isActive', '==', true));
    return onSnapshot(q, (snapshot) => {
      const banners = snapshot.docs.map(doc => doc.data() as Banner);
      callback(banners);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'banners'));
  },

  async getTrending() {
    try {
      const groupsQ = query(collection(db, 'groups'), where('type', '==', 'public'), limit(5));
      const channelsQ = query(collection(db, 'channels'), where('type', '==', 'public'), limit(5));
      
      const [groupsSnap, channelsSnap] = await Promise.all([getDocs(groupsQ), getDocs(channelsQ)]);
      
      const groups = groupsSnap.docs.map(doc => ({ ...doc.data(), type: 'group', id: doc.id }));
      const channels = channelsSnap.docs.map(doc => ({ ...doc.data(), type: 'channel', id: doc.id }));
      
      return [...groups, ...channels].sort(() => Math.random() - 0.5);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'trending');
      return [];
    }
  },

  async getAllUsers() {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => docSnap.data() as UserProfile);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
      return [];
    }
  },

  async getAllReports() {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => docSnap.data() as Report);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'reports');
      return [];
    }
  },

  async getAllHelpTickets() {
    try {
      const q = query(collection(db, 'help_tickets'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => docSnap.data() as HelpTicket);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'help_tickets');
      return [];
    }
  },

  async updateReportStatus(reportId: string, status: 'reviewed' | 'action_taken') {
    try {
      const docRef = doc(db, 'reports', reportId);
      await updateDoc(docRef, { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reports/${reportId}`);
    }
  },

  async updateHelpTicketStatus(ticketId: string, status: 'pending' | 'resolved') {
    try {
      const docRef = doc(db, 'help_tickets', ticketId);
      await updateDoc(docRef, { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `help_tickets/${ticketId}`);
    }
  },

  async deleteBanner(bannerId: string) {
    try {
      const docRef = doc(db, 'banners', bannerId);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `banners/${bannerId}`);
    }
  },
};
