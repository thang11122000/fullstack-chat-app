import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const LoginPage = () => {
  const [currentState, setCurrentState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (e: any) => {
    e.preventDefault();
    if (currentState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    login(currentState === "Sign up" ? "signup" : "login", {
      fullName,
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
          {currentState}
          {isDataSubmitted && (
            <img
              src={assets.arrow_icon}
              alt=""
              onClick={() => setIsDataSubmitted(false)}
              className="w-5 cursor-pointer"
            />
          )}
        </h2>
        {/* <img src={assets.arrow_icon} alt="" className="w-5 cursor-pointer" /> */}
        {currentState === "Sign up" && !isDataSubmitted && (
          <input
            type="text"
            className="p-2 border border-gray-500 rounded-md focus:outline-none"
            placeholder="Full name"
            required
          />
        )}

        {!isDataSubmitted && (
          <>
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
          </>
        )}
        {currentState === "Sign up" && isDataSubmitted && (
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
          {currentState === "Sign up" ? "Create account" : "Log in"}
        </button>
      </form>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <input type="checkbox" className="" name="" id="" />
        <p>Agree to the terms of use and privacy policy.</p>
      </div>

      <div className="flex flex-col gap-2">
        {currentState === "Sign up" ? (
          <p className="text-sm text-gray-600">
            <span>Already have an account?</span>
            <span
              className="font-medium text-violet-500 cursor-pointer"
              onClick={() => setCurrentState("Login")}
            >
              Log In
            </span>
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Create an account?{" "}
            <span
              className="font-medium text-violet-500 cursor-pointer"
              onClick={() => setCurrentState("Sign up")}
            >
              Click here.
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
