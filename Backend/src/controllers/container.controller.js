import fs from "fs";
import path from "path";
import os from "os";
import csv from "csv-parser";
import mongoose from "mongoose";

import { Container } from "../models/container.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { predictRiskFromCSV } from "../services/mlApi.service.js";

/*
UPLOAD CSV - Parse, call ML API for risk prediction, save to DB
*/
const uploadContainerCSV = asyncHandler(async (req, res) => {

  if (!req.file) {
    throw new ApiError(400, "CSV file is required");
  }

  const filePath = req.file.path;
  const containers = [];

  await new Promise((resolve, reject) => {

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {

        if (!row["Container_ID"]) return;

        containers.push({

          userId: req.user._id,

          Container_ID: row["Container_ID"],

          "Declaration_Date (YYYY-MM-DD)": row["Declaration_Date (YYYY-MM-DD)"] || row["Declaration_Date"],

          Declaration_Time: row["Declaration_Time"],

          "Trade_Regime (Import / Export / Transit)":
            row["Trade_Regime (Import / Export / Transit)"] || row["Trade_Regime"],

          Origin_Country: row["Origin_Country"],

          Destination_Port: row["Destination_Port"],

          Destination_Country: row["Destination_Country"],

          HS_Code: row["HS_Code"],

          Importer_ID: row["Importer_ID"],

          Exporter_ID: row["Exporter_ID"],

          Declared_Value: Number(row["Declared_Value"] || 0),

          Declared_Weight: Number(row["Declared_Weight"] || 0),

          Measured_Weight: Number(row["Measured_Weight"] || 0),

          Shipping_Line: row["Shipping_Line"],

          Dwell_Time_Hours: Number(row["Dwell_Time_Hours"] || 0)

        });

      })
      .on("end", resolve)
      .on("error", reject);

  });

  if (containers.length === 0) {
    fs.unlinkSync(filePath);
    throw new ApiError(400, "CSV contains no valid rows");
  }

  // Call ML API for risk predictions
  let predictionsMap = {};
  try {
    const { predictions } = await predictRiskFromCSV(filePath);
    predictions.forEach((p) => {
      predictionsMap[String(p.Container_ID)] = {
        riskScore: p.Risk_Score,
        riskLevel: p.Risk_Level === "Critical" ? "High" : p.Risk_Level,
        explanationSummary: p.Explanation
      };
    });
  } catch (mlErr) {
    console.error("ML API error:", mlErr.message);
    // Continue without risk scores if ML service unavailable
  }

  // Merge risk data into containers
  containers.forEach((c) => {
    const pred = predictionsMap[c.Container_ID];
    if (pred) {
      c.riskScore = pred.riskScore;
      c.riskLevel = pred.riskLevel;
      c.explanationSummary = pred.explanationSummary;
    }
  });

  const insertedContainers = await Container.insertMany(containers);

  fs.unlinkSync(filePath);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        totalContainers: insertedContainers.length,
        count: insertedContainers.length
      },
      "CSV uploaded and analyzed successfully"
    )
  );

});


/*
MANUAL ENTRY - Create container and optionally run ML risk analysis
*/
const createSingleContainer = asyncHandler(async (req, res) => {

  const containerData = { userId: req.user._id, ...req.body };

  let riskData = {};
  let tmpPath = null;
  try {
    tmpPath = createTempCSVForSingle(containerData);
    const { predictions } = await predictRiskFromCSV(tmpPath);
    if (predictions?.[0]) {
      const p = predictions[0];
      riskData = {
        riskScore: p.Risk_Score,
        riskLevel: p.Risk_Level === "Critical" ? "High" : p.Risk_Level,
        explanationSummary: p.Explanation,
      };
    }
  } catch (mlErr) {
    console.error("ML API error (manual entry):", mlErr.message);
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }

  const container = await Container.create({ ...containerData, ...riskData });

  return res.status(201).json(
    new ApiResponse(
      201,
      container,
      "Container created successfully"
    )
  );

});

function createTempCSVForSingle(row) {
  const tmpPath = path.join(os.tmpdir(), `container_${Date.now()}.csv`);
  const headers = [
    "Container_ID", "Declaration_Date (YYYY-MM-DD)", "Declaration_Time",
    "Trade_Regime (Import / Export / Transit)", "Origin_Country", "Destination_Country",
    "Destination_Port", "HS_Code", "Importer_ID", "Exporter_ID", "Declared_Value",
    "Declared_Weight", "Measured_Weight", "Shipping_Line", "Dwell_Time_Hours"
  ];
  const getVal = (h) => row[h] ?? "";
  const line = headers.map((h) => {
    const v = String(getVal(h));
    return v.includes(",") ? `"${v}"` : v;
  }).join(",");
  fs.writeFileSync(tmpPath, headers.join(",") + "\n" + line);
  return tmpPath;
}


/*
GET USER CONTAINERS
*/
const getUserContainers = asyncHandler(async (req, res) => {

  const containers = await Container.find({
    userId: req.user._id
  }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      containers,
      "User containers fetched"
    )
  );

});


/*
GET SINGLE CONTAINER
*/
const getContainerById = asyncHandler(async (req, res) => {

  const container = await Container.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!container) {
    throw new ApiError(404, "Container not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      container,
      "Container fetched"
    )
  );

});


/*
UPDATE ML PREDICTION
*/
const updatePrediction = asyncHandler(async (req, res) => {

  const {
    riskScore,
    riskLevel,
    explanationSummary,
    anomaly,
    action
  } = req.body;

  const container = await Container.findByIdAndUpdate(
    req.params.id,
    {
      riskScore,
      riskLevel,
      explanationSummary,
      anomaly,
      action
    },
    { new: true }
  );

  if (!container) {
    throw new ApiError(404, "Container not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      container,
      "Prediction updated"
    )
  );

});


/*
RISK ANALYTICS
*/
const getRiskAnalytics = asyncHandler(async (req, res) => {

  const stats = await Container.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $group: {
        _id: "$riskLevel",
        count: { $sum: 1 }
      }
    }
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      stats,
      "Analytics fetched"
    )
  );

});


export {
  uploadContainerCSV,
  createSingleContainer,
  getUserContainers,
  getContainerById,
  updatePrediction,
  getRiskAnalytics
};