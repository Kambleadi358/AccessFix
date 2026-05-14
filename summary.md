# AccessFix Project Summary

## 🚀 Overview
**AccessFix** is an enterprise-grade accessibility auditing and remediation platform. It allows developers and auditors to scan websites for WCAG 2.1/2.2 violations, predict their severity using Machine Learning, and generate AI-assisted code fixes automatically.

---

## 🛠 Tech Stack
| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Recharts |
| **Backend** | Node.js, Express, TypeScript, Express-Validator |
| **Automation** | Puppeteer (Headless Chrome) |
| **AI / LLM** | OpenAI (GPT-4), Claude 3 (Anthropic) |
| **ML Model** | Python, Scikit-learn, Pandas (Random Forest / Logistic Regression) |
| **Data Flow** | Axios, REST API, Monorepo Architecture |

---

## 🔄 Project Pipeline & Flow

### 1. Initiation Phase
*   **User Input**: The user provides a URL via the frontend dashboard.
*   **Scan Request**: The frontend sends a request to `POST /api/scans`.

### 2. Execution Phase (The Engine)
*   **Puppeteer Orchestration**: 
    *   `PuppeteerEngine` launches a headless browser.
    *   Navigates to the target URL and waits for full DOM rendering (`networkidle0`).
    *   Injects audit scripts into the page context.
*   **Violation Detection**: 
    *   The `RuleEngine` iterates through WCAG success criteria.
    *   It identifies failing DOM elements and extracts their **HTML snippets**, **CSS selectors**, and **computed styles**.
*   **Screenshot Capture**: Puppeteer captures a full-page or element-specific screenshot for visual reference.

### 3. Analysis & Intelligence Phase
*   **ML Severity Prediction**: 
    *   Violations are passed to a Python-based ML model.
    *   **Algorithm**: Typically a Random Forest Classifier trained on accessibility datasets.
    *   **Features**: Rule ID, element type, nesting depth, and presence of certain attributes.
    *   **Output**: Severity classification (Critical, Major, Minor).
*   **AI Remediation**:
    *   `RemediationService` constructs a prompt containing the violation context and the "dirty" HTML snippet.
    *   Sends this to an LLM (OpenAI/Claude).
    *   The AI returns a "clean" accessible HTML version and an explanation of the fix.

### 4. Scoring Phase
*   **Scoring Engine**: 
    *   Calculates an overall accessibility score (0-100).
    *   Assigns a letter grade (A-F) based on violation density and severity weightage.

### 5. Finalization Phase
*   **Report Generation**: 
    *   Data is aggregated into a `ScanResult`.
    *   `ReportService` generates CSV, JSON, or standard HTML reports.
    *   `RemediationReportService` generates a specialized side-by-side "Before vs After" HTML report.

---

## 🧠 AI & Machine Learning Integration

### Machine Learning (ML)
*   **Purpose**: Predictive severity analysis.
*   **How it's used**: Instead of relying solely on hardcoded severity, the system uses a trained model to understand the *contextual* impact of a violation.
*   **Bridge**: A Node.js-to-Python bridge executes scripts to get real-time predictions.

### Artificial Intelligence (AI)
*   **Purpose**: Contextual remediation and education.
*   **How it's used**: 
    *   **Fix Generation**: Uses LLMs to perform "snippet-level patching".
    *   **WCAG Education**: Explains complex legal requirements in plain English.
    *   **Confidence Scoring**: The AI provides a confidence level for its suggested fixes.

---

## 🌐 DOM & Puppeteer Mechanics

### Why Puppeteer?
*   **Dynamic Content**: Modern apps (React/Vue) need JavaScript execution to show content. Puppeteer ensures we audit the *rendered* state, not just the raw HTML source.
*   **DOM Interaction**: We use `page.evaluate()` to run scripts directly inside the browser's memory, allowing us to check things like keyboard focus, color contrast, and ARIA relationships.
*   **Snippet Extraction**: We use DOM selectors to grab the exact `outerHTML` of failing elements for the AI to fix.

---

## 📈 Summary of Capabilities
1.  **Deep Scanning**: Full WCAG 2.1 compliance check.
2.  **Visual Audit**: Integrated screenshots with violation overlays.
3.  **One-Click Fixes**: AI-generated code that can be copied directly.
4.  **Professional Export**: High-quality reports for stakeholders and developers.
5.  **Historical Tracking**: Compare scores over time to see accessibility improvements.
