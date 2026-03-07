import mongoose, { Schema } from "mongoose";

const containerSchema = new Schema(
{
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  Container_ID: {
    type: String,
    required: true,
    index: true
  },

  "Declaration_Date (YYYY-MM-DD)": {
    type: String,
    required: true
  },

  Declaration_Time: {
    type: String,
    required: true
  },

  "Trade_Regime (Import / Export / Transit)": {
    type: String,
    enum: ["Import", "Export", "Transit"],
    required: true
  },

  Origin_Country: {
    type: String,
    required: true
  },

  Destination_Port: {
    type: String,
    required: true
  },

  Destination_Country: {
    type: String,
    required: true
  },

  HS_Code: {
    type: String,
    required: true
  },

  Importer_ID: {
    type: String,
    required: true
  },

  Exporter_ID: {
    type: String,
    required: true
  },

  Declared_Value: {
    type: Number,
    required: true
  },

  Declared_Weight: {
    type: Number,
    required: true
  },

  Measured_Weight: {
    type: Number,
    required: true
  },

  Shipping_Line: {
    type: String,
    required: true
  },

  Dwell_Time_Hours: {
    type: Number,
    required: true
  },

  riskScore: Number,

  riskLevel: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"]
  },

  explanationSummary: String,

  anomaly: String,

  action: {
    type: String,
    enum: ["Inspect", "Release", "Hold"]
  }

},
{ timestamps: true }
);

export const Container = mongoose.model("Container", containerSchema);