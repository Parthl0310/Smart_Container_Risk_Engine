
# from fastapi import FastAPI, UploadFile, File
# from fastapi.responses import FileResponse
# import shutil
# import os

# from risk_pipeline import run_pipeline

# app = FastAPI()

# UPLOAD_FOLDER = "uploads"

# os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# os.makedirs("outputs", exist_ok=True)


# @app.get("/")
# def home():
#     return {"message": "Smart Container Risk Engine API is running"}


# @app.post("/analyze/")
# async def analyze(file: UploadFile = File(...)):

#     input_path = f"{UPLOAD_FOLDER}/{file.filename }"

#     with open(input_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     print("CSV uploaded:", file.filename)

#     output_file = run_pipeline(input_path)

#     return FileResponse(
#         output_file,
#         media_type="text/csv",
#         filename="container_risk_report.csv"
#     )

from fastapi import FastAPI, UploadFile, File, Body
from fastapi.responses import FileResponse
import shutil
import os
import pandas as pd
import uuid

from fastapi.middleware.cors import CORSMiddleware
from risk_pipeline import run_pipeline, run_pipeline_json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs("outputs", exist_ok=True)


@app.get("/")
def home():
    return {"message": "Smart Container Risk Engine API is running"}


# -------------------------------
# CSV Upload Endpoint
# -------------------------------
@app.post("/analyze/")
async def analyze(file: UploadFile = File(...)):

    input_path = f"{UPLOAD_FOLDER}/{file.filename}"

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print("CSV uploaded:", file.filename)

    output_file = run_pipeline(input_path)

    return FileResponse(
        output_file,
        media_type="text/csv",
        filename="container_risk_report.csv"
    )


# -------------------------------
# Predict Endpoint (JSON response for Backend integration)
# -------------------------------
@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    """Accept CSV, return JSON array of {Container_ID, Risk_Score, Risk_Level, Explanation}."""
    safe_name = f"predict_{uuid.uuid4().hex}_{file.filename or 'upload.csv'}"
    input_path = f"{UPLOAD_FOLDER}/{safe_name}"

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print("CSV uploaded for prediction:", safe_name)

    results = run_pipeline_json(input_path)

    return {"predictions": results}


# -------------------------------
# Manual Entry Endpoint
# -------------------------------
@app.post("/manual-entry/")
async def manual_entry(data: dict = Body(...)):

    # Convert JSON → DataFrame
    df = pd.DataFrame([data])

    # Unique CSV filename
    file_name = f"manual_{uuid.uuid4().hex}.csv"

    csv_path = f"{UPLOAD_FOLDER}/{file_name}"

    # Save JSON as CSV
    df.to_csv(csv_path, index=False)

    print("Manual entry converted to CSV")

    # Run same pipeline
    output_file = run_pipeline(csv_path)

    return FileResponse(
        output_file,
        media_type="text/csv",
        filename="container_risk_report.csv"
    )