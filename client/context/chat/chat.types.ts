export interface User {
  _id: string;
  fullname: string;
  profilePic?: string;
  bio?: string;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  seen: boolean;
  createdAt: string;
}

export interface ChatContextType {
  users: User[];
  getUsers: () => void;
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  messages: Message[];
  getMessages: (userId: string) => void;
  sendMessage: (data: Partial<Message>) => Promise<void>;
  unreadMessages: Record<string, number>;
  setUnreadMessages: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}
