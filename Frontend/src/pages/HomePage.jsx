import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

import {
Upload,
Brain,
Zap,
BarChart3
} from "lucide-react";

function StepCard({ num, icon: Icon, title, desc }) {

return (

<div className="relative bg-[#fff7f3]
border border-orange-200
rounded-2xl p-8 text-center
shadow-sm
transition-all duration-300 ease-in-out
hover:shadow-xl hover:-translate-y-2
hover:rounded-[30px] hover:border-orange-400">

<div className="absolute -top-3 left-1/2 -translate-x-1/2
bg-orange-500 text-white text-xs
px-4 py-1 rounded-full font-semibold">

STEP {num}

</div>

<div className="flex justify-center mt-4 mb-4">

<div className="w-14 h-14 rounded-full
bg-orange-100 flex items-center justify-center">

<Icon size={26} className="text-orange-500"/>

</div>

</div>

<h3 className="text-lg font-semibold text-gray-800 mb-2">
{title}
</h3>

<p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
{desc}
</p>

</div>

)

}

export default function HomePage(){

const navigate = useNavigate()
const {user,loading} = useAuth()

useEffect(()=>{
if(!loading && user){
navigate("/dashboard",{replace:true})
}
},[user,loading,navigate])


const steps=[

{
num:"01",
icon:Upload,
title:"Upload Container Data",
desc:"Drag & drop your CSV shipment file. Supports standard customs declaration formats."
},

{
num:"02",
icon:Brain,
title:"AI Analyzes Shipment Patterns",
desc:"XGBoost + Isolation Forest detect anomalies across shipment patterns."
},

{
num:"03",
icon:Zap,
title:"Risk Prediction Generated",
desc:"Each container receives a real-time risk score with SHAP explanations."
},

{
num:"04",
icon:BarChart3,
title:"View Dashboard Insights",
desc:"Interactive charts and tables help analysts investigate high-risk shipments."
}

]

return(

<div className="min-h-screen text-white overflow-hidden">

{/* NAVBAR */}

{/* NAVBAR */}

{/* NAVBAR */}

<nav className="absolute top-0 left-0 w-full z-20">

  <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">

    {/* LOGO LEFT */}
    <div className="flex items-center">
      <Logo />
    </div>

    {/* SIGN IN BUTTON RIGHT */}
    <div>
      <button
        onClick={() => navigate("/login")}
        className="px-7 py-3 rounded-xl text-white font-medium
        bg-gradient-to-r from-orange-500 to-orange-600
        hover:opacity-90 transition-all duration-300
        shadow-[0_8px_25px_rgba(255,115,0,0.35)]"
      >
        Sign In/Register →
      </button>
    </div>

  </div>

</nav>

{/* HERO */}

<section
className="relative min-h-screen flex items-center justify-center text-center bg-cover bg-center"
style={{
backgroundImage:"url('/src/assets/herosection.jpg')"
}}
>

<div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-[1px]"/>

<div className="relative max-w-4xl mx-auto px-6">

<h1 className="text-5xl md:text-7xl font-bold">

SmartContainer

<span className="block text-orange-400 mt-2">
Risk Engine
</span>

</h1>

<p className="text-slate-300 mt-6 text-lg">

AI-powered system that detects high-risk containers and improves
customs inspection efficiency using machine learning.

</p>

<div className="flex justify-center gap-4 mt-10">

<button
onClick={()=>navigate("/register")}
className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 hover:opacity-90"
>
Get Started →
</button>

</div>

</div>

</section>


{/* HOW IT WORKS */}

<section className="py-28 bg-white">

<div className="max-w-6xl mx-auto px-6 text-center">

<h2 className="text-5xl text-black mt-6">
How It Works
</h2>

<p className="text-black/80 max-w-xl mx-auto mt-3">
Our AI system analyzes shipment data and predicts container risk using machine learning models.
</p>

<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 max-w-4xl mx-auto">

{steps.map((s)=>(
<StepCard key={s.num} {...s}/>
))}

</div>

</div>

</section>


{/* CTA */}

<section
className="relative py-32 text-center bg-cover bg-center"
style={{
backgroundImage:"url('/src/assets/herosection.jpg')"
}}
>

<div className="absolute inset-0 bg-black/80 backdrop-blur-[1px]"/>

<div className="relative">

<h2 className="text-4xl font-bold">
Ready to screen your shipments?
</h2>

<p className="text-slate-400 mt-4">
Create a free account and start analyzing container risks instantly.
</p>

<div className="flex justify-center gap-4 mt-10">

<button
onClick={()=>navigate("/register")}
className="px-8 py-3 rounded-xl text-white font-semibold
bg-gradient-to-r from-orange-500 to-orange-600
hover:from-orange-600 hover:to-orange-700
transition-all duration-300
shadow-[0_8px_25px_rgba(255,115,0,0.35)]"
>
Create Free Account →
</button>

</div>

</div>

</section>


{/* FOOTER */}

<footer className="bg-[#f6f6f6] text-gray-700 pt-20 pb-10">

<div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">

<div>

<h3 className="text-3xl font-bold text-blue-900 mb-4">
SmartContainer
</h3>

<p className="text-sm text-gray-500 max-w-xs">
AI-powered container risk analysis platform helping customs
inspect shipments faster and smarter.
</p>

<div className="flex gap-3 mt-6">

<div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
✉
</div>

<div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
📷
</div>

</div>

</div>


<div>

<h4 className="font-semibold text-lg mb-4">
Company
</h4>

<ul className="space-y-3 text-sm text-gray-600">

<li className="hover:text-orange-500 cursor-pointer">
About Us
</li>

<li className="hover:text-orange-500 cursor-pointer">
How It Works
</li>

<li className="hover:text-orange-500 cursor-pointer">
Contact
</li>

</ul>

</div>


<div>

<h4 className="font-semibold text-lg mb-4">
Support
</h4>

<ul className="space-y-3 text-sm text-gray-600">

<li className="hover:text-orange-500 cursor-pointer">
Help Center
</li>

<li className="hover:text-orange-500 cursor-pointer">
Privacy Policy
</li>

<li className="hover:text-orange-500 cursor-pointer">
Terms of Service
</li>

</ul>

</div>


<div>

<h4 className="font-semibold text-lg mb-4">
Join Our Newsletter
</h4>

<div className="w-full max-w-sm">

<div className="flex w-full border border-orange-300 rounded-full bg-white">

<input
type="email"
placeholder="Your email address"
className="flex-1 px-5 py-3 text-sm outline-none"
/>

<button
className="px-6 py-3 bg-orange-500 text-white text-sm font-semibold 
hover:bg-orange-600 transition whitespace-nowrap rounded-r-full"
>
Subscribe
</button>

</div>

</div>

</div>

</div>


<div className="max-w-7xl mx-auto px-6 mt-16 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">

© 2026 SmartContainer. All rights reserved. Made with ❤️ for global logistics.

</div>

</footer>

</div>

)

}