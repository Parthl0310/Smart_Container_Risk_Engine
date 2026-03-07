import { useState, useRef, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

import {
  UploadCloud,
  FileText,
  Loader2,
  X,
  CheckCircle,
  AlertTriangle,
  Database
} from "lucide-react";

/* ───────────────────────────────────────── */

const REQUIRED_HEADERS = [
  "Container_ID",
  "Declaration_Date (YYYY-MM-DD)",
  "Origin_Country",
  "HS_Code",
  "Declared_Value",
  "Declared_Weight",
];

const MAX_SIZE_MB = 10;

function extractHeaders(text) {
  return text.split("\n")[0].split(",").map(h => h.trim().replace(/"/g, ""));
}

function validateHeaders(headers) {
  return REQUIRED_HEADERS.filter(
    req => !headers.some(h => h.toLowerCase() === req.toLowerCase())
  );
}

const STATUS = {
  IDLE: "idle",
  VALIDATING: "validating",
  UPLOADING: "uploading",
  SUCCESS: "success",
  ERROR: "error"
};

export default function UploadCSV({ onSuccess, onError }) {

  const fileRef = useRef(null);

  const [dragging,setDragging] = useState(false);
  const [status,setStatus] = useState(STATUS.IDLE);
  const [file,setFile] = useState(null);
  const [progress,setProgress] = useState(0);
  const [result,setResult] = useState(null);
  const [errorMsg,setErrorMsg] = useState("");
  const [headers,setHeaders] = useState([]);

  const reset = () => {
    setStatus(STATUS.IDLE);
    setFile(null);
    setProgress(0);
    setResult(null);
    setErrorMsg("");
    setHeaders([]);

    if(fileRef.current) fileRef.current.value = "";
  };

  const processFile = useCallback(async (f)=>{

    setStatus(STATUS.VALIDATING);
    setErrorMsg("");

    if(!f.name.endsWith(".csv") && f.type !== "text/csv"){
      const msg="Unauthorized format. Only CSV manifests are accepted.";
      toast.error(msg);
      setErrorMsg(msg);
      setStatus(STATUS.ERROR);
      return;
    }

    if(f.size > MAX_SIZE_MB * 1024 * 1024){
      const msg=`Payload exceeds ${MAX_SIZE_MB}MB safety limit.`;
      toast.error(msg);
      setErrorMsg(msg);
      setStatus(STATUS.ERROR);
      return;
    }

    try{

      const text = await f.text();
      const hdrs = extractHeaders(text);
      const missing = validateHeaders(hdrs);

      if(missing.length>0){
        const msg=`Structural error. Missing columns: ${missing.join(", ")}`;
        toast.error(msg);
        setErrorMsg(msg);
        setStatus(STATUS.ERROR);
        return;
      }

      const rowCount = text.trim().split("\n").length - 1;

      setFile(f);
      setHeaders(hdrs);
      setResult({previewCount:rowCount});
      setStatus(STATUS.IDLE);

      toast.success("CSV structure validated");

    }catch(e){
      const msg="Failed to parse manifest file.";
      toast.error(msg);
      setErrorMsg(msg);
      setStatus(STATUS.ERROR);
    }

  },[]);

  const onDragOver=(e)=>{e.preventDefault();setDragging(true)};
  const onDragLeave=(e)=>{e.preventDefault();setDragging(false)};
  const onDrop=(e)=>{e.preventDefault();setDragging(false);const d=e.dataTransfer.files?.[0];if(d)processFile(d)};
  const onFileChange=(e)=>{const p=e.target.files?.[0];if(p)processFile(p)};

  const handleUpload=async()=>{

    if(!file) return;

    setStatus(STATUS.UPLOADING);
    setProgress(0);

    const formData=new FormData();
    formData.append("file",file);

    try{

      const {data}=await api.post("/v1/container/upload",formData,{
        headers:{"Content-Type":"multipart/form-data"},
        onUploadProgress:(e)=>{
          if(e.total) setProgress(Math.round((e.loaded/e.total)*100));
        }
      });

      setProgress(100);

      setResult({
        count:data?.data?.totalContainers ?? data?.totalContainers ?? data?.count,
        batchId:data?.data?.batchId ?? data?.batchId,
        previewCount:result?.previewCount
      });

      setStatus(STATUS.SUCCESS);

      toast.success("Manifest uploaded successfully");

      if(onSuccess) onSuccess(data.batchId);

    }catch(err){

      const msg=err?.response?.data?.message || "Transmission failed.";

      toast.error(msg);

      setErrorMsg(msg);
      setStatus(STATUS.ERROR);

      if(onError) onError(msg);
    }
  };

  return(

  <div className="flex flex-col gap-6">

  {/* DROP ZONE */}

  {status !== STATUS.SUCCESS && (

  <div
  onDragOver={onDragOver}
  onDragLeave={onDragLeave}
  onDrop={onDrop}
  onClick={()=>!file && fileRef.current?.click()}
  className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer
  ${dragging
  ? "border-orange-500 bg-orange-50"
  : file
  ? "border-gray-300 bg-gray-50"
  : "border-gray-300 hover:border-orange-400 hover:bg-orange-50"}
  `}
  >

  <input
  ref={fileRef}
  type="file"
  accept=".csv,text/csv"
  className="hidden"
  onChange={onFileChange}
  />

  {status === STATUS.VALIDATING ? (

  <div className="flex flex-col items-center gap-4">
  <Loader2 className="w-10 h-10 animate-spin text-orange-500"/>
  <p className="text-xs text-gray-500 font-semibold">Analyzing CSV Structure...</p>
  </div>

  ) : file ? (

  <div className="flex items-center gap-4 text-left">

  <FileText className="w-12 h-12 text-orange-500"/>

  <div className="flex-1">
  <p className="font-semibold">{file.name}</p>
  <p className="text-xs text-gray-500">
  {(file.size/1024).toFixed(1)} KB
  </p>
  </div>

  <button
  onClick={(e)=>{e.stopPropagation();reset();}}
  className="text-gray-400 hover:text-red-500"
  >
  <X/>
  </button>

  </div>

  ) : (

  <div className="flex flex-col items-center gap-4">

  <UploadCloud className="w-14 h-14 text-orange-500"/>

  <p className="font-semibold text-gray-700">
  Deploy Manifest CSV
  </p>

  <p className="text-xs text-gray-500">
  Drag & drop or click to browse
  </p>

  <p className="text-xs text-gray-400">
  Max payload {MAX_SIZE_MB}MB
  </p>

  </div>

  )}

  </div>

  )}

  {/* REQUIRED TELEMETRY FIELDS */}

  {status === STATUS.IDLE && !file && (

  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

  <div className="flex items-center gap-2 mb-4">
  <Database size={16} className="text-orange-500"/>
  <p className="text-xs font-bold tracking-widest uppercase text-gray-500">
  Required Telemetry Fields
  </p>
  </div>

  <div className="flex flex-wrap gap-2">

  {REQUIRED_HEADERS.map(h=>(
  <span
  key={h}
  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-semibold text-gray-700"
  >
  {h}
  </span>
  ))}

  </div>

  <div className="mt-5 p-4 bg-orange-50 border border-orange-200 rounded-lg">

  <p className="text-xs text-orange-700 font-medium leading-relaxed">

  <span className="font-bold text-orange-600">PRO TIP:</span>{" "}
  Adding extended metadata like{" "}
  <span className="font-mono bg-white px-1 rounded font-semibold">
  Measured_Weight
  </span>{" "}
  or{" "}
  <span className="font-mono bg-white px-1 rounded font-semibold">
  Dwell_Time
  </span>{" "}
  significantly increases the AI Confidence Level.

  </p>

  </div>

  </div>

  )}

  {/* PROGRESS */}

  {status === STATUS.UPLOADING && (

  <div className="bg-white border rounded-xl p-6 shadow">

  <div className="flex items-center justify-between mb-3">

  <div className="flex items-center gap-2">
  <Loader2 className="animate-spin text-orange-500"/>
  <p className="text-sm font-semibold">Uploading Manifest...</p>
  </div>

  <span className="text-orange-500 font-bold">{progress}%</span>

  </div>

  <div className="w-full h-2 bg-gray-200 rounded">

  <div
  className="h-full bg-orange-500 rounded"
  style={{width:`${progress}%`}}
  />

  </div>

  </div>

  )}

  {/* SUCCESS */}

  {status === STATUS.SUCCESS && result && (

  <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">

  <CheckCircle className="mx-auto text-green-600 w-12 h-12"/>

  <p className="mt-3 font-semibold text-green-700">
  Transmission Verified
  </p>

  <p className="text-sm text-green-600 mt-1">
  {(result.count ?? result.previewCount ?? 0).toLocaleString()} containers processed
  </p>

  <button
  onClick={reset}
  className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
  >
  New Manifest Entry
  </button>

  </div>

  )}

  {/* ERROR */}

  {status === STATUS.ERROR && (

  <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex gap-4">

  <AlertTriangle className="text-red-500"/>

  <div>

  <p className="font-semibold text-red-700">
  System Refusal
  </p>

  <p className="text-sm text-red-600">
  {errorMsg}
  </p>

  <button
  onClick={reset}
  className="mt-3 text-xs font-semibold text-red-600 underline"
  >
  Retry Protocol
  </button>

  </div>

  </div>

  )}

  {/* UPLOAD BUTTON */}

  {file && status === STATUS.IDLE && (

  <button
  onClick={handleUpload}
  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow"
  >
  Execute Analysis Pipeline →
  </button>

  )}

  </div>

  );

}