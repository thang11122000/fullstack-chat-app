import React, { useState, useEffect } from "react";
import assets from "../assets/assets";
import { useAuth } from "../../context/auth/AuthContext";
import { NavLink } from "react-router-dom";

const Profile = () => {
  const { authUser, updateProfile } = useAuth();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState(authUser?.fullname || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedImage) {
        await updateProfile({ fullname: name, bio });
        setLoading(false);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        const base64Image =
          typeof reader.result === "string" ? reader.result : undefined;
        try {
          if (base64Image) {
            await updateProfile({
              fullname: name,
              bio,
              profilePic: base64Image,
            });
          } else {
            await updateProfile({ fullname: name, bio });
          }
        } catch {
          console.log("Update failed!");
        }
        setLoading(false);
      };
      reader.onerror = () => {
        setLoading(false);
      };
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-10 flex-1"
        >
          <h3 className="text-xl">Profile Details</h3>
          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer"
          >
            <input
              type="file"
              id="avatar"
              accept=".jpg, .jpeg, .png"
              hidden
              disabled={loading}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedImage(e.target.files[0]);
                }
              }}
            />
            <img
              src={
                previewUrl
                  ? previewUrl
                  : authUser?.profilePic || assets.avatar_icon
              }
              alt=""
              className={`w-12 h-12 rounded-full`}
            />
            Upload profile picture
          </label>
          <input
            type="text"
            required
            placeholder="Your name"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <textarea
            rows={4}
            placeholder="Your bio"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
            disabled={loading}
          ></textarea>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-400 to-violet-600 text-white py-2 rounded-full text-lg cursor-pointer"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <NavLink to="/" className="text-gray-400 underline">
            ← Back to Chat
          </NavLink>
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
