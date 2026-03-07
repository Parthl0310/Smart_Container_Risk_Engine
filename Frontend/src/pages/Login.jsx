import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Logo from "../components/Logo";

export default function Login() {

  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const validate = () => {

    const e = {};

    if (!email) {
      e.email = "Email required";
      toast.error("Email is required");
    }

    else if (!/\S+@\S+\.\S+/.test(email)) {
      e.email = "Invalid email";
      toast.error("Enter a valid email");
    }

    if (!password) {
      e.password = "Password required";
      toast.error("Password is required");
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {

      const user = await login(email.trim(), password);

      if (user && (user._id || user.id)) {
        toast.success("Login successful");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error("Invalid credentials");
      }

    } catch (err) {
      const msg = err?.response?.data?.message || "Server error";
      toast.error(msg);
    } finally {

      setLoading(false);

    }

  };

  return (

    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('/src/assets/logistics-bg.jpg')"
      }}
    >

      {/* LOGO */}
      <div className="absolute top-6 left-6 z-20">
        <Logo to="/" />
      </div>

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      {/* LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md p-10 rounded-2xl
        bg-white/25 backdrop-blur-[2px]
        border border-white/30
        shadow-2xl text-white"
      >

        {/* ICON */}
        <div className="flex justify-center mb-6">

          <div className="w-14 h-14 rounded-full
          bg-orange-400 flex items-center justify-center text-white">

            ⬡

          </div>

        </div>

        {/* TITLE */}
        <h2 className="text-center text-3xl font-semibold text-white">
          Welcome Back
        </h2>

        <p className="text-center text-sm text-white/80 mb-8">
          Sign in to continue your journey
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* EMAIL */}
          <div className="flex items-center gap-2
          bg-black/30 backdrop-blur-md
          rounded-lg px-3 border border-white/20">

            <Mail size={18} className="text-white"/>

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e)=>{
                setEmail(e.target.value)
                setErrors(p=>({...p,email:""}))
              }}
              className="w-full bg-transparent py-3 outline-none text-sm text-white placeholder-white/70"
            />

          </div>

          {/* PASSWORD */}
          <div className="flex items-center gap-2
          bg-black/30 backdrop-blur-md
          rounded-lg px-3 border border-white/20">

            <Lock size={18} className="text-white"/>

            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e)=>{
                setPassword(e.target.value)
                setErrors(p=>({...p,password:""}))
              }}
              className="w-full bg-transparent py-3 outline-none text-sm text-white placeholder-white/70"
            />

            <button
              type="button"
              onClick={()=>setShowPw(!showPw)}
              className="text-white"
            >
              {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>

          </div>

          {/* LOGIN BUTTON */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold
            bg-orange-400 hover:bg-orange-600
            transition text-white shadow-lg"
          >

            {loading ? "Authenticating..." : "Sign In"}

          </motion.button>

        </form>

        {/* REGISTER LINK */}
        <p className="text-center text-sm text-white/80 mt-6">

          Don't have an Account?{" "}

          <Link
            to="/register"
            className="text-orange-300 hover:underline"
          >
            Sign Up for Free
          </Link>

        </p>

      </motion.div>

    </div>

  );

}