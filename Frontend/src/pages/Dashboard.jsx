import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import UploadCSV from "../components/UploadCSV";
import ManualEntryForm from "../components/ManualEntryForm";

import toast from "react-hot-toast";

import {
Package,
CheckCircle2,
ShieldAlert,
ShieldCheck,
Upload,
Plus,
User,
PieChart as PieIcon,
BarChart3
} from "lucide-react";

import {
PieChart,
Pie,
Cell,
Tooltip,
ResponsiveContainer,
BarChart,
Bar,
XAxis,
YAxis,
CartesianGrid
} from "recharts";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

function StatCard({ label, value, sub, Icon, color }) {

return(

<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">

<div className="flex justify-between items-center mb-3">

<span className="text-xs uppercase tracking-widest text-gray-500">
{label}
</span>

<Icon className={`w-5 h-5 ${color}`} />

</div>

<div className="text-3xl font-bold">{value}</div>

<div className="text-xs text-gray-400 mt-1 uppercase">{sub}</div>

</div>

)

}

const CustomTooltip = ({ active, payload }) => {

if(!active || !payload?.length) return null

return(

<div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow">

<p className="text-xs text-gray-500">{payload[0].name}</p>

<p className="text-sm font-semibold text-orange-500">
{payload[0].value} Containers
</p>

</div>

)

}

export default function Dashboard(){

const {user,isAdmin} = useAuth()

const hasFetchedRef = useRef(false)

const [summary,setSummary] = useState(null)
const [barData,setBarData] = useState([])
const [loading,setLoading] = useState(true)

const [showManual,setShowManual] = useState(false)
const [showUpload,setShowUpload] = useState(false)

const fetchData = async()=>{

setLoading(true)

try{

const endpoint = "/v1/container/"

const {data} = await api.get(endpoint)

let containers = data?.data ?? data?.containers ?? []

const lowRisk = containers.filter(c=>(c.riskLevel||c.risk_level)==="Low" || (c.riskLevel||c.risk_level)==="Low Risk").length
        const mediumRisk = containers.filter(c=>(c.riskLevel||c.risk_level)==="Medium" || (c.riskLevel||c.risk_level)==="Medium Risk").length
        const highRisk = containers.filter(c=>(c.riskLevel||c.risk_level)==="High" || (c.riskLevel||c.risk_level)==="Critical" || (c.riskLevel||c.risk_level)==="High Risk").length

setSummary({
total:containers.length,
lowRisk,
mediumRisk,
highRisk
})

const countryMap = {}

containers.forEach(c=>{
const key = c.Origin_Country || c.origin_country || "Unknown"
countryMap[key] = (countryMap[key] || 0) + 1
})

const sorted = Object.entries(countryMap)
.sort((a,b)=>b[1]-a[1])
.slice(0,6)
.map(([country,count])=>({
country,
count
}))

setBarData(sorted)

}
catch(err){

toast.error("Failed to load dashboard", { id: "failed-load-dashboard" })

}
finally{

setLoading(false)

}

}

useEffect(()=>{
if (hasFetchedRef.current) return
hasFetchedRef.current = true
fetchData()
},[])

const pieData = summary
?[
{ name:"Low Risk", value:summary.lowRisk },
{ name:"Medium Risk", value:summary.mediumRisk },
{ name:"High Risk", value:summary.highRisk }
]
:[]

return(

<div className="min-h-screen bg-gray-100 text-gray-800">

<Navbar/>

<main className="max-w-7xl mx-auto px-6 py-10">

{/* HEADER */}

<div className="flex justify-between items-center mb-10">

<div>

<div className="text-xs uppercase text-orange-500 font-semibold tracking-widest mb-1">
Risk Analysis Hub
</div>

<h1 className="text-3xl font-bold">
Welcome back {user?.fullname || user?.name}
</h1>

</div>

<div className="flex items-center gap-3">

<button
onClick={()=>setShowManual(true)}
className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
>
<Plus size={16}/>
Manual Entry
</button>

<button
onClick={()=>setShowUpload(true)}
className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
>
<Upload size={16}/>
Upload CSV
</button>

<div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
<User size={18}/>
</div>

</div>

</div>

{/* LOADING */}

{loading? (

<div className="flex justify-center items-center h-96">
<div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
</div>

):(

<div className="space-y-8">

{/* STATS */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

<StatCard
label="Total Manifests"
value={summary?.total ?? 0}
sub="Lifetime Shipments"
Icon={Package}
color="text-orange-500"
/>

<StatCard
label="Low Risk"
value={summary?.lowRisk ?? 0}
sub="Safe Containers"
Icon={CheckCircle2}
color="text-green-500"
/>

<StatCard
label="Medium Risk"
value={summary?.mediumRisk ?? 0}
sub="Monitor Closely"
Icon={ShieldCheck}
color="text-yellow-500"
/>

<StatCard
label="High Risk"
value={summary?.highRisk ?? 0}
sub="Inspection Required"
Icon={ShieldAlert}
color="text-red-500"
/>

</div>

{/* CHARTS */}

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

<div className="bg-white border rounded-xl p-6 shadow">

<div className="flex items-center gap-2 mb-6">
<PieIcon className="text-orange-500"/>
<h3 className="text-sm font-semibold">Risk Distribution</h3>
</div>

<div className="h-64">

<ResponsiveContainer width="100%" height="100%">

<PieChart>

<Pie
data={pieData}
innerRadius={60}
outerRadius={90}
paddingAngle={5}
dataKey="value"
>

{pieData.map((_,i)=>(
<Cell key={i} fill={PIE_COLORS[i]}/>
))}

</Pie>

<Tooltip content={<CustomTooltip/>}/>

</PieChart>

</ResponsiveContainer>

</div>

</div>

<div className="lg:col-span-2 bg-white border rounded-xl p-6 shadow">

<div className="flex items-center gap-2 mb-6">
<BarChart3 className="text-orange-500"/>
<h3 className="text-sm font-semibold">Origin Throughput</h3>
</div>

<div className="h-64">

<ResponsiveContainer width="100%" height="100%">

<BarChart data={barData}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="country"/>
<YAxis/>

<Tooltip content={<CustomTooltip/>}/>

<Bar
dataKey="count"
fill="#f97316"
radius={[6,6,0,0]}
/>

</BarChart>

</ResponsiveContainer>

</div>

</div>

</div>

</div>

)}

</main>

{/* MODALS */}

{showManual &&(

<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">

<div className="bg-white rounded-xl p-8 w-full max-w-2xl shadow-xl">

<ManualEntryForm
onSuccess={()=>{
setShowManual(false)
fetchData()
toast.success("Entry added")
}}
onCancel={()=>setShowManual(false)}
/>

</div>

</div>

)}

{showUpload &&(

<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">

<div className="bg-white rounded-xl p-8 w-full max-w-xl shadow-xl">

<UploadCSV
onSuccess={()=>{
setShowUpload(false)
fetchData()
toast.success("CSV uploaded")
}}
/>

</div>

</div>

)}

</div>

)

}