// // import dotenv from "dotenv";
// // import { fileURLToPath } from "url";
// // import { dirname, join } from "path";
// // import connectDB from "./db/index.js";
// // import { app } from "./app.js";

// // const __dirname = dirname(fileURLToPath(import.meta.url));
// // dotenv.config({ path: join(__dirname, "..", ".env") });

// // const PORT = process.env.PORT || 5000;

// // connectDB()
// //   .then(() => {
// //     app.listen(PORT, () => {
// //       console.log(`Backend running at http://localhost:${PORT}`);
// //     });
// //   })
// //   .catch((err) => {
// //     console.error("MongoDB connection failed:", err.message);
// //   });

// // // import mongoose from "mongoose";
// // // import {DB_NAME} from './constants.js';
// // // Approach 1
// // //ifi
// // /*
// // ;(async ()=>{
// //     try{
// //         await mongoose.connect(`{process.env.MONGO_URI}/${DB_NAME}`);
    
// //         app.on("errror",(err)=>{
// //             console.error("Express app error:", err);
// //             throw err;
// //         });

// //         app.listen(process.env.PORT,()=>{
// //             console.log(`App is listening on port ${process.env.PORT}`);
// //         })

// //     }catch(err){
// //         console.error("Database connection error:", err);
// //         throw err;
// //     }
// // })()
// // */



// // ── Load .env FIRST — before any other import reads process.env ───────────────
// // This must be the very first thing that runs.
// // dotenv.config() is synchronous so it's safe to call before imports in CJS,
// // but with ESM (import/export) Node resolves all imports before running code.
// // The fix: use a dedicated env.js loader OR keep dotenv at the top of app.js
// // which already runs before connectDB is called.
// //
// // Your app.js already calls dotenv.config() at the very top — so this file
// // only needs to import app (which triggers app.js, which loads .env) and then
// // call connectDB. That ordering is correct as long as app.js is imported first.


// console.log("=== index.js starting ===");
// import { fileURLToPath } from "url";
// import { dirname, join }  from "path";
// import dotenv             from "dotenv";

// // Resolve __dirname in ESM (not available natively like in CommonJS)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname  = dirname(__filename);

// // Load .env from the project root (one level above /src)
// // Must happen before connectDB or app reads any env variable
// dotenv.config({ path: join(__dirname, "..", ".env") });

// // ── Now safe to import modules that use process.env ───────────────────────────
// import connectDB   from "./db/index.js";
// import { app }     from "./app.js";

// const PORT = process.env.PORT || 5000;

// // ── Start server ──────────────────────────────────────────────────────────────
// const startServer = async () => {
//   try {
//     // Connect to MongoDB first — don't start HTTP server if DB fails
//     await connectDB();
//     console.log("✅ MongoDB connected successfully");

//     const server = app.listen(PORT, () => {
//       console.log(`🚀 Backend running at http://localhost:${PORT}`);
//       console.log(`📡 Environment : ${process.env.NODE_ENV || "development"}`);
//       console.log(`🗄️  Database    : ${process.env.MONGO_URI?.split("@").pop() || "local"}`);
//     });

//     // ── Graceful shutdown ───────────────────────────────────────────────────
//     // Closes DB connection and HTTP server cleanly on CTRL+C or process kill
//     const shutdown = (signal) => {
//       console.log(`\n⚠️  ${signal} received — shutting down gracefully...`);
//       server.close(() => {
//         console.log("🔴 HTTP server closed");
//         process.exit(0);
//       });
//     };

//     process.on("SIGTERM", () => shutdown("SIGTERM"));
//     process.on("SIGINT",  () => shutdown("SIGINT"));

//     // ── Unhandled promise rejections ────────────────────────────────────────
//     process.on("unhandledRejection", (reason) => {
//       console.error("❌ Unhandled Rejection:", reason);
//       server.close(() => process.exit(1));
//     });

//   } catch (err) {
//     console.error("❌ MongoDB connection failed:", err.message);
//     process.exit(1);   // Exit so nodemon/pm2 can restart the process
//   }
// };

// startServer();




// ─────────────────────────────────────────────────────────────────────────────
// src/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Entry point. dotenv is already loaded by nodemon via "-r dotenv/config"
// in package.json dev script — do NOT call dotenv.config() here again.
// ─────────────────────────────────────────────────────────────────────────────

console.log("=== index.js starting ===");
console.log("PORT      :", process.env.PORT       || "5000 (default)");
console.log("MONGO     :", process.env.MONGODB_URI ? "✅ loaded" : "❌ MISSING");
console.log("NODE_ENV  :", process.env.NODE_ENV   || "development (default)");

import connectDB from "./db/index.js";
import { app }   from "./app.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB before starting HTTP server
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
      console.log(`📡 Environment : ${process.env.NODE_ENV || "development"}`);
      console.log(`🗄️  Database    : ${process.env.MONGODB_URI?.split("@").pop() || "local"}`);
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────
    const shutdown = (signal) => {
      console.log(`\n⚠️  ${signal} — shutting down...`);
      server.close(() => {
        console.log("🔴 Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      console.error("❌ Unhandled Rejection:", reason);
      server.close(() => process.exit(1));
    });

  } catch (err) {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  }
};

startServer();