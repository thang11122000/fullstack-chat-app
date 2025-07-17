import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/message/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/message/${userId}`);
      if (data.success) {
        setMessage(data.messages);
        // setSelectedUser(userId);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        "/api/message/send" + selectedUser._id,
        {
          messageData,
        }
      );

      if (data.success) {
        setMessage((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && selectedUser._id === newMessage.senderId) {
        newMessage.seen = true;
        setMessage((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/message/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    });
  };

  const unsubscribeFromMessages = () => {
    if (!socket) return;
    socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [subscribeToMessages, unsubscribeFromMessages]);

  const value = {
    users,
    message,
    setMessage,
    unseenMessages,
    setUnseenMessages,
    selectedUser,
    setSelectedUser,

    getUsers,
    getMessages,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
