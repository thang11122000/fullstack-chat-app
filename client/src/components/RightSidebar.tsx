import React, { useEffect, useState } from "react";
import assets from "../assets/assets";
import { useChat } from "../../context/chat/useChat";
import { useAuth } from "../../context/auth/AuthContext";

// Add User and Message types
interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  seen: boolean;
  createdAt: string;
}

const RightSidebar: React.FC = () => {
  const { logout, onlineUsers } = useAuth();
  const { selectedUser, messages } = useChat();
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    setImages(
      messages
        .filter((msg: Message) => msg.image)
        .map((msg: Message) => msg.image!)
    );
  }, [messages]);

  return (
    selectedUser && (
      <div
        className={`h-full flex flex-col bg-white/90 dark:bg-[#23213a] shadow-lg text-gray-900 overflow-hidden dark:text-white w-full relative transition-all duration-300 ${
          selectedUser ? "max-md:hidden" : ""
        }`}
      >
        {/* User Info */}
        <div className="pt-12 pb-4 flex flex-col items-center gap-2">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-400 shadow mx-auto"
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mt-2">
            {onlineUsers.includes(selectedUser._id) && (
              <span className="text-green-500 text-xs font-medium">●</span>
            )}
            {selectedUser.fullname}
          </h1>
          {selectedUser.bio && (
            <p className="text-gray-500 dark:text-gray-300 text-center text-sm px-6 mt-1">
              {selectedUser.bio}
            </p>
          )}
        </div>
        <hr className="border-gray-200 dark:border-gray-700 my-2 mx-6" />
        {/* Media */}
        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Media
          </p>
          <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto">
            {images.length === 0 && (
              <span className="text-xs text-gray-400 col-span-2">
                No media yet.
              </span>
            )}
            {images.map((image: string, index: number) => (
              <div
                key={index}
                className="cursor-pointer rounded-lg border border-indigo-100 dark:border-indigo-900 shadow hover:scale-105 transition overflow-hidden"
                onClick={() => {
                  window.open(image, "_blank");
                }}
              >
                <img
                  src={image}
                  alt="media"
                  className="w-full h-24 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Logout Button */}
        <button
          onClick={logout}
          className="cursor-pointer bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold py-1.5 px-10 rounded-full shadow-lg transition absolute bottom-2 left-1/2 -translate-x-1/2"
        >
          Logout
        </button>
      </div>
    )
  );
};

export default RightSidebar;
