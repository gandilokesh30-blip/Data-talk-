# AI Data Analysis Chatbot & Dashboard Backend

A clean, modular Python FastAPI backend that powers an AI-driven Data Analysis Chatbot and Dashboard. Upload any `.csv` or `.xlsx` file to automatically receive comprehensive dataset profiles, initial dashboard KPI cards, and conversational data exploration with Plotly charts powered by Google Gemini (`gemini-2.5-flash`).

---

## 📁 Project Architecture

```
backend/
├── analyzer.py          # Dataset profiling, statistics, and initial dashboard KPI cards
├── llm_engine.py        # Gemini 2.5 Flash agent, restricted sandbox execution, and auto-retry loop
├── main.py              # FastAPI application, CORS, session management, and REST endpoints
├── requirements.txt     # Python dependency specifications
├── .env.example         # Template for environment variables (API keys)
└── README.md            # Setup, execution, and API documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+ installed
- Google Gemini API key ([Get one here](https://aistudio.google.com/))

### 2. Set Up Virtual Environment (Recommended)

From the project root or inside `backend/`:

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file inside the `backend/` directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and configure your Gemini API Key:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
```

### 5. Launch the FastAPI Server

Start the development server with live reload:

```bash
uvicorn main:app --reload
```

The server will be available at:
- **API Base URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs (OpenAPI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📡 API Endpoints

### 1. Health Check
- **`GET /health`** or **`GET /`**
- Returns backend status and number of active sessions in memory.

### 2. Upload Dataset
- **`POST /upload`**
- **Form Data**: `file` (`.csv` or `.xlsx`)
- **Response**:
  ```json
  {
    "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "filename": "sales_data.csv",
    "profile": {
      "total_rows": 1000,
      "total_columns": 5,
      "column_names": ["Date", "Product", "Region", "Units_Sold", "Revenue"],
      "data_types": {
        "Date": "object",
        "Product": "object",
        "Region": "object",
        "Units_Sold": "int64",
        "Revenue": "float64"
      },
      "missing_values": {
        "Date": 0,
        "Product": 0,
        "Region": 0,
        "Units_Sold": 0,
        "Revenue": 0
      },
      "numerical_summary": {
        "Revenue": {
          "count": 1000,
          "mean": 1250.5,
          "std": 340.2,
          "min": 100.0,
          "25%": 950.0,
          "50%": 1200.0,
          "75%": 1500.0,
          "max": 4500.0
        }
      },
      "sample_rows": [
        {"Date": "2024-01-01", "Product": "Widget A", "Region": "North", "Units_Sold": 10, "Revenue": 150.0}
      ]
    },
    "kpis": [
      {
        "label": "Total Records",
        "value": "1,000",
        "description": "Dataset contains 5 columns"
      },
      {
        "label": "Total Revenue",
        "value": "1.25M",
        "description": "Sum across all 1,000 records"
      },
      {
        "label": "Avg Units_Sold",
        "value": "24.50",
        "description": "Mean value per record"
      },
      {
        "label": "Data Completeness",
        "value": "100.0%",
        "description": "0 missing values across table"
      }
    ]
  }
  ```

### 3. Chat & Analysis API (3 Smart Modes)
- **`POST /chat`**
- **JSON Body** (`session_id` is optional):
  ```json
  {
    "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "query": "Make a full dashboard of key trends"
  }
  ```
- **Modes**:
  1. **General Chat Mode** (no dataset or conceptual query): Directly provides helpful, formatted Markdown responses.
  2. **Single-Chart Query Mode**: Computes exact statistics, returns `result_text`, and 1 relevant Plotly chart.
  3. **Dynamic 2x2 Statistical Report Mode**: Generates 4 diverse publication-grade Plotly charts with a tailored `report_title` and executive statistical summary.
- **Response**:
  ```json
  {
    "answer": "Comprehensive executive summary...",
    "charts": ["{...}", "{...}", "{...}", "{...}"],
    "chart_json": "{...}",
    "report_title": "Executive Regional Performance & Yield Report",
    "generated_code": "figs = [fig1, fig2, fig3, fig4]"
  }
  ```

### 4. Session State & Cleanup
- **`GET /session/{session_id}`**: Retrieve stored metadata & KPIs for active session.
- **`DELETE /session/{session_id}`**: Delete session data from memory.

---

## 🔒 Security & Sandboxing Features
1. **Schema-Only Prompting**: Only dataset metadata (column names, types, summary stats, first 3 rows) is sent to Gemini. Your full sensitive dataset remains private on your backend server.
2. **Restricted `exec()` Scope**: Execution globals are locked down to only `df`, `pd`, `px`, and safe built-in functions.
3. **Strict Keyword Blocking**: Code containing `os`, `sys`, `subprocess`, `open`, `__import__`, `eval`, or socket/network commands is rejected immediately before execution.
4. **Isolated Copy**: The execution environment operates on a copy of `df` to prevent unwanted in-memory data corruption.
5. **Auto-Correction Retry Loop**: If generated code fails with a syntax or runtime error, the engine automatically catches the traceback and asks Gemini to fix the code (up to 2 retries).

