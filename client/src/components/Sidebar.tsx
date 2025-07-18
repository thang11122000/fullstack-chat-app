import React, { useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/chat/useChat";
import { useAuth } from "../../context/auth/AuthContext";

// Define User type for clarity
interface User {
  _id: string;
  fullname: string;
  profilePic?: string;
  bio?: string;
}

const Sidebar: React.FC = () => {
  const { logout, onlineUsers } = useAuth();
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unreadMessages,
    setUnreadMessages,
  } = useChat();

  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filterUsers = input
    ? users.filter((user) =>
        user.fullname.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  return (
    <div
      className={`h-full flex flex-col bg-white/90 dark:bg-[#23213a] p-4 shadow-lg text-gray-900 dark:text-white transition-all duration-300 overflow-hidden ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      {/* Logo & Menu */}
      <div className="pb-2 flex justify-between items-center">
        <img src={assets.logo} alt="logo" className="w-32 max-w-full" />
        <div className="relative">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition p-1 cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <img src={assets.menu_icon} alt="menu" className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className="absolute top-12 right-0 z-20 w-36 p-4 rounded-xl bg-white dark:bg-[#282142] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-lg animate-fade-in">
              <p
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
                className="cursor-pointer text-sm py-1 hover:text-indigo-500 transition"
              >
                Edit Profile
              </p>
              <hr className="my-2 border-t border-gray-300 dark:border-gray-600" />
              <p
                className="cursor-pointer text-sm py-1 hover:text-red-500 transition"
                onClick={logout}
              >
                Logout
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Search */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-indigo-900/40 rounded-full flex items-center px-4 py-2 gap-2 shadow-inner">
        <img src={assets.search_icon} alt="Search" className="w-4 opacity-70" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          className="bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 flex-1"
          placeholder="Search user..."
        />
      </div>
      {/* User list */}
      <div className="flex-1 overflow-y-scroll flex flex-col mt-2 gap-1">
        {filterUsers.map((user: User) => (
          <div
            key={user._id}
            onClick={() => {
              setSelectedUser(user);
              setUnreadMessages((prev) => ({ ...prev, [user._id]: 0 }));
            }}
            className={`relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition group
              ${
                selectedUser?._id === user._id
                  ? "bg-indigo-100 text-indigo-700 shadow"
                  : "hover:bg-blue-50 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-white"
              }
            `}
          >
            <img
              src={user.profilePic || assets.avatar_icon}
              alt=""
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400 shadow"
            />
            <div className="flex flex-col leading-5 flex-1">
              <p className="font-semibold truncate">{user.fullname}</p>
              {onlineUsers.includes(user._id) ? (
                <span className="text-green-500 text-xs font-medium">
                  Online
                </span>
              ) : (
                <span className="text-neutral-400 text-xs">Offline</span>
              )}
            </div>
            {unreadMessages[user._id] > 0 && (
              <span className="bg-violet-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full absolute top-2 right-4 shadow">
                {unreadMessages[user._id]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
