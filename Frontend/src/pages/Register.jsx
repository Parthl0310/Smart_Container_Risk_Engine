import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Logo from "../components/Logo";

import {
User,
Mail,
Lock,
Eye,
EyeOff,
Upload
} from "lucide-react";

function getStrength(pw){

if(!pw) return {score:0}

let score=0

if(pw.length>=6) score++
if(pw.length>=10) score++
if(/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++

return {score}

}

export default function Register(){

const navigate = useNavigate()
const {register:authRegister,user} = useAuth()

const fileRef = useRef(null)

const [name,setName]=useState("")
const [email,setEmail]=useState("")
const [password,setPassword]=useState("")
const [confirm,setConfirm]=useState("")
const [photo,setPhoto]=useState(null)
const [preview,setPreview]=useState(null)

const [showPw,setShowPw]=useState(false)
const [showCf,setShowCf]=useState(false)

const [loading,setLoading]=useState(false)

const strength = getStrength(password)

useEffect(()=>{
if(user) navigate("/dashboard",{replace:true})
},[user,navigate])

useEffect(()=>{
return ()=>{ if(preview) URL.revokeObjectURL(preview) }
},[preview])

const handlePhotoChange=(e)=>{

const file=e.target.files?.[0]

if(!file) return

if(file.size > 2*1024*1024){
toast.error("Photo must be under 2MB")
return
}

setPhoto(file)
setPreview(URL.createObjectURL(file))

}

const validate=()=>{

if(!name.trim()){
toast.error("Full name required")
return false
}

if(!email){
toast.error("Email required")
return false
}

if(!/\S+@\S+\.\S+/.test(email)){
toast.error("Enter valid email")
return false
}

if(!password){
toast.error("Password required")
return false
}

if(password.length<6){
toast.error("Minimum 6 characters")
return false
}

if(confirm!==password){
toast.error("Passwords do not match")
return false
}

return true

}

const handleSubmit=async(ev)=>{

ev.preventDefault()

if(!validate()) return

setLoading(true)

try{

const formData=new FormData()

formData.append("fullname",name.trim())
formData.append("email",email.trim())
formData.append("username",email.trim().split("@")[0])
formData.append("password",password)

if(photo) formData.append("avatar",photo)

await authRegister(formData)

toast.success("Account created")

navigate("/dashboard",{replace:true})

}catch(err){

toast.error(err?.message || "Registration failed")

}finally{
setLoading(false)
}

}

return(

<div
className="relative min-h-screen flex items-center justify-center bg-cover bg-center overflow-hidden"
style={{backgroundImage:"url('/src/assets/logistics-bg2.jpg')"}}
>

{/* LOGO */}
<div className="absolute top-6 left-6 z-20">
  <Logo to="/" />
</div>

{/* DARK OVERLAY */}
<div className="absolute inset-0 bg-black/40 pointer-events-none"/>

{/* PARTICLES */}
<div className="absolute inset-0 overflow-hidden pointer-events-none">

{[...Array(35)].map((_,i)=>(
<motion.div
key={i}
className="absolute w-1 h-1 bg-blue-400 rounded-full"
animate={{
y:["0%","100%"],
opacity:[0,1,0]
}}
transition={{
duration:6+Math.random()*4,
repeat:Infinity,
delay:Math.random()*3
}}
style={{left:`${Math.random()*100}%`}}
/>
))}

</div>

{/* CARD */}
<motion.div
initial={{opacity:0,y:30}}
animate={{opacity:1,y:0}}
transition={{duration:0.6}}
className="relative z-10 w-full max-w-md p-10 rounded-2xl
bg-white/25 backdrop-blur-[2px]
border border-white/30
shadow-2xl text-white"
>

{/* HEADER */}
<div className="flex items-center gap-3 mb-6">

<div className="w-10 h-10 bg-orange-400 flex items-center justify-center rounded-xl text-white">
⬡
</div>

<span className="text-sm font-bold tracking-widest">
SMARTCONTAINER · RISK ENGINE
</span>

</div>

<h2 className="text-3xl font-bold mb-6 text-white">
Create Analyst Account
</h2>

<form onSubmit={handleSubmit} noValidate className="space-y-5">

{/* PHOTO */}
<div className="flex items-center gap-4">

<div
className="w-16 h-16 rounded-xl bg-black/30 border border-white/20
flex items-center justify-center overflow-hidden cursor-pointer"
onClick={()=>fileRef.current?.click()}
>

{preview ?
<img src={preview} className="w-full h-full object-cover"/>
:
<User size={24}/>
}

</div>

<button
type="button"
onClick={()=>fileRef.current?.click()}
className="flex items-center gap-2 text-sm underline text-white/80"
>
<Upload size={16}/>
Upload Photo
</button>

<input
ref={fileRef}
type="file"
accept="image/*"
className="hidden"
onChange={handlePhotoChange}
/>

</div>

{/* NAME */}
<div className="flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3">
<User size={18}/>
<input
type="text"
placeholder="Full name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full bg-transparent outline-none text-white placeholder-white/70"
/>
</div>

{/* EMAIL */}
<div className="flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3">
<Mail size={18}/>
<input
type="email"
placeholder="Work email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full bg-transparent outline-none text-white placeholder-white/70"
/>
</div>

{/* PASSWORD */}
<div className="flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3">
<Lock size={18}/>
<input
type={showPw?"text":"password"}
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
className="w-full bg-transparent outline-none text-white placeholder-white/70"
/>
<button type="button" onClick={()=>setShowPw(!showPw)}>
{showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
</button>
</div>

{/* CONFIRM */}
<div className="flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3">
<Lock size={18}/>
<input
type={showCf?"text":"password"}
placeholder="Confirm password"
value={confirm}
onChange={(e)=>setConfirm(e.target.value)}
className="w-full bg-transparent outline-none text-white placeholder-white/70"
/>
<button type="button" onClick={()=>setShowCf(!showCf)}>
{showCf ? <EyeOff size={18}/> : <Eye size={18}/>}
</button>
</div>

{/* PASSWORD STRENGTH */}
{password && (
<div className="flex gap-1">
{[1,2,3].map(i=>(
<div
key={i}
className={`flex-1 h-1 rounded
${strength.score>=i ?
(strength.score==1?"bg-red-400":
strength.score==2?"bg-yellow-400":"bg-green-400")
:"bg-white/20"}
`}
/>
))}
</div>
)}

<button
type="submit"
disabled={loading}
className="w-full py-3 rounded-xl font-semibold bg-orange-400 hover:bg-orange-500 transition shadow-lg"
>
{loading ? "Creating..." : "Create Account →"}
</button>

</form>

<p className="text-center text-sm mt-6 text-white/80">
Already have account?{" "}
<Link to="/login" className="text-orange-300 hover:underline">
Login
</Link>
</p>

</motion.div>

</div>

)

}