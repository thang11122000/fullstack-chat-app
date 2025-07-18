import React, { useState } from "react";
import assets from "../assets/assets";
import { useAuth } from "../../context/auth/AuthContext";

const LoginPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [fullname, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");

  const { login } = useAuth();

  const onSubmitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    login(isSignup ? "signup" : "login", {
      fullname,
      email,
      password,
      bio,
    });
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl">
      <img src={assets.logo_big} alt="" className="w-[min(30vw,250px)]" />

      <form
        onSubmit={onSubmitHandler}
        className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg"
      >
        <h2 className="font-medium text-2xl flex justify-between items-center">
          {isSignup ? "Sign up" : "Login"}
        </h2>
        {isSignup && (
          <input
            type="text"
            className="p-2 border border-gray-500 rounded-md focus:outline-none"
            placeholder="Full name"
            required
            value={fullname}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
        <input
          type="email"
          className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Email address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isSignup && (
          <textarea
            rows={4}
            cols={10}
            className="p-2 border border-gray-500 rounded-md focus:outline-none"
            placeholder="Provide a short bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          ></textarea>
        )}
        <button className="py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer">
          {isSignup ? "Create account" : "Log in"}
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" className="" name="" id="" />
          <p>Agree to the terms of use and privacy policy.</p>
        </div>

        <div className="flex flex-col gap-2">
          {isSignup ? (
            <p className="text-sm text-gray-600">
              <span>Already have an account?</span>
              <span
                className="font-medium text-violet-500 cursor-pointer"
                onClick={() => setIsSignup(false)}
              >
                Log In
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Create an account?{" "}
              <span
                className="font-medium text-violet-500 cursor-pointer"
                onClick={() => setIsSignup(true)}
              >
                Click here.
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
