import pandas as pd
import pickle
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from typing import TypedDict
from langgraph.graph import StateGraph

# -------------------------------
# 1 Load Model and Feature List
# -------------------------------

with open("models/xgboost_risk_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("models/model_features.pkl", "rb") as f:
    feature_columns = pickle.load(f)

print("Model Loaded")

# -------------------------------
# 2 Preprocess Function
# -------------------------------

def rule_based_risk(row):

    score = 0

    # 1 Weight mismatch
    if row["Weight_Deviation_Percent"] > 10:
        score += 15

    # 2 High cargo value
    if row["Declared_Value"] > 50000:
        score += 10

    # 3 Long dwell time
    if row["Dwell_Time_Hours"] > 48:
        score += 10

    # 4 Import regime
    if row["Trade_Regime (Import / Export / Transit)"] == "Import":
        score += 5

    # 5 High risk country
    risky_countries = ["CountryA", "CountryB", "CountryC"]
    if row["Origin_Country"] in risky_countries:
        score += 15

    # 6 Sensitive HS Code
    risky_hs = ["8542", "3004", "8703"]
    if str(row["HS_Code"])[:4] in risky_hs:
        score += 10

    # 7 Value to weight anomaly
    if row["Declared_Value"] / max(row["Declared_Weight"],1) > 500:
        score += 10

    return min(score,100)

def preprocess_data(df):

    df["Declaration_Date (YYYY-MM-DD)"] = pd.to_datetime(df["Declaration_Date (YYYY-MM-DD)"])
    df["Declaration_Time"] = pd.to_datetime(df["Declaration_Time"], format="%H:%M:%S", errors="coerce")

    df["hour"] = df["Declaration_Time"].dt.hour
    df["weekday"] = df["Declaration_Date (YYYY-MM-DD)"].dt.weekday

    df["weight_difference"] = df["Measured_Weight"] - df["Declared_Weight"]

    df["weight_diff_percent"] = (
        df["weight_difference"] / df["Declared_Weight"]
    ) * 100

    df["high_weight_mismatch"] = (abs(df["weight_diff_percent"]) > 10).astype(int)
    
    df["value_per_weight"] = df["Declared_Value"] / df["Declared_Weight"].replace(0,1)

    threshold = df["value_per_weight"].quantile(0.1)
    df["low_value_risk"] = (df["value_per_weight"] < threshold).astype(int)

    high_risk_hs = ["24","27","30","85"]
    df["hs_prefix"] = df["HS_Code"].astype(str).str[:2]
    df["high_risk_hs"] = (df["hs_prefix"].isin(high_risk_hs)).astype(int)

    df["importer_shipments"] = df.groupby("Importer_ID")["Container_ID"].transform("count")

    df["exporter_shipments"] = df.groupby("Exporter_ID")["Container_ID"].transform("count")

    df["new_importer"] = (df["importer_shipments"] < 5).astype(int)

    df["new_exporter"] = (df["exporter_shipments"] < 5).astype(int)

    df["night_shipment"] = ((df["hour"] < 6) | (df["hour"] > 22)).astype(int)

    df["weekend_flag"] = (df["weekday"] >= 5).astype(int)

    df["long_dwell_time"] = (df["Dwell_Time_Hours"] > 72).astype(int)

    df["cargo_density"] = df["Declared_Weight"] / df["Declared_Value"].replace(0,1)

    threshold = df["Declared_Value"].quantile(0.9)

    df["high_value_cargo"] = (df["Declared_Value"] > threshold).astype(int)

    df["Weight_Deviation_Percent"] = (abs(df["Declared_Weight"] - df["Measured_Weight"]) / df["Declared_Weight"]) * 100

    df["Rule_Risk_Score"] = df.apply(rule_based_risk, axis=1)

    # Weight difference
    df["Weight_Diff"] = abs(df["Declared_Weight"] - df["Measured_Weight"])

    # Feature based scoring
    df["Feature_Risk_Score"] = (df["Weight_Diff"] * 0.05 +df["Declared_Value"] * 0.0002 +df["Dwell_Time_Hours"] * 0.5)

    df["Final_Risk_Score"] = (df["Rule_Risk_Score"] +df["Feature_Risk_Score"])
    df["Final_Risk_Score"] = df["Final_Risk_Score"].clip(0,100)

    return df


# -------------------------------
# 3 Risk Category Function
# -------------------------------

def get_risk_category(score):

    if score < 35:
        return "Low Risk"

    elif score < 70:
        return "Medium Risk"

    else:
        return "High Risk"


# -------------------------------
# 4 Predict Risk
# -------------------------------

def predict_risk(df):

    df["Risk_Category"] = df["Final_Risk_Score"].apply(get_risk_category)

    return df


# -------------------------------
# 5 Detect anomalies (for LLM)
# -------------------------------
def detect_anomalies(row):

    anomalies = []

    if row["high_weight_mismatch"] == 1:
        anomalies.append("weight mismatch")

    if row["night_shipment"] == 1:
        anomalies.append("night shipment")

    if row["weekend_flag"] == 1:
        anomalies.append("weekend shipment")

    if row["long_dwell_time"] == 1:
        anomalies.append("long dwell time")

    if row["new_importer"] == 1:
        anomalies.append("new importer")

    if row["new_exporter"] == 1:
        anomalies.append("new exporter")

    if row["high_value_cargo"] == 1:
        anomalies.append("high value cargo")

    if row["low_value_risk"] == 1:
        anomalies.append("suspicious low value")

    return anomalies

# -------------------------------
# 6 Generate LLM Explanation
# -------------------------------
os.environ["GOOGLE_API_KEY"] = "AIzaSyAss9A_P0RQuAb8FU6A2GgiUpqrLHo81F0"

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.3,
    model_kwargs={
        "thinking": True
    }
)


prompt = PromptTemplate(
    input_variables=["risk","anomalies"],
    template="""
You are a customs risk analysis assistant.

Risk Label: {risk}

Features:
{anomalies}

Explain the reason for the risk.

Rules:
- Maximum 20 words
- Mention only important anomalies
- Explain why this risk is happening
- If low risk say normal behaviour

Short explanation:
"""
)


class State(TypedDict):

    risk: str
    anomalies: str
    explanation: str


def generate_explanation(state: State):

    message = prompt.format(
        risk=state["risk"],
        anomalies=state["anomalies"]
    )

    response = llm.invoke(message)

    return {"explanation": response.content}


builder = StateGraph(State)

builder.add_node("llm_explainer", generate_explanation)

builder.set_entry_point("llm_explainer")

graph = builder.compile()


# -------------------------------
# 7 Full Pipeline
# -------------------------------

# def run_pipeline(input_csv):
    
#     df = pd.read_csv(input_csv)

#     df = preprocess_data(df)

#     df = predict_risk(df)

#     print("Preparing anomaly patterns...")

#     df["anomalies"] = df.apply(detect_anomalies, axis=1)

#     df["anomaly_text"] = df["anomalies"].apply(
#         lambda x: ", ".join(sorted(x)) if len(x) > 0 else "no anomalies"
#     )

#     df["pattern"] = df["Risk_Category"] + "|" + df["anomaly_text"]

#     unique_patterns = df["pattern"].unique()

#     print("Unique patterns:", len(unique_patterns))

#     pattern_explanations = {}

#     print("Calling LLM for unique patterns...")

#     for pattern in unique_patterns:

#         risk, anomalies = pattern.split("|", 1)

#         result = graph.invoke({
#             "risk": risk,
#             "anomalies": anomalies
#         })

#         pattern_explanations[pattern] = result["explanation"]

#     df["Risk_Explanation"] = df["pattern"].map(pattern_explanations)

#     os.makedirs("outputs", exist_ok=True)
#     output_file = "outputs/final_container_risk_report.csv"
#     df.to_csv(output_file, index=False)

#     print("Final CSV Generated")

#     return output_file


def run_pipeline(input_csv):

    df = pd.read_csv(input_csv)

    # Normalize column names for flexibility
    if "Declaration_Date" in df.columns and "Declaration_Date (YYYY-MM-DD)" not in df.columns:
        df["Declaration_Date (YYYY-MM-DD)"] = df["Declaration_Date"]
    if "Trade_Regime" in df.columns and "Trade_Regime (Import / Export / Transit)" not in df.columns:
        df["Trade_Regime (Import / Export / Transit)"] = df["Trade_Regime"]

    df = preprocess_data(df)

    df = predict_risk(df)

    print("Preparing anomaly patterns...")

    df["anomalies"] = df.apply(detect_anomalies, axis=1)

    df["anomaly_text"] = df["anomalies"].apply(
        lambda x: ", ".join(sorted(x)) if len(x) > 0 else "no anomalies"
    )

    df["pattern"] = df["Risk_Category"] + "|" + df["anomaly_text"]

    unique_patterns = df["pattern"].unique()

    print("Unique patterns:", len(unique_patterns))

    pattern_explanations = {}

    print("Calling LLM for unique patterns...")

    for pattern in unique_patterns:

        risk, anomalies = pattern.split("|", 1)

        result = graph.invoke({
            "risk": risk,
            "anomalies": anomalies
        })

        pattern_explanations[pattern] = result["explanation"]

    df["Risk_Explanation"] = df["pattern"].map(pattern_explanations)

    os.makedirs("outputs", exist_ok=True)

    output_file = "outputs/final_container_risk_report.csv"

    df.to_csv(output_file, index=False)

    print("Final CSV Generated")

    return output_file


# -------------------------------
# 9 Run Pipeline and Return JSON (for API integration)
# -------------------------------
def run_pipeline_json(input_csv):
    """Run full pipeline and return list of predictions as JSON-serializable dicts."""
    output_file = run_pipeline(input_csv)
    df = pd.read_csv(output_file)

    # Map Risk_Category to Risk_Level (Critical = High Risk, Low = Low Risk)
    def to_risk_level(cat):
        if "High" in str(cat):
            return "Critical"
        if "Medium" in str(cat):
            return "Medium"
        return "Low"

    results = []
    for _, row in df.iterrows():
        results.append({
            "Container_ID": str(row.get("Container_ID", "")),
            "Risk_Score": round(float(row.get("Final_Risk_Score", 0)), 2),
            "Risk_Level": to_risk_level(row.get("Risk_Category", "Low Risk")),
            "Explanation": str(row.get("Risk_Explanation", "No anomalies detected."))
        })
    return results

# -------------------------------
# 8 Run
# -------------------------------

if __name__ == "__main__":
    
    run_pipeline("Example_Data.csv")