import { useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../auth/AuthContext";
import toast from "react-hot-toast";
import { ChatContext } from "./ChatContext";
import type { ChatContextType, User, Message } from "./chat.types";
import { isAxiosError } from "axios";

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>(
    {}
  );

  const { socket, axios } = useContext(AuthContext)!;

  const handleError = (error: unknown) => {
    if (isAxiosError(error)) {
      toast.error(
        error.response?.data?.message || error.message || "An error occurred"
      );
    } else if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("An error occurred");
    }
  };

  const getUsers = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        const { users, unreadCount } = data.data;
        setUsers(users);
        setUnreadMessages(unreadCount);
      }
    } catch (error) {
      handleError(error);
    }
  }, [axios]);

  const getMessages = useCallback(
    async (userId: string) => {
      try {
        const { data } = await axios.get(
          `/api/messages/conversation/${userId}`
        );
        if (data.success) {
          const { messages } = data.data;
          setMessages(messages);
        }
      } catch (error) {
        handleError(error);
      }
    },
    [axios]
  );

  const sendMessage = useCallback(
    async (messageData: Partial<Message>) => {
      try {
        if (!selectedUser) return;
        const { data } = await axios.post(
          `/api/messages/send/${selectedUser._id}`,
          messageData
        );
        if (data.success) {
          const { message: newMessage } = data.data;
          setMessages((prev) => [...prev, newMessage]);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        handleError(error);
      }
    },
    [axios, selectedUser]
  );

  const subscribeToMessages = useCallback(() => {
    if (!socket) return;
    socket.on("message_received", (newMessage: Message) => {
      console.log(selectedUser, selectedUser?._id, newMessage);

      if (selectedUser && selectedUser._id === newMessage.senderId) {
        newMessage.seen = true;
        console.log(true);
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/message/mark/${newMessage._id}`);
      } else {
        setUnreadMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });
  }, [socket, selectedUser, axios]);

  const unsubscribeFromMessages = useCallback(() => {
    if (!socket) return;
    socket.off("message_received");
  }, [socket]);

  useEffect(() => {
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
    };
  }, [subscribeToMessages, unsubscribeFromMessages]);

  const value: ChatContextType = {
    users,
    setUsers,
    messages,
    setMessages,
    unreadMessages,
    setUnreadMessages,
    selectedUser,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
