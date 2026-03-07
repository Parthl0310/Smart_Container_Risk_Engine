import pandas as pd
from risk_pipeline import run_pipeline

# Manual container entry
manual_container = {
"Container_ID": "C1001",
"Declaration_Date (YYYY-MM-DD)": "2026-03-06",
"Declaration_Time": "22:30:00",
"Trade_Regime (Import / Export / Transit)": "Import",
"Origin_Country": "China",
"Destination_Country": "India",
"Destination_Port": "Nhava Sheva",
"HS_Code": "8542",
"Importer_ID": 101,
"Exporter_ID": 201,
"Declared_Value": 60000,
"Declared_Weight": 1000,
"Measured_Weight": 1200,
"Shipping_Line": "MSC",
"Dwell_Time_Hours": 80
}

# Convert to DataFrame
df = pd.DataFrame([manual_container])

# Run pipeline
output_file = run_pipeline(df)

print("Prediction completed")
print("Output file:", output_file)