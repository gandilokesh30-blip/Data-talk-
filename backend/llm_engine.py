"""
llm_engine.py
Versatile AI Assistant and expert Data Analyst engine using Google GenAI SDK.
Auto-detects the fastest working Flash model and uses thinking_budget=0 with instant failover
to eliminate 404, 503, and 504 deadline errors.
"""

import json
import os
import re
import traceback
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
_local_env = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_local_env):
    load_dotenv(_local_env)

# Priority order for active Flash models (avoiding deprecated 2.0-flash and 2.5-flash)
PREFERRED_FLASH_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
]

# Explicitly blacklisted deprecated / sunset models that return 404
DEPRECATED_MODELS = {"gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.0-pro"}

_CACHED_WORKING_MODEL: Optional[str] = None

GENERAL_SYSTEM_INSTRUCTION = """You are a versatile, highly intelligent AI Assistant (like ChatGPT).
You can answer general questions, explain complex concepts, write code, assist with data science theory, and hold natural conversations.
Format your responses cleanly using Markdown with clear paragraph breaks, bullet points, or code blocks where appropriate.
Be direct, helpful, and concise.
"""

DATA_AGENT_SYSTEM_INSTRUCTION = """You are an expert Senior Data Analyst and Chief Data Scientist.
You have access to a pandas DataFrame named `df` (which is already loaded in memory), pandas imported as `pd`, numpy as `np`, Plotly Express as `px`, and Plotly Graph Objects as `go`.
All standard data libraries (pandas, numpy, plotly, statsmodels) are pre-imported and available.

Your objective is to answer user queries with precision, high-impact statistical insights, and publication-grade visualizations.

You operate in 3 distinct modes:

MODE 1: GENERAL / CONCEPTUAL CHAT (No code needed):
If the user's message is a greeting ("hi", "hello"), a conceptual question ("what is p-value?", "explain machine learning"), or completely unrelated to analyzing the loaded dataset:
- Provide your full, articulate conversational answer directly in `result_text`.
- Set `figs = []`, `fig = None`, and `report_title = None`.

MODE 2: SPECIFIC DATA QUERY / SINGLE-CHART MODE:
If the user asks a specific analytical question about the dataset (e.g., "What is the average rainfall?", "Plot sales by region", "Show top 5 categories"):
- Write clean, fast Pandas operations to compute exact metrics and answers.
- Assign your concise textual answer with exact numbers to `result_text` (string).
- If a chart is relevant or requested, build 1 clean Plotly figure using `px` and assign `figs = [fig]` (or `fig = ...`).
- If no chart is needed (e.g. only a number or summary metric), set `figs = []` and `fig = None`.
- Set `report_title = None`.

MODE 3: DYNAMIC 2x2 STATISTICAL REPORT MODE:
If the user asks to "make a dashboard", "create a report", "visualize everything", "full analysis", "build dashboard", or asks for an executive statistical overview:
- Inspect the dataset schema, data types, and distributions to design 4 complementary, publication-grade Plotly charts:
  1. `fig1`: Primary Temporal/Sequential Trend or Overall Distribution (e.g., Line chart with markers or Histogram/Density plot).
  2. `fig2`: Secondary Trend or Correlation (e.g., Scatter plot with trendline or Grouped distribution/Box plot).
  3. `fig3`: Categorical Comparison (e.g., Bar chart comparing primary dimensions or top performers).
  4. `fig4`: Composition / Breakdown (e.g., Donut or Pie chart showing proportional shares, or horizontal breakdown).
- Assign all 4 figures to a list variable: `figs = [fig1, fig2, fig3, fig4]`.
- Assign a tailored, professional statistical report title to `report_title` (e.g., "Executive Academic Performance & Behavioral Report").
- Assign a rich, multi-paragraph statistical executive summary with bulleted key takeaways to `result_text`.

VISUALIZATION STYLING RULES:
- Always style every Plotly figure with `template="plotly_white"`.
- Clean dashed gridlines:
  `fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='rgba(0,0,0,0.06)', griddash='dash')`
  `fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='rgba(0,0,0,0.06)', griddash='dash')`
- Set clean chart titles and readable axis labels.
- Both `px.scatter(..., trendline="ols")` and custom correlations are fully supported.

OUTPUT RULES:
- Return ONLY raw, valid, executable Python code. NO markdown formatting, NO ```python, NO backticks.
- DO NOT call fig.show(), plt.show(), or print().
- NEVER import os, sys, subprocess, open, or network libraries.
"""

