"""
test_backend.py
Comprehensive test suite for the FastAPI backend, analyzer, smart type cleaning,
and LLM execution sandbox (general chat, single chart, 2x2 statistical report mode, and model auto-detection).
"""

import io
import json
import unittest
from unittest.mock import MagicMock, patch
import numpy as np
import pandas as pd
import plotly.express as px
from fastapi.testclient import TestClient

from analyzer import (
    clean_and_coerce_dataframe,
    extract_dataset_profile,
    format_number,
    format_schema_info_for_prompt,
    generate_initial_kpis,
    is_meaningful_numeric_column,
    sanitize_for_json,
)
import llm_engine
from llm_engine import (
    clean_code,
    execute_generated_code,
    validate_code_safety,
    ask_data_agent,
    get_working_model,
)
from main import app, SESSION_STORE


class TestAnalyzer(unittest.TestCase):
    def setUp(self):
        # Create a sample test dataset with dirty string numbers and year/id columns
        self.df = pd.DataFrame({
            "record_id": [101, 102, 103, 104, 105],
            "year": [2020, 2021, 2022, 2023, 2024],
            "zipcode": [90210, 90211, 90212, 90213, 90214],
            "category": ["Electronics", "Electronics", "Furniture", "Clothing", "Furniture"],
            "sales": [1200.50, 450.00, np.nan, 89.99, 650.00],
            "rainfall_mm": ["120.5", "140.0", "..", "95.2", "110.8"],
            "units": [4, 2, 1, 3, 5],
        })

    def test_smart_type_cleaning(self):
        cleaned = clean_and_coerce_dataframe(self.df)
        self.assertTrue(pd.api.types.is_numeric_dtype(cleaned["rainfall_mm"]))
        self.assertTrue(np.isnan(cleaned["rainfall_mm"].iloc[2]))
        self.assertEqual(cleaned["rainfall_mm"].iloc[0], 120.5)

    def test_smart_kpis_skips_year_and_id(self):
        kpis = generate_initial_kpis(self.df)
        labels = [kpi["label"] for kpi in kpis]
        self.assertFalse(any("year" in l.lower() for l in labels))
        self.assertFalse(any("record_id" in l.lower() for l in labels))
        self.assertFalse(any("zipcode" in l.lower() for l in labels))
        self.assertTrue(any("sales" in l.lower() or "units" in l.lower() or "rainfall" in l.lower() for l in labels))


class TestLLMEngineSandbox(unittest.TestCase):
    def setUp(self):
        self.df = pd.DataFrame({
            "region": ["North", "South", "East", "West"],
            "revenue": [50000, 30000, 45000, 60000],
            "profit": [12000, 8000, 11000, 15000],
            "units": [100, 70, 85, 120],
        })

    def test_get_working_model_auto_detection(self):
        mock_client = MagicMock()
        m1 = MagicMock()
        m1.name = "models/gemini-3.5-flash"
        m2 = MagicMock()
        m2.name = "models/gemini-2.0-flash"  # deprecated, should be ignored
        mock_client.models.list.return_value = [m1, m2]

        llm_engine._CACHED_WORKING_MODEL = None
        detected = get_working_model(mock_client)
        self.assertEqual(detected, "gemini-3.5-flash")

    def test_single_chart_execution(self):
        code = """
result_text = "Sales summary"
fig = px.bar(df, x='region', y='revenue', title='Revenue by Region')
"""
        res = execute_generated_code(code, self.df)
        self.assertEqual(res["answer"], "Sales summary")
        self.assertEqual(len(res["charts"]), 1)
        self.assertIsNone(res["report_title"])

    def test_statistical_report_2x2_execution(self):
        code = """
report_title = "Regional Sales & Performance Executive Report"
result_text = "Comprehensive analysis across 4 key operational dimensions."
fig1 = px.line(df, x='region', y='revenue', title='Revenue Trend')
fig2 = px.scatter(df, x='revenue', y='profit', title='Revenue vs Profit')
fig3 = px.bar(df, x='region', y='units', title='Units Sold')
fig4 = px.pie(df, names='region', values='revenue', title='Revenue Share')
figs = [fig1, fig2, fig3, fig4]
"""
        res = execute_generated_code(code, self.df)
        self.assertEqual(res["report_title"], "Regional Sales & Performance Executive Report")
        self.assertEqual(len(res["charts"]), 4)
        for chart_str in res["charts"]:
            parsed = json.loads(chart_str)
            self.assertIn("data", parsed)
            self.assertIn("layout", parsed)

    def test_security_blocking(self):
        dangerous_codes = ["import os", "import sys", "open('test.txt', 'w')"]
        for code in dangerous_codes:
            with self.assertRaises((PermissionError, NameError)):
                execute_generated_code(code, self.df)

    def test_import_statement_and_ols_trendline(self):
        code = """
import plotly.express as px
import pandas as pd
result_text = "Analysis with trendline"
fig = px.scatter(df, x='revenue', y='profit', trendline='ols', title='Trendline Test')
figs = [fig]
"""
        res = execute_generated_code(code, self.df)
        self.assertEqual(res["answer"], "Analysis with trendline")
        self.assertEqual(len(res["charts"]), 1)

    def test_forbidden_imports_are_blocked(self):
        with self.assertRaises(PermissionError):
            execute_generated_code("import os\nresult_text = 'hack'", self.df)


class TestFastAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        SESSION_STORE.clear()

    def test_general_chat_without_dataset(self):
        mock_result = {
            "answer": "Machine learning is a field of AI focused on learning from data.",
            "charts": [],
            "chart_json": None,
            "report_title": None,
            "generated_code": "",
        }
        with patch("main.ask_data_agent", return_value=mock_result):
            resp = self.client.post(
                "/chat",
                json={"query": "Explain machine learning in simple terms"},
            )
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("Machine learning", data["answer"])
            self.assertEqual(len(data["charts"]), 0)
            self.assertIsNone(data["report_title"])

    def test_chat_with_statistical_report(self):
        csv_content = b"dept,budget,headcount\nSales,10000,10\nEngineering,25000,20\n"
        up_resp = self.client.post(
            "/upload",
            files={"file": ("budgets.csv", io.BytesIO(csv_content), "text/csv")},
        )
        session_id = up_resp.json()["session_id"]

        mock_result = {
            "answer": "Executive statistical overview.",
            "charts": ['{"chart": 1}', '{"chart": 2}', '{"chart": 3}', '{"chart": 4}'],
            "chart_json": '{"chart": 1}',
            "report_title": "Departmental Allocation Report",
            "generated_code": "figs = [fig1, fig2, fig3, fig4]",
        }
        with patch("main.ask_data_agent", return_value=mock_result):
            chat_resp = self.client.post(
                "/chat",
                json={"session_id": session_id, "query": "make a dashboard"},
            )
            self.assertEqual(chat_resp.status_code, 200)
            data = chat_resp.json()
            self.assertEqual(len(data["charts"]), 4)
            self.assertEqual(data["report_title"], "Departmental Allocation Report")


if __name__ == "__main__":
    unittest.main()
