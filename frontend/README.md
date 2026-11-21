# DataTalk AI - Frontend

Modern, clean React + Tailwind CSS web application built with [Vite](https://vitejs.dev/) that connects to the FastAPI backend at `http://127.0.0.1:8000`.

---

## 🚀 Features

- **Chat-First Workspace**:
  - Chat immediately on load for general inquiries without needing to upload a file first
  - Inline `+` attachment button in the input bar to attach any `.csv` or `.xlsx` spreadsheet at any point
  - Active dataset badge with one-click detach to switch back to general chat
- **Dynamic Layout Rendering**:
  - Clean text responses formatted like ChatGPT
  - Single-chart interactive view
  - Publication-grade **2x2 Statistical Report Grid** with centered dynamic `report_title`, dashed gridlines, individual "Pin" controls, and "Download Full Report"
- **Top Navigation Bar**:
  - App title & branding: **DataTalk AI**
  - **Upload CSV / Excel** button supporting `.csv`, `.xlsx`, and `.xls` datasets
  - Live View Toggle between **Chat & Analysis** and **Saved Dashboard (count)**
- **Left Sidebar (Dataset Overview)**:
  - File details: filename, total rows, total columns
  - Scrollable, searchable list of column names with data type badges and missing value indicators
  - Clickable **Suggested Questions** chips that instantly auto-fill and submit analytical prompts
- **Main View 1 — Chat & Analysis**:
  - Initial KPI cards (Total Records, Primary Metric Sum/Mean, Data Completeness)
  - ChatGPT-style scrollable message stream + input box with keyboard shortcuts (`Enter` to send)
  - Expandable **View Generated Python Code** container with one-click copy
  - Dynamic **Plotly.js** charts rendered directly from backend JSON with full interactivity (pan, zoom, hover, download)
  - **Pin to Dashboard** button on every chart message
- **Main View 2 — Saved Insights Dashboard**:
  - Responsive 2-column grid displaying all pinned visualizations
  - Replicated KPI cards at the top for an executive summary
  - Individual chart titles, summary descriptions, and remove buttons
  - **Print / Export Dashboard** (`window.print()`) with print-optimized CSS for PDF export

---

## 🛠️ Tech Stack & Libraries

- **React** with **Vite**
- **Tailwind CSS v3** (Slate & Indigo color palette)
- **Lucide React** (clean iconography)
- **Plotly.js & react-plotly.js** (responsive interactive charts)
- **Axios** (API communication with FastAPI)

---

## 💻 Getting Started

### 1. Prerequisites
- Node.js 18+ and npm installed
- FastAPI backend running at `http://127.0.0.1:8000`

### 2. Install Dependencies

From inside the `frontend/` directory:

```bash
npm install
```

### 3. Environment Configuration (Optional)

The frontend defaults to `http://127.0.0.1:8000`. If your backend runs on a different host or port, create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

### 4. Start Development Server

```bash
npm run dev
```

Open your browser at:
**[http://localhost:5173](http://localhost:5173)**

### 5. Production Build

```bash
npm run build
npm run preview
```