# Allowed module roots for safe execution imports
ALLOWED_MODULE_ROOTS = {
    "pandas",
    "numpy",
    "plotly",
    "statsmodels",
    "scipy",
    "math",
    "datetime",
    "json",
    "re",
    "collections",
    "itertools",
    "functools",
    "fractions",
    "decimal",
    "random",
    "patsy",
    "formulaic",
    "warnings",
}


def safe_import(name: str, globals: Any = None, locals: Any = None, fromlist: Any = (), level: int = 0) -> Any:
    """
    Safely delegates imports only for approved data analysis and math libraries.
    Blocks any attempt to import os, sys, subprocess, socket, etc.
    """
    root_pkg = name.split(".")[0]
    if root_pkg in ALLOWED_MODULE_ROOTS:
        return __import__(name, globals, locals, fromlist, level)
    raise ImportError(f"Importing '{name}' is not permitted in the safe data analysis sandbox.")


# Restricted built-ins for safe sandbox execution
SAFE_BUILTINS: Dict[str, Any] = {
    "__import__": safe_import,
    "abs": abs, "all": all, "any": any, "bin": bin, "bool": bool, "bytearray": bytearray,
    "bytes": bytes, "callable": callable, "chr": chr, "complex": complex, "dict": dict,
    "dir": dir, "divmod": divmod, "enumerate": enumerate, "filter": filter, "float": float,
    "format": format, "frozenset": frozenset, "getattr": getattr, "hasattr": hasattr,
    "hash": hash, "hex": hex, "id": id, "int": int, "isinstance": isinstance, "issubclass": issubclass,
    "iter": iter, "len": len, "list": list, "map": map, "max": max, "min": min,
    "next": next, "oct": oct, "ord": ord, "pow": pow, "print": print, "range": range,
    "repr": repr, "reversed": reversed, "round": round, "set": set, "slice": slice,
    "sorted": sorted, "str": str, "sum": sum, "tuple": tuple, "type": type, "vars": vars,
    "zip": zip, "None": None, "True": True, "False": False,
    "Exception": Exception, "ValueError": ValueError, "TypeError": TypeError,
    "KeyError": KeyError, "IndexError": IndexError, "ZeroDivisionError": ZeroDivisionError,
    "AttributeError": AttributeError, "ArithmeticError": ArithmeticError,
    "FloatingPointError": FloatingPointError, "OverflowError": OverflowError,
    "RuntimeError": RuntimeError, "StopIteration": StopIteration,
    "Warning": Warning, "UserWarning": UserWarning,
}

FORBIDDEN_PATTERNS = [
    r"\bimport\s+os\b", r"\bimport\s+sys\b", r"\bimport\s+subprocess\b",
    r"\bfrom\s+os\b", r"\bfrom\s+sys\b", r"\bfrom\s+subprocess\b",
    r"\bopen\s*\(", r"\b__import__\b", r"\beval\s*\(", r"\bexec\s*\(",
    r"\bcompile\s*\(", r"\bshutil\b", r"\bpathlib\b", r"\bsocket\b",
    r"\brequests\b", r"\burllib\b",
]


def get_client() -> genai.Client:
    """Returns an initialized genai.Client."""
    api_key = os.getenv("GEMINI_API_KEY") or ""
    if not api_key or api_key.strip() == "your_gemini_api_key_here":
        raise ValueError(
            "GEMINI_API_KEY is not configured. Please set a valid GEMINI_API_KEY in backend/.env file."
        )
    return genai.Client(api_key=api_key)


def get_working_model(client: genai.Client) -> str:
    """
    Checks available models via client.models.list(), filters out deprecated models,
    and picks the first available fast Flash model in priority order.
    Caches the detected model name globally so it only checks once.
    """
    global _CACHED_WORKING_MODEL
    if _CACHED_WORKING_MODEL is not None:
        return _CACHED_WORKING_MODEL

    env_model = os.getenv("GEMINI_MODEL")
    if env_model and env_model.strip():
        _CACHED_WORKING_MODEL = env_model.strip()
        return _CACHED_WORKING_MODEL

    try:
        available_names = set()
        for m in client.models.list():
            raw_name = getattr(m, "name", "") or ""
            clean_name = raw_name.replace("models/", "").lower()
            if clean_name not in DEPRECATED_MODELS:
                available_names.add(clean_name)
                available_names.add(raw_name.lower())

        for target in PREFERRED_FLASH_MODELS:
            target_clean = target.lower()
            if target_clean in available_names or any(target_clean in a for a in available_names):
                _CACHED_WORKING_MODEL = target
                print(f"[Model Auto-Detection] Selected active Flash model: {_CACHED_WORKING_MODEL}")
                return _CACHED_WORKING_MODEL

    except Exception as exc:
        print(f"[Model Auto-Detection] Could not list models ({exc}). Defaulting to {PREFERRED_FLASH_MODELS[0]}")

    _CACHED_WORKING_MODEL = PREFERRED_FLASH_MODELS[0]
    return _CACHED_WORKING_MODEL


