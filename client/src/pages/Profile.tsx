import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Profile = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedImage) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedImage);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ fullName: name, bio, profilePic: base64Image });
      navigate("/");
    };
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-10 flex-1"
        >
          <h3 className="text-lg">Profile Details</h3>
          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer"
          >
            <input
              type="file"
              id="avatar"
              accept=".jpg, .jpeg, .png"
              hidden
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
            <img
              src={
                selectedImage
                  ? URL.createObjectURL(selectedImage)
                  : assets.avatar_icon
              }
              alt=""
              className={`w-12 h-12 ${selectedImage && "rounded-full"}`}
            />
            upload profile picture
          </label>
          <input
            type="text"
            required
            placeholder="Your name"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            rows={4}
            placeholder="Your bio"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          ></textarea>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-400 to-violet-600 text-white py-2 rounded-full text-lg cursor-pointer"
          >
            Save
          </button>
        </form>
        <img
          src={authUser?.profilePic || assets.logo_icon}
          alt=""
          className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${
            selectedImage && "rounded-full"
          }`}
        />
      </div>
    </div>
  );
};

export default Profile;
