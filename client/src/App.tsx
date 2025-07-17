import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage";
import Profile from "./pages/Profile";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

const App = () => {
  const { authUser } = useContext(AuthContext);

  return (
    <div className="bg-[url('/bgImage.svg')]">
      <Routes>
        <Toaster />
        <Route
          path="/"
          element={authUser ? <Homepage /> : <Navigate to={"/login"} />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/profile"
          element={authUser ? <Profile /> : <Navigate to={"/login"} />}
        />
      </Routes>
    </div>
  );
};

export default App;