def build_fast_config(system_instruction: str, temperature: float = 0.2) -> types.GenerateContentConfig:
    """
    Constructs a fast GenerateContentConfig with thinking_budget=0 (if supported)
    so responses return quickly without prolonged thinking delays.
    """
    try:
        return types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
    except Exception:
        return types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
        )


def call_gemini_fast(
    client: genai.Client,
    contents: Any,
    system_instruction: str,
    temperature: float = 0.2,
) -> Any:
    """
    Calls Gemini with thinking_budget=0 and automatic instant fallback across
    preferred active Flash models if a 503 (high demand) or 404 (not found) occurs.
    """
    global _CACHED_WORKING_MODEL
    current_model = get_working_model(client)
    config = build_fast_config(system_instruction=system_instruction, temperature=temperature)

    # Build sequence of models to attempt
    models_to_try = [current_model] + [m for m in PREFERRED_FLASH_MODELS if m != current_model]
    last_err = None

    for m in models_to_try:
        try:
            res = client.models.generate_content(
                model=m,
                contents=contents,
                config=config,
            )
            # Update cache to working model
            _CACHED_WORKING_MODEL = m
            return res
        except Exception as exc:
            err_str = str(exc)
            last_err = exc

            # If thinking_config was rejected by model, try without it on this model
            if "thinking_config" in err_str or "INVALID_ARGUMENT" in err_str:
                try:
                    fallback_config = types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=temperature,
                    )
                    res = client.models.generate_content(
                        model=m,
                        contents=contents,
                        config=fallback_config,
                    )
                    _CACHED_WORKING_MODEL = m
                    return res
                except Exception as inner_exc:
                    last_err = inner_exc

            # On 503 (high demand), 404 (model sunset), or 504 (timeout), try next model
            if any(code in err_str for code in ["503", "404", "504", "UNAVAILABLE", "NOT_FOUND", "DEADLINE_EXCEEDED"]):
                print(f"[Model Fallback] {m} failed ({err_str[:60]}), switching to next model...")
                continue

            continue

    raise last_err or RuntimeError("All Flash models failed.")


def clean_code(raw_code: str) -> str:
    """Strips markdown code fences and unnecessary whitespace."""
    code = raw_code.strip()
    if code.startswith("```"):
        lines = code.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        code = "\n".join(lines).strip()
    return code


def validate_code_safety(code: str) -> None:
    """Checks code against forbidden patterns to prevent sandbox escapes."""
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            raise PermissionError(f"Security restriction violation: pattern '{pattern}' is blocked.")


def apply_publication_styling(fig: Any) -> Any:
    """Applies clean publication styling: template plotly_white and dashed gridlines."""
    if hasattr(fig, "update_layout"):
        try:
            fig.update_layout(
                template="plotly_white",
                font=dict(family="Inter, system-ui, sans-serif", size=12, color="#334155"),
                margin=dict(l=40, r=30, t=50, b=40),
            )
            fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor="rgba(0,0,0,0.06)", griddash="dash")
            fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor="rgba(0,0,0,0.06)", griddash="dash")
        except Exception:
            pass
    return fig


def serialize_fig(fig: Any) -> Optional[str]:
    """Safely serializes a Plotly figure to a JSON string."""
    if fig is None:
        return None
    fig = apply_publication_styling(fig)
    if hasattr(fig, "to_json"):
        return fig.to_json()
    if isinstance(fig, dict):
        return json.dumps(fig)
    return None


