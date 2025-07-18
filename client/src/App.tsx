import { Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import LoginPage from "./pages/LoginPage";
import Profile from "./pages/Profile";
import { Toaster } from "react-hot-toast";
import { useAuth } from "../context/auth/AuthContext";

const App = () => {
  const { authUser, isAuthLoading } = useAuth();
  const hasAuth = !isAuthLoading && authUser;

  return (
    <div className="h-full w-full bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-[#23213a] dark:to-indigo-900">
      <Toaster />
      <Routes>
        <Route path="/" element={hasAuth && <Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={hasAuth && <Profile />} />
      </Routes>
    </div>
  );
};

export default App;
