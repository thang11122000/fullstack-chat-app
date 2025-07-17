import React, { useContext, useEffect, useState } from "react";
import assets, { imagesDummyData } from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(ChatContext);
  const [images, setImages] = useState([]);

  useEffect(() => {
    setImages(messages.filter((msg) => msg.image).map((msg) => msg.image));
  }, []);

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
            {selectedUser.fullName}
          </h1>
          <p className="px-10 mx-auto">{selectedUser.bio}</p>
        </div>
        <hr className="border-[#ffffff50] my-4" />
        <div className="px-5 text-xs">
          <p>Media</p>
          <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
            {images.map((image, index) => (
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
          className="absolute bottom-5 right-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer"
        >
          Logout
        </button>
      </div>
    )
  );
};

export default RightSidebar;
