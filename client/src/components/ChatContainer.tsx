import React, { useContext, useEffect } from "react";
import assets, { messagesDummyData } from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import toast from "react-hot-toast";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const { authUser, onlineUsers } = useContext(AuthContext);
  const { messages, getMessages, selectedUser, sendMessage, setSelectedUser } =
    useContext(ChatContext);

  const [input, setInput] = useState([]);
  const scrollEnd = React.useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim()) return;

    const messageData = {
      text: input.trim(),
    };

    await sendMessage(messageData);
    setInput("");
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const messageData = {
        image: reader.result,
      };
      await sendMessage(messageData);
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
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      <div className="flex item-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser?.profilePic ?? assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser?.fullName}
          {onlineUsers.includes(selectedUser._id) ? (
            <span className="text-green-400 text-xs">Online</span>
          ) : null}
        </p>
        <img
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7"
          onClick={() => setSelectedUser(null)}
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex item-end gap-2 justify-end ${
              message.senderId !== authUser?._id && "flex-row-reverse"
            }`}
          >
            {message.image ? (
              <img
                src={message.image}
                alt="message"
                className={`max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8`}
              />
            ) : (
              <p
                className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
                  message.senderId === authUser?._id
                    ? "rounded-br-none"
                    : "rounded-bl-none"
                }`}
              >
                {message.text}
              </p>
            )}
            <div className="text-center text-xs">
              <img
                src={
                  message.senderId === authUser?._id
                    ? authUser?.profilePic || assets.avatar_icon
                    : selectedUser?.profilePic || assets.avatar_icon
                }
                alt=""
                className="w-7 rounded-full"
              />
              <p className="text-gray-500">
                {formatMessageTime(message.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
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
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/*"
            hidden
          />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-5 mr-2 cursor-pointer"
            />
          </label>
        </div>
        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col item-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} alt="" className="max-w-16" />
      <div className="text-lg font-medium text-white">
        Chat anytime, anywhere
      </div>
    </div>
  );
};

export default ChatContainer;
