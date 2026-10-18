# AutoValuate: AI-Powered Used-Car Valuation & Market Analytics System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%20Turbopack-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python 3.11+](https://img.shields.io/badge/Language-Python%203.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Tests Passing](https://img.shields.io/badge/Tests-31%20Passed-10B981?logo=pytest&logoColor=white)](#automated-testing)
[![Daily Retraining](https://img.shields.io/badge/ML%20Retraining-Daily%2002%3A00%20MYT-blue?logo=clock&logoColor=white)](#automated-daily-machine-learning-retraining)

AutoValuate is a modern, research-aligned, full-stack predictive analytics platform engineered to value Malaysian used-vehicle resale listings and deliver real-time interactive market intelligence.

---

## 1. Academic & Research Context

AutoValuate operationalizes the empirical findings and methodological rigor established in the research paper:

> **"Supervised Machine Learning Regression for Resale Vehicle Valuation: A Comparative Evaluation of Linear and Ensemble Models on Malaysian Automotive Listings"**  
> *College of Information Technology, University of Negros Occidental – Recoletos (UNO-R), 2026*  
> *Researchers:* Ballaran Lemuel A., Dele Serna Kent Jason, Montaner Ricarte Florez III L.  
> *Faculty Advisor:* Mr. Maxil S. Urocay, MSCS candidate  

---

## 2. Automated Daily Machine-Learning Retraining

AutoValuate includes a complete, autonomous, server-side retraining and model lifecycle management system:

### Key Retraining Architecture:
1. **Persistent Server-Side Scheduler:**
   - Runs once every 24 hours at **02:00 AM Malaysia Time (`Asia/Kuala_Lumpur`, UTC+8)**.
   - Equivalent UTC cron schedule: **`0 18 * * *`** (18:00 UTC).
   - Powered by `APScheduler` embedded in FastAPI lifespan + standalone CLI execution support.
2. **Dataset Integrity & Smart Skipping:**
   - Computes SHA-256 fingerprint of `Resale_car_installment.csv`.
   - Skips redundant retraining if data has not changed, avoiding unnecessary compute waste.
   - An administrator can override and bypass skipping via `--force` or the UI toggle.
3. **Leakage-Barred 4-Model Re-evaluation:**
   - Retrains and benchmarks all 4 algorithms on identical 80/20 train/test splits:
     1. Simple Linear Regression (Baseline)
     2. Ridge Regression (L2)
     3. Random Forest Regressor
     4. Gradient Boosting Regressor (Production Champion)
   - 5-fold cross-validation applied strictly on the 80% training split.
   - Evaluates CV MAE, CV RMSE, CV R², Test MAE, Test RMSE, Test R², and Generalization Gap.
4. **Atomic Promotion & Versioning Safeguards:**
   - Preserves all model artifacts, preprocessors, and `manifest.json` under `backend/models/versions/{version_id}/`.
   - Pre-validates model loading and generates a synthetic test prediction before promoting.
   - Atomically updates production artifacts in `backend/models/` and triggers in-memory model reload without server restarts or downtime.
5. **Instant Safe Rollback:**
   - Archived versions can be restored immediately via the Administrator Dashboard or API.
   - Atomic rollback reloads FastAPI memory models instantly and preserves history logs.

---

## 3. Dataset & Target Leakage Prevention

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

## 4. Machine Learning Algorithms & Empirical Evaluation

Four algorithms are benchmarked under identical conditions using an **80/20 train-test partition (Random Seed: 42)** and **5-fold cross-validation applied exclusively to the training set**:

| Algorithm | 5-Fold CV MAE | 5-Fold CV RMSE | 5-Fold CV R² | Holdout Test MAE | Holdout Test RMSE | Holdout Test R² | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Simple Linear Regression (Baseline)** | RM 68,524.34 | RM 101,166.43 | -0.0048 | RM 72,676.16 | RM 124,985.72 | 0.0017 | Baseline |
| **Ridge Regression (L2)** | RM 31,484.06 | RM 49,128.48 | 0.7634 | RM 85,849.24 | RM 133,158.62 | -0.1331 | Regularized Linear |
| **Random Forest Regressor** | RM 19,201.47 | RM 35,989.92 | 0.8732 | RM 86,103.16 | RM 148,819.12 | -0.4154 | Candidate Ensemble |
| **Gradient Boosting Regressor** | **RM 18,345.57** | **RM 32,380.00** | **0.8972** | **RM 84,429.34** | **RM 143,133.56** | **-0.3093** | **Selected Champion** |

---

## 5. Full-Stack System Architecture

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, lifespan, scheduler & routes
│   │   ├── admin.py             # Admin retraining & rollback endpoints (X-Admin-Key)
│   │   ├── schemas.py           # Pydantic v2 schemas for requests & responses
│   │   └── analytics.py         # Real-dataset analytics computation engine
│   ├── ml/
│   │   ├── pipeline.py          # Scikit-learn ColumnTransformers & cleaning
│   │   ├── train.py             # 5-fold CV training, evaluation, & serialization
│   │   ├── dataset_manager.py   # Dataset validation & SHA-256 fingerprinting
│   │   ├── retrain_manager.py   # Retraining orchestrator, promotion & rollback
│   │   └── scheduler.py         # APScheduler daily cron runner & CLI triggers
│   ├── models/                  # Serialized Joblib pipelines, metadata & metrics
│   │   ├── versions/            # Historical versioned artifacts & manifests
│   │   ├── training_history.json# Execution audit log
│   │   ├── gbr_model.joblib
│   │   ├── rf_model.joblib
│   │   ├── ridge_model.joblib
│   │   ├── baseline_model.joblib
│   │   ├── metadata.json
│   │   └── metrics.json
│   ├── tests/                   # Pytest test suite (31 tests)
│   │   ├── test_admin.py        # Admin auth, conflict, rollback, & audit tests
│   │   ├── test_pipeline.py
│   │   ├── test_leakage.py
│   │   └── test_api.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Dashboard page
│   │   │   ├── admin/           # Administrator Retraining & Rollback Dashboard
│   │   │   ├── predict/         # Price Prediction page
│   │   │   ├── analytics/       # Market Analytics page
│   │   │   ├── benchmark/       # Model Benchmark & Methodology page
│   │   │   ├── financing/       # Malaysian Hire-Purchase Calculator page
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Navigation bar with live backend status & Admin
│   │   │   └── Footer.tsx       # Research attribution and links
│   │   ├── lib/
│   │   │   └── api.ts           # Typed API fetchers (including Admin endpoints)
│   │   └── types/
│   │       └── index.ts         # TypeScript shared interfaces
│   └── package.json
├── .github/
│   └── workflows/
│       ├── ci.yml               # Automated CI test & build verification
│       └── daily-retraining.yml # GitHub Actions cron at 18:00 UTC (02:00 AM MYT)
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

---

## 6. Getting Started (Local Development)

### Prerequisites:
- Python 3.10+ (or Anaconda)
- Node.js 18+ and npm

### Environment Variables:
Create `.env` in root or backend:
```env
ADMIN_API_KEY=autovaluate-admin-2026
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/Naksu123/autovaluate
```

### Step 1: Start Backend (FastAPI)
```bash
# Navigate to backend and install dependencies
cd backend
pip install -r requirements.txt

# Start the FastAPI server on port 8000 (APScheduler starts automatically)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: **http://localhost:8000/docs**

### Step 2: Start Frontend (Next.js)
```bash
# In a separate terminal, navigate to frontend
cd frontend
npm install

# Run the development server
npm run dev
```
Open **http://localhost:3000** in your browser.  
Visit **http://localhost:3000/admin** for the Retraining Control Center.

---

## 7. CLI Model Retraining & Scheduler Execution

You can trigger the retraining pipeline directly from terminal or external cron jobs:

```bash
# Run retraining immediately (skips if dataset checksum is unchanged)
python -m backend.ml.scheduler --run-now

# Force retraining immediately (bypasses checksum check)
python -m backend.ml.scheduler --run-now --force

# Run the persistent scheduler daemon (blocks and fires daily at 02:00 AM MYT)
python -m backend.ml.scheduler
```

---

## 8. Automated Testing

Run the full pytest suite (31 unit, integration, admin, target leakage, and pipeline tests):

```bash
python -m pytest backend/tests -v
```
All 31 tests pass with 100% success rate.

---

## 9. API Endpoints Specification

### Public Core Endpoints:
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

### Secured Administrator Retraining Endpoints (`X-Admin-Key` header required):
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/training/status` | Current scheduler state, active model version, and next 02:00 AM MYT execution |
| `GET` | `/api/admin/training/history` | Audit trail of past executions (completed, skipped, failed) |
| `GET` | `/api/admin/models` | List all archived model candidate versions and metrics |
| `POST` | `/api/admin/training/run` | Trigger manual retraining job in non-blocking background worker |
| `POST` | `/api/admin/models/{version}/rollback` | Atomically rollback active production model to specified archived version |

---

## 10. Production Deployment Strategy

- **Frontend (Vercel):** Connect repository to Vercel. Set `NEXT_PUBLIC_API_URL` to the production backend URL.
- **Backend (Render / Railway / Fly.io / Container):** Deploy using `Dockerfile.backend` or `Procfile`.
- **Scheduled Training Execution:**
  - Option A: Built-in `APScheduler` running inside the persistent backend container at 02:00 AM MYT.
  - Option B: GitHub Actions cron (`.github/workflows/daily-retraining.yml`) running at 18:00 UTC daily.
  - Option C: Cloud cron / worker hitting `POST /api/admin/training/run` with `X-Admin-Key`.
