import React, { useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { useChat } from "../../context/chat/useChat";
import toast from "react-hot-toast";
import { useAuth } from "../../context/auth/AuthContext";

const ChatContainer: React.FC = () => {
  const { authUser, onlineUsers } = useAuth();
  const { messages, getMessages, selectedUser, sendMessage, setSelectedUser } =
    useChat();

  const [input, setInput] = useState("");
  const scrollEnd = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (
    e: React.FormEvent | React.KeyboardEvent | React.MouseEvent
  ) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageData = {
      text: input.trim(),
    };

    await sendMessage(messageData);
    setInput("");
  };

  const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const image =
        typeof reader.result === "string" ? reader.result : undefined;
      if (image) {
        await sendMessage({ image });
      }
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full flex flex-col bg-white/80 dark:bg-gray-900/80 transition-all overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 py-3 px-4 border-b border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 rounded-t-xl">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 h-8 rounded-full object-cover border-2 border-indigo-400 shadow"
        />
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {selectedUser?.fullname}
            {onlineUsers.includes(selectedUser._id) ? (
              <span className="text-green-500 text-xs font-medium animate-pulse">
                Online
              </span>
            ) : null}
          </span>
        </div>
        <button
          className="md:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          onClick={() => setSelectedUser(null)}
        >
          <img src={assets.arrow_icon} alt="Back" className="w-6" />
        </button>
        <div className="items-center hidden md:flex">
          <img
            src={assets.help_icon}
            alt="Help"
            className="w-4 cursor-pointer hover:scale-110 transition"
          />
        </div>
      </div>
      {/* Chat messages */}
      <div className="flex-1 flex flex-col overflow-y-scroll px-4 py-4 gap-2 bg-transparent">
        {messages.map((message, index) => {
          const isMe = message.senderId === authUser?._id;
          return (
            <div
              key={index}
              className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <img
                  src={selectedUser?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
              )}
              <div className="flex flex-col max-w-[70%]">
                {message.image ? (
                  <img
                    src={message.image}
                    alt="message"
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow mb-1 max-w-xs object-cover"
                  />
                ) : (
                  <p
                    className={`px-4 py-2 text-sm rounded-2xl shadow mb-1 break-words transition-all
                      ${
                        isMe
                          ? "bg-indigo-500 text-white rounded-br-none ml-auto"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none mr-auto"
                      }`}
                  >
                    {message.text}
                  </p>
                )}
                <span className="text-xs text-gray-400 mt-0.5 ml-1">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
              {isMe && (
                <img
                  src={authUser?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-indigo-300 dark:border-indigo-700"
                />
              )}
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>
      {/* Input area */}
      <form
        className="flex items-center gap-3 p-2 bg-white/80 dark:bg-gray-900/80 rounded-b-xl shadow-inner"
        onSubmit={handleSendMessage}
      >
        <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full shadow">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                handleSendMessage(e);
              }
            }}
            type="text"
            placeholder="Send a message..."
            className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/*"
            hidden
          />
          <label
            htmlFor="image"
            className="cursor-pointer hover:scale-110 transition ml-2"
          >
            <img
              src={assets.gallery_icon}
              alt="Gửi ảnh"
              className="w-5 min-w-5"
            />
          </label>
        </div>
        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow transition flex items-center justify-center"
        >
          <img
            src={assets.send_button}
            alt="Gửi"
            className="min-w-7 w-7 hover:scale-110 cursor-pointer"
          />
        </button>
      </form>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-4 text-gray-500 bg-white/10 max-md:hidden h-full rounded-xl shadow-lg">
      <img src={assets.logo_icon} alt="" className="w-16" />
      <div className="text-lg font-medium text-gray-900 dark:text-white">
        Chat anytime, anywhere
      </div>
    </div>
  );
};

export default ChatContainer;
