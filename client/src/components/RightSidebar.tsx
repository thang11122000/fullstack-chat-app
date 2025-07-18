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
        className={`bg-[#8185b2]/10 text-white w-full relative overflow-scroll ${
          selectedUser ? "max-md:hidden" : ""
        }`}
      >
        <div className="pt-16 flex flex-col item-center gap-2 text-xs font-light mx-auto">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt=""
            className="w-20 aspect-[1/1] rounded-full"
          />
          <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">
            {onlineUsers.includes(selectedUser._id) ? (
              <span className="text-green-400 text-xs">Online</span>
            ) : null}
            {selectedUser.fullname}
          </h1>
          <p className="px-10 mx-auto">{selectedUser.bio}</p>
        </div>
        <hr className="border-[#ffffff50] my-4" />
        <div className="px-5 text-xs">
          <p>Media</p>
          <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
            {images.map((image: string, index: number) => (
              <div
                key={index}
                className="cursor-pointer rounded"
                onClick={() => {
                  window.open(image, "_blank");
                }}
              >
                <img src={image} alt="" className="h-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={logout}
          className="absolute bottom-5 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer"
        >
          Logout
        </button>
      </div>
    )
  );
};

export default RightSidebar;