def execute_generated_code(code: str, df: pd.DataFrame) -> Dict[str, Any]:
    """
    Executes Python code in a restricted execution scope.
    Captures result_text, figs (list), fig (single), and report_title.
    """
    validate_code_safety(code)

    exec_scope: Dict[str, Any] = {
        "__builtins__": SAFE_BUILTINS,
        "df": df.copy(),
        "pd": pd,
        "px": px,
        "go": go,
        "np": np,
        "result_text": None,
        "fig": None,
        "figs": None,
        "report_title": None,
    }

    exec(code, exec_scope)

    raw_result_text = exec_scope.get("result_text")
    if raw_result_text is None:
        answer = "Analysis completed, but no text answer was generated in `result_text`."
    else:
        answer = str(raw_result_text)

    # Collect figures from figs (list) or fig (single)
    charts: List[str] = []
    raw_figs = exec_scope.get("figs")
    raw_single_fig = exec_scope.get("fig")

    if isinstance(raw_figs, (list, tuple)):
        for f in raw_figs:
            chart_str = serialize_fig(f)
            if chart_str:
                charts.append(chart_str)
    elif raw_figs is not None:
        chart_str = serialize_fig(raw_figs)
        if chart_str:
            charts.append(chart_str)

    if not charts and raw_single_fig is not None:
        chart_str = serialize_fig(raw_single_fig)
        if chart_str:
            charts.append(chart_str)

    report_title = exec_scope.get("report_title")
    if report_title:
        report_title = str(report_title).strip()
    else:
        report_title = None

    return {
        "answer": answer,
        "charts": charts,
        "chart_json": charts[0] if charts else None,
        "report_title": report_title,
    }


def ask_data_agent(
    df: Optional[pd.DataFrame],
    schema_info: Optional[str],
    user_query: str,
) -> Dict[str, Any]:
    """
    Fast router supporting:
    1. General Chat Mode (if df is None or query is conceptual / general)
    2. Single-Chart / Specific Query Mode
    3. Dynamic 2x2 Statistical Report Mode (with report_title and 4 charts)
    """
    client = get_client()

    # MODE 1: Pure General Chat (no dataset active)
    if df is None or schema_info is None:
        response = call_gemini_fast(
            client=client,
            contents=user_query,
            system_instruction=GENERAL_SYSTEM_INSTRUCTION,
            temperature=0.3,
        )
        return {
            "answer": response.text or "I am here to help! Ask me anything or upload a dataset to begin data analysis.",
            "charts": [],
            "chart_json": None,
            "report_title": None,
            "generated_code": "",
        }

    # MODES 2 & 3: Data Analysis Mode (with active dataset)
    initial_prompt = (
        f"DATASET SCHEMA INFORMATION:\n{schema_info}\n\n"
        f"USER QUERY:\n{user_query}\n\n"
        "Remember:\n"
        "- If user asks to 'make a dashboard', 'create a report', or 'full analysis', generate 4 diverse Plotly charts in `figs = [fig1, fig2, fig3, fig4]` and set `report_title`.\n"
        "- If specific question or single chart, set `figs = [fig]` (or `fig = ...`) and `report_title = None`.\n"
        "- If general/conceptual question, answer conversationally in `result_text` with `figs = []`.\n"
        "- Return ONLY raw executable Python code. Assign string to `result_text`."
    )

    current_prompt = initial_prompt
    max_retries = 1
    last_error_traceback: Optional[str] = None
    latest_code: str = ""

    for attempt in range(max_retries + 1):
        try:
            response = call_gemini_fast(
                client=client,
                contents=current_prompt,
                system_instruction=DATA_AGENT_SYSTEM_INSTRUCTION,
                temperature=0.1,
            )

            raw_code = response.text or ""
            latest_code = clean_code(raw_code)

            if not latest_code:
                raise ValueError("Gemini returned empty code.")

            result = execute_generated_code(latest_code, df)

            return {
                "answer": result["answer"],
                "charts": result["charts"],
                "chart_json": result["chart_json"],
                "report_title": result["report_title"],
                "generated_code": latest_code,
            }

        except Exception as exc:
            last_error_traceback = traceback.format_exc()

            if attempt < max_retries:
                current_prompt = (
                    f"The previous Python code generated for user query '{user_query}' encountered an error:\n\n"
                    f"DATASET SCHEMA:\n{schema_info}\n\n"
                    f"PREVIOUS CODE:\n{latest_code}\n\n"
                    f"ERROR TRACEBACK:\n{last_error_traceback}\n\n"
                    "Please diagnose and return corrected raw Python code. "
                    "Assign text to `result_text` and figures to `figs` or `fig`."
                )
            else:
                raise RuntimeError(
                    f"Failed to execute data analysis after retry.\n"
                    f"Error: {exc}\n"
                    f"Last Code:\n{latest_code}\n"
                    f"Traceback:\n{last_error_traceback}"
                ) from exc
