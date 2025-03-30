import { useState } from "react";
import { Link } from "react-router-dom";


export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [Phone, setPhone] = useState("");
  const [name, setName] = useState(""); 


  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password, rememberMe });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen items-center justify-center bg-[#fff] p-4">
      {/* Left Section */}
      <div className="w-full md:w-1/2 p-8 text-center md:text-left">
        <h1 className="text-3xl md:text-[60ox] lg:text-[100px] font-bold text-[#2E86AB]">ZapSync</h1>
        <h2 className="mt-6 text-2xl font-semibold">Register Your Account</h2>
        <p className="text-gray-600">Create an account to join the Zapsync community</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
            type="Text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <input
            type="tel"
            placeholder="Phone"
            value={Phone}
            onChange={(e) => setPhone(e.target.value)}
            pattern="[0-9]{10}"
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
            className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-sm">
          Already have an account? <Link to ="/"> <a href="#" className="text-blue-500 hover:underline">Sign in</a> </Link> 
        </p>
      </div>

      {/* Right Section - Illustration */}
      <div className="hidden md:flex w-1/2 justify-center">
        <img src="/login image.png" alt="Cloud storage" className="max-w-md" />
      </div>
    </div>
  );
}
