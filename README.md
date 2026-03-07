# 🚢 SmartContainer Risk Engine

### AI-Powered Container Risk Assessment System for Customs Inspection

SmartContainer Risk Engine is an **AI-driven risk analysis platform**
designed to help customs authorities identify **high-risk shipping
containers** for inspection.

The system analyzes **container declaration data** using machine
learning models and generates a **risk score (0--100)** along with
anomaly detection and explainable insights.

By prioritizing suspicious containers, the system helps:

-   Improve **trade security**
-   Reduce **cargo fraud**
-   Minimize **revenue loss**
-   Optimize **inspection resources**

------------------------------------------------------------------------

# 📌 Problem Statement

Every day **thousands of shipping containers** move through
international ports, but due to limited resources **less than 5% of
containers are physically inspected**.

Traditional inspection methods rely on **manual checks and static
rules**, which can:

-   Miss hidden irregularities
-   Cause unnecessary inspections
-   Slow down port operations
-   Fail to adapt to evolving trade patterns

The **SmartContainer Risk Engine** addresses this challenge by using
**Artificial Intelligence and anomaly detection** to automatically
detect suspicious shipments.

------------------------------------------------------------------------

# 🚀 Key Features

## 📂 CSV Data Upload

Upload container declaration data in **CSV format** through the web
dashboard.

## 🤖 AI Risk Scoring

Machine learning model:

**XGBoost**

Predicts a **risk score between 0--100** for each container.

Higher score → Higher inspection priority.

## ⚠️ Anomaly Detection

Algorithm:

**Isolation Forest**

Detects unusual shipment patterns such as:

-   Weight mismatch
-   Suspicious cargo value
-   Unusual trade routes
-   Abnormal dwell time

## 🔍 Explainable AI

Technique:

**SHAP (SHapley Additive exPlanations)**

Explains why a container received a specific risk score.

Example:

Weight mismatch → +18 Risk\
High cargo value → +12 Risk\
Unusual trade route → +9 Risk

## 📊 Analyst Dashboard

Dashboard features:

-   CSV upload interface
-   Container risk scores
-   Anomaly detection results
-   Prediction explanations
-   Summary statistics
-   Downloadable prediction results

## 🔐 Secure Authentication

Backend supports **JWT authentication**.

Features:

-   User Login
-   User Signup
-   Protected APIs

------------------------------------------------------------------------

# 🏗 System Workflow

User Login / Signup\
↓\
CSV Upload\
↓\
Data Preprocessing\
↓\
Feature Engineering\
↓\
XGBoost Risk Scoring\
↓\
Isolation Forest Anomaly Detection\
↓\
SHAP Explainability\
↓\
Dashboard Visualization\
↓\
Export Results

------------------------------------------------------------------------

# 📊 Dataset Fields

  Column                Description
  --------------------- -----------------------------
  Container_ID          Unique container identifier
  Declaration_Date      Date of declaration
  Declaration_Time      Time of declaration
  Trade_Regime          Import or Transit
  Origin_Country        Shipment origin
  Destination_Country   Destination
  Destination_Port      Target port
  HS_Code               Harmonized cargo code
  Importer_ID           Importer identifier
  Exporter_ID           Exporter identifier
  Declared_Value        Cargo value
  Declared_Weight       Declared weight
  Measured_Weight       Actual weight
  Shipping_Line         Shipping company
  Dwell_Time_Hours      Time at port
  Clearance_Status      Clearance result

------------------------------------------------------------------------

# 🧠 Machine Learning Approach

## Risk Prediction Model

Algorithm: **XGBoost**

Outputs:

-   Risk Score (0--100)
-   Risk Level (Critical / Low Risk)

## Anomaly Detection

Algorithm: **Isolation Forest**

Detects abnormal shipment behavior.

## Explainability

Technique: **SHAP**

Shows which features contributed to the prediction.

------------------------------------------------------------------------

# ⚙️ Technology Stack

## Frontend (Client)
- **React.js** (Vite)
- **TailwindCSS** (UI Styling)
- **Framer Motion** (Animations)
- **React Router** (Navigation)
- **Lucide React** (Icons)

## Backend (Server)
- **Node.js** & **Express.js**
- **MongoDB** (Database)
- **JWT Authentication** (Security)
- **Multer** (File Uploads)

## Risk Engine (ML Services)
- **Python** & **FastAPI**
- **XGBoost** (Risk Scoring)
- **Isolation Forest** (Anomaly Detection)
- **SHAP** (Explainability)
- **Pandas** & **NumPy** (Data Processing)
- **Matplotlib** & **Seaborn** (Visualization)

## Data Processing

-   Pandas
-   NumPy

## Visualization

-   Matplotlib
-   Seaborn

------------------------------------------------------------------------

# 📁 Project Structure

```
SmartContainerRiskEngine
├── Backend/ (Node.js & Express)
│   ├── src/
│   │   ├── controllers/ (admin.controller.js, container.controller.js, etc.)
│   │   ├── db/ (index.js - MongoDB Connection)
│   │   ├── middlewares/ (auth.middleware.js, multer.middleware.js)
│   │   ├── models/ (user.model.js, container.model.js)
│   │   ├── routes/ (user.routes.js, container.routes.js)
│   │   ├── services/ (mlApi.service.js)
│   │   ├── utils/ (ApiError.js, ApiResponse.js, asyncHandler.js, cloudinary.js)
│   │   ├── app.js
│   │   ├── constants.js
│   │   └── index.js
│   └── package.json
│
├── Frontend/ (React & Vite)
│   ├── src/
│   │   ├── components/ (Navbar, Sidebar, ContainerTable, UploadCSV, etc.)
│   │   ├── context/ (AuthContext.jsx)
│   │   ├── hooks/ (useContainer.js)
│   │   ├── services/ (api.js)
│   │   ├── pages/ (Login, Register, Dashboard, Results, AdminPanel)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   └── package.json
│
├── SmartContainerRiskEngine/ (Python & ML)
│   ├── main.py (FastAPI Server)
│   ├── risk_pipeline.py (ML Logic)
│   ├── manual_test.py
│   ├── models/ (XGBoost & Feature models)
│   ├── outputs/
│   └── requirements.txt
│
└── README.md
```

------------------------------------------------------------------------

# 📦 Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/SmartContainerRiskEngine.git
cd SmartContainerRiskEngine
```

------------------------------------------------------------------------

# ⚙️ Backend Setup (Node.js)

```bash
cd Backend
npm install
npm run dev
```

------------------------------------------------------------------------

# 💻 Frontend Setup (React)

```bash
cd Frontend
npm install
npm run dev
```

------------------------------------------------------------------------

# 🧠 Risk Engine Setup (Python)

```bash
cd SmartContainerRiskEngine
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

API Docs:
`http://127.0.0.1:8000/docs`

------------------------------------------------------------------------

# 📈 Example Output

  Container_ID   Risk_Score   Risk_Level   Anomaly   Explanation
  -------------- ------------ ------------ --------- ------------------------------------
  C12345         82           Critical     Yes       Weight mismatch + high cargo value
  C56789         24           Low Risk     No        Normal shipment

------------------------------------------------------------------------

# ⚠️ Limitations

-   Model accuracy depends on training data quality
-   Currently supports CSV batch uploads
-   No real-time port integration

------------------------------------------------------------------------

# 🔮 Future Improvements

-   Real-time port integration
-   Deep learning anomaly detection
-   Advanced dashboard analytics
-   Automated inspection recommendations
-   Docker deployment

------------------------------------------------------------------------

# 👨‍💻 Team

Techno Stars

-   Utsav Hihoriya
-   Nevil Anghan
-   Mayur Pandav
-   Parth Lathiya
-   Khush Sonani

------------------------------------------------------------------------

# 🏆 Hackathon

Developed for

**HACKaMINeD Hackathon 2026**\
Binghamton University\
INTECH Track -- Nirma University

------------------------------------------------------------------------

# 📜 License

For academic and research purposes.
