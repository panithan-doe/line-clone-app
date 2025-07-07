export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'private' | 'group';
  description?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  chatRoomId: string;
  senderId: string;
  senderNickname: string;
  isRead?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatRoomMember {
  id: string;
  chatRoomId: string;
  userId: string;
  userNickname: string;
  role: 'admin' | 'member';
  joinedAt?: string;
}