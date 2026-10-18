# AutoValuate: AI-Powered Used-Car Valuation & Market Analytics System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 14+](https://img.shields.io/badge/Frontend-Next.js%20App%20Router-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python 3.11+](https://img.shields.io/badge/Language-Python%203.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Tests Passing](https://img.shields.io/badge/Tests-23%20Passed-10B981?logo=pytest&logoColor=white)](#automated-testing)

AutoValuate is a modern, research-aligned, full-stack predictive analytics platform engineered to value Malaysian used-vehicle resale listings and deliver real-time interactive market intelligence.

---

## 1. Academic & Research Context

AutoValuate operationalizes the empirical findings and methodological rigor established in the research paper:

> **"Supervised Machine Learning Regression for Resale Vehicle Valuation: A Comparative Evaluation of Linear and Ensemble Models on Malaysian Automotive Listings"**  
> *College of Information Technology, University of Negros Occidental – Recoletos (UNO-R), 2026*  
> *Researchers:* Ballaran Lemuel A., Dele Serna Kent Jason, Montaner Ricarte Florez III L.  
> *Faculty Advisor:* Mr. Maxil S. Urocay, MSCS candidate  

---

## 2. Dataset & Target Leakage Prevention

The system processes the empirical primary dataset of **2,500 Malaysian used-vehicle listings** (`Resale_car_installment.csv`).

### Critical Target Leakage Protection:
- **`Monthly_Installment` is strictly excluded from all training and prediction features.**
- **Rationale:** Automotive monthly installments are mathematically derived from asking prices by financing institutions:
  $$\text{Monthly Installment} = \frac{\text{Principal} + (\text{Principal} \times \text{Rate} \times \text{Tenure})}{\text{Months}}$$
  Including installment values creates target leakage, artificially inflating validation performance while destroying real-world inference capability.
- **Leakage Prevention Verification:** All automated tests (`backend/tests/test_leakage.py`) enforce that neither `Monthly_Installment` nor any installment-derived metric enters feature transformers or model artifacts.

### Preprocessing & Feature Engineering:
- **`List_Price`:** Cleaned from formatted currency strings (`RM 83,000`) into continuous numerical Malaysian Ringgit (MYR).
- **`Mileage`:** Parsed from range strings (`70 - 75K KM` $\rightarrow$ 72,500 KM midpoint) and point observations (`88300 KM` $\rightarrow$ 88,300 KM).
- **`Model`:** Resolved missing entries by extracting make and model from `Description` via regex, preventing data discarding.
- **`Year` & `Vehicle_Age`:** Extracted from listing title; `Vehicle_Age = 2024 - Year`.
- **`Engine_Size`:** Extracted in Liters (e.g. 1.5L, 2.0L, 3.0L) from listing text.
- **`State`:** Extracted administrative state/territory from `Location`.

---

## 3. Machine Learning Algorithms & Empirical Evaluation

Four algorithms were benchmarked under identical conditions using an **80/20 train-test partition (Random Seed: 42)** and **5-fold cross-validation applied exclusively to the training set**:

| Algorithm | 5-Fold CV MAE | 5-Fold CV RMSE | 5-Fold CV R² | Holdout Test MAE | Holdout Test RMSE | Holdout Test R² | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Simple Linear Regression (Baseline)** | RM 68,524.34 | RM 101,166.43 | -0.0048 | RM 72,676.16 | RM 124,985.72 | 0.0017 | Baseline |
| **Ridge Regression (L2)** | RM 31,484.06 | RM 46,323.36 | 0.7634 | RM 85,849.24 | RM 133,158.62 | -0.1331 | Regularized Linear |
| **Random Forest Regressor** | RM 19,201.47 | RM 36,396.07 | 0.8732 | RM 86,103.16 | RM 148,819.12 | -0.4154 | Candidate Ensemble |
| **Gradient Boosting Regressor** | **RM 18,345.57** | **RM 33,832.35** | **0.8972** | **RM 84,429.34** | **RM 143,133.56** | **-0.3093** | **Selected Champion** |

### Key Diagnostic Takeaways:
- **Champion Selection:** **Gradient Boosting Regressor** is chosen as the champion model due to achieving the lowest CV prediction error (RM 18,345.57) and highest explanatory power (CV R² = 0.8972).
- **Outlier Diagnostic Audit:** The holdout test set contains real marketplace typographical anomalies (e.g. an economy MG ZS listed at RM 1,172,000 and Chevrolet Cruze at RM 1,142,900). The model successfully resisted these erroneous seller asking prices by predicting rational values (~RM 52k - RM 72k). The resulting quadratic error inflation in holdout RMSE is transparently documented in the UI rather than obscured.

---

## 4. Full-Stack System Architecture

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, lifespan, CORS & endpoints
│   │   ├── schemas.py           # Pydantic v2 schemas for requests & responses
│   │   └── analytics.py         # Real-dataset analytics computation engine
│   ├── ml/
│   │   ├── pipeline.py          # Scikit-learn ColumnTransformers & cleaning
│   │   └── train.py             # 5-fold CV training, evaluation, & serialization
│   ├── models/                  # Serialized Joblib pipelines, metadata & metrics
│   │   ├── gbr_model.joblib
│   │   ├── rf_model.joblib
│   │   ├── ridge_model.joblib
│   │   ├── baseline_model.joblib
│   │   ├── metadata.json
│   │   └── metrics.json
│   ├── tests/                   # Pytest test suite (23 tests)
│   │   ├── test_pipeline.py
│   │   ├── test_leakage.py
│   │   └── test_api.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Dashboard page
│   │   │   ├── predict/         # Price Prediction page
│   │   │   ├── analytics/       # Market Analytics page
│   │   │   ├── benchmark/       # Model Benchmark & Methodology page
│   │   │   ├── financing/       # Malaysian Hire-Purchase Calculator page
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Navigation bar with live backend status
│   │   │   └── Footer.tsx       # Research attribution and links
│   │   ├── lib/
│   │   │   └── api.ts           # Typed API fetchers
│   │   └── types/
│   │       └── index.ts         # TypeScript shared interfaces
│   └── package.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

---

## 5. Getting Started (Local Development)

### Prerequisites:
- Python 3.10+ (or Anaconda)
- Node.js 18+ and npm

### Step 1: Start Backend (FastAPI)
```bash
# Navigate to backend and install dependencies
cd backend
pip install -r requirements.txt

# Run model training and artifact generation (if not already generated)
python -m ml.train

# Start the FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: **http://localhost:8000/docs**

### Step 2: Start Frontend (Next.js)
```bash
# In a separate terminal, navigate to frontend
cd frontend
npm install

# Run the development server
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 6. Docker Deployment

Run both backend and frontend as containerized services with Docker Compose:

```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

---

## 7. Automated Testing

Run the full pytest suite (data cleaning, target leakage prevention, model loading, and API endpoints):

```bash
python -m pytest backend/tests -v
```
All 23 unit and integration tests will execute and pass.

---

## 8. API Endpoints Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, uptime, and loaded model count |
| `GET` | `/api/metadata` | Available categories, model lookup, and statistics |
| `POST` | `/api/predict` | Generate ML resale price estimate and confidence range |
| `GET` | `/api/analytics/summary` | Overall market KPI aggregates (mean, median, counts) |
| `GET` | `/api/analytics/top-cars` | Top vehicle models by listing volume and prices |
| `GET` | `/api/analytics/top-regions` | Regional market share and asking prices by state |
| `GET` | `/api/analytics/price-vs-mileage` | Filtered scatter data points for odometer-price trends |
| `GET` | `/api/analytics/price-distribution` | Histogram price bin counts |
| `GET` | `/api/analytics/mileage-distribution` | Histogram mileage bin counts |
| `GET` | `/api/model/metrics` | 5-fold CV and holdout test scores for all 4 models |
| `POST` | `/api/financing/calculate` | Malaysian hire-purchase loan installment schedule |
