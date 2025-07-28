import { useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../auth/AuthContext";
import toast from "react-hot-toast";
import { ChatContext } from "./ChatContext";
import type { ChatContextType, User, Message } from "./chat.types";
import { isAxiosError } from "axios";
import { useBfcacheOptimization } from "../../src/utils/bfcache";

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>(
    {}
  );

  const { socket, axios } = useContext(AuthContext)!;
  const { registerSocketCleanup } = useBfcacheOptimization();

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
    if (!socket) {
      console.log("Socket not available for message subscription");
      return;
    }
    console.log("Subscribing to message_received events");
    socket.on("message_received", (newMessage: Message) => {
      console.log("Received message:", newMessage);
      console.log("Selected user:", selectedUser);
      console.log("Message sender:", newMessage.senderId);

      if (selectedUser && selectedUser._id === newMessage.senderId) {
        console.log("Adding message to current chat");
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/messages/mark-seen/${newMessage._id}`);
      } else {
        console.log("Adding to unread messages");
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

    // Register cleanup for bfcache
    const unregisterCleanup = registerSocketCleanup(() => {
      console.log("Cleaning up chat socket listeners for bfcache");
      unsubscribeFromMessages();
    });

    // Handle bfcache restoration
    const handleBfcacheRestore = () => {
      console.log("Restoring chat socket listeners after bfcache");
      setTimeout(() => {
        subscribeToMessages();
      }, 100);
    };

    window.addEventListener("bfcache-restore", handleBfcacheRestore);

    return () => {
      unsubscribeFromMessages();
      unregisterCleanup();
      window.removeEventListener("bfcache-restore", handleBfcacheRestore);
    };
  }, [subscribeToMessages, unsubscribeFromMessages, registerSocketCleanup]);

  const value: ChatContextType = {
    users,
    messages,
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
