# AccessFix — AI-Powered Accessibility Remediation Platform

AccessFix is a professional, research-grade web accessibility analyzer designed to bridge the gap between detection and remediation. It scans modern, JavaScript-heavy websites against WCAG 2.1/2.2 standards and uses Generative AI to provide precise, copy-pasteable HTML fixes for every violation.

---

## 🏛 Architecture Overview

AccessFix is built as a TypeScript Monorepo for maximum type safety and modularity.

```text
[ Browser / User ]
       |
       v
[ React Frontend ] <--- (REST API) ---> [ Express Backend ]
                                             |
       ---------------------------------------
       |                  |                  |
[ Puppeteer ]      [ Rule Engine ]     [ AI Engine ]
(DOM Rendering)    (WCAG Analysis)     (LLM Remediation)
       |                  |                  |
       v                  v                  v
[ Static HTML ]    [ Violations ]     [ AIFixSuggestions ]
                                             |
                                             v
                                     [ SQLite Database ]
```

---

## 🚀 Key Features

*   **Deep DOM Analysis**: Uses Puppeteer to analyze the actual rendered state of SPAs (React, Vue, etc.), not just static source code.
*   **AI-Assisted Remediation**: Automated batching pipeline that uses LLMs (GPT-4o, Claude 3) to generate accessibility fixes.
*   **Weighted Scoring Engine**: Calculates a 0-100 score based on severity (Critical, Major, Minor) with customizable penalties.
*   **Bulk Actions**: Manage large-scale audits with bulk ignore/dismiss functionality.
*   **Multi-Format Export**: Generate professional reports in PDF, CSV, and HTML formats.
*   **Settings Dashboard**: Live control over AI providers, models, and scoring sensitivity.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, TailwindCSS, Recharts, Lucide, Axios |
| **Backend** | Node.js, Express, TypeScript, Better-SQLite3, Cheerio |
| **Analysis** | Puppeteer (Headless Chromium), WCAG 2.1/2.2 Ruleset |
| **AI** | OpenAI API, Anthropic API, Llama (via Provider Factory) |

---

## ⚙️ Setup & Installation

### 1. Prerequisites
*   **Node.js**: v18 or higher.
*   **Key**: OpenAI or Anthropic API Key (required for AI remediation).

### 2. Quick Setup
From the repository root, run the setup script to install all dependencies and build shared types:
```bash
npm run setup
```

### 3. Environment Configuration
Create a `.env` file in the root directory (linked to backend):
```env
PORT=4000
DATABASE_URL=./data/accessfix.db
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

### 4. Start Development
```bash
npm run dev
```
*   **Dashboard**: [http://localhost:5173](http://localhost:5173)
*   **API**: [http://localhost:4000](http://localhost:4000)

---

## 📡 API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/scans` | `POST` | Start a new accessibility scan for a URL. |
| `/api/scans/:id` | `GET` | Retrieve structured scan results. |
| `/api/reports/:id/:format`| `GET` | Generate and download a report (pdf, html, csv). |
| `/api/stats` | `GET` | Get global dashboard statistics and charts. |
| `/api/settings` | `PATCH`| Update AI provider and scoring penalties. |
| `/api/ai/status` | `GET` | Check connectivity of the AI provider. |

---

## 🧪 Testing & Validation

AccessFix includes an automated stress test to validate the AI batching engine and token limit handling:
```bash
# Run the AI Stress Test
npm run test --workspace=@accessfix/backend
```

---

## 📄 License
Research Project — Developed for Advanced Agentic Coding. Internal Use Only.
