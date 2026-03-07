import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8001";

/**
 * Send CSV file to ML API for risk prediction.
 * @param {string} filePath - Path to the uploaded CSV file
 * @returns {Promise<{predictions: Array<{Container_ID, Risk_Score, Risk_Level, Explanation}>}>}
 */
export async function predictRiskFromCSV(filePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), {
    filename: "containers.csv",
    contentType: "text/csv"
  });

  const response = await axios.post(`${ML_API_URL}/predict/`, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120000 // 2 min for large CSVs + LLM
  });

  return response.data;
}

