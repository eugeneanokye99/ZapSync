import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { googleLogin, loginUser } from "../services/api";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const location = await getUserLocation();
      const data = await loginUser(email, password, location.latitude, location.longitude);
      
      toast.success("Login successful!");

      // Store token or user data
      localStorage.setItem("zapsync_token", data.token);


      // Redirect to dashboard
      if (data.role === 'staff') {
        setTimeout(() => navigate("/staff_dashboard"), 2000);
      } else {
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (error) {
      console.error(error)
      toast.error(error.non_field_errors[0]);
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleSuccess = async (response) => {
    try {
      const location = await getUserLocation();
      const data = await googleLogin(response.credential, location.latitude, location.longitude);

      toast.success("Google Login Successful!");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      toast.error(error.detail || "Google Login Failed!");
    }
  };

  const handleGoogleFailure = () => {
    toast.error("Google Sign-in was unsuccessful. Try again.");
  };



  // Function to get user's location
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ latitude, longitude });
          },
          (error) => {
            console.error("Location error:", error);
            toast.warn("Location access denied!");
            resolve({ latitude: null, longitude: null }); // Send null if location is denied
          }
        );
      } else {
        toast.warn("Geolocation not supported!");
        resolve({ latitude: null, longitude: null });
      }
    });
  }
  return (
    <div className="flex flex-col md:flex-row h-screen items-center justify-center bg-[#fff] p-4">
         {/* Toast Notifications */}
         <ToastContainer position="top-right" autoClose={3000} />
      {/* Left Section */}
      <div className="w-full md:w-1/2 p-8 text-center md:text-left">
        <h1 className="text-3xl md:text-[60ox] lg:text-[100px] font-bold text-[#2E86AB]">ZapSync</h1>
        <h2 className="mt-6 text-2xl font-semibold">Welcome, Back</h2>
        <p className="text-gray-600">Hey, welcome back to your special place</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 text-blue-600"
              />
              <span>Remember Me</span>
            </label>
            <a href="#" className="text-blue-500 hover:underline">Forgot Password?</a>
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center justify-center"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
          
          <div className="flex items-center justify-center my-4">
            <div className="border-b w-1/4"></div>
            <p className="px-2 text-gray-600">OR</p>
            <div className="border-b w-1/4"></div>
          </div>

          {/* Google OAuth Button */}
          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleFailure} />
          </div>
        </form>

        <p className="mt-4 text-sm">
          Don't have an account? <Link to="/register"> <a className="text-blue-500 hover:underline">Sign up</a></Link>
        </p>
      </div>

      {/* Right Section - Illustration */}
      <div className="hidden md:flex w-1/2 justify-center">
        <img src="/login image.png" alt="Cloud storage" className="max-w-md" />
      </div>
    </div> 
  );
}
