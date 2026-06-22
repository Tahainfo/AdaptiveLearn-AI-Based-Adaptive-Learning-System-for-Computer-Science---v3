<div align="center">

<img src="docs/screenshots/banner.jpg" alt="AdaptiveLearn" width="25%"/>

# AdaptiveLearn

### AI-Powered Adaptive Learning System for Computer Science Education

*Turning every student's mistake into a personalized learning opportunity.*

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic"/>
  <img src="https://img.shields.io/badge/OpenRouter-6566F1?style=for-the-badge&logo=openai&logoColor=white" alt="OpenRouter"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render"/>
  <img src="https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=white" alt="Neon"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-success?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome"/>
  <img src="https://img.shields.io/badge/status-live-success?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/Made%20in-Morocco-C1272D?style=flat-square" alt="Made in Morocco"/>
</p>

**Live Demo:** [https://adaptivelearn-ppe.onrender.com](https://adaptivelearn-ppe.onrender.com)

</div>

---

## Overview

**AdaptiveLearn** is a full-stack web platform that brings **personalized, AI-driven learning** to computer science education in the Moroccan qualifying secondary school (*Tronc Commun Sciences — TCS*).

It was born from a real classroom problem observed during teaching practice: in classes of **30–35 students** with widely heterogeneous levels, teachers cannot provide individual feedback or differentiated remediation to everyone. AdaptiveLearn solves this by letting each student **self-assess**, receive an **AI-generated personalized report**, and practice **corrective exercises targeted at their own mistakes** — anonymously, without fear of judgment.

The platform is grounded in two pedagogical principles:

- **Pedagogy of Error** *(Astolfi, 1997)* — the error is treated as a learning tool, not a fault to punish.
- **Differentiated Instruction** — content, pace, and feedback adapt to each learner's needs.

> **Field result:** in the pilot class (TCS1, 30 students), average mastery rose by **+22.8 percentage points** (66.1% → 88.9%) across three diagnostic attempts.

---

## Table of Contents

- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [AI Engine](#ai-engine)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Results & Validation](#results--validation)
- [Roadmap](#roadmap)
- [Author](#author)
- [License](#license)

---

## Key Features

| Feature | Description |
|---|---|
| **AI Personalized Reports** | After each diagnostic test, an LLM generates a structured report: strengths, gaps by concept, key lessons, and a 3–5 step action plan. |
| **Targeted Corrective Exercises** | The AI auto-generates MCQs based on the exact questions a student got wrong. |
| **Answer Explanations** | Students can request a clear explanation for any incorrect answer. |
| **Mastery Tracking** | A mastery level (0–1) is computed and stored per student, per concept, updated after every attempt. |
| **6 Question Types** | MCQ, True/False, Short Answer, Reordering, Matching, and Long Answer (keyword-based scoring). |
| **Gamification** | Badges unlocked at ≥ 90% mastery and downloadable PDF certificates per sequence. |
| **Full TCS Curriculum** | 4 modules, 12 pedagogical sequences, and 40+ concepts aligned with the official program. |
| **Bilingual Interface** | Built-in internationalization (French / English). |
| **Secure Auth & Roles** | Bearer-token authentication with RBAC (`student` / `admin`) and bcrypt password hashing. |
| **Teacher Analytics** | Dashboards with stats by class, sequence, and attempt; per-student progress and an audit log. |
| **Production Deployment** | Live on Render with a persistent PostgreSQL database on Neon — supports concurrent multi-user access. |

---

## Screenshots

<div align="center">

**Authentication**

<img src="docs/screenshots/login.jpg" alt="Login and registration interface" width="80%"/>

<br/><br/>

**Student Dashboard** — progress by module and sequence, badges, and AI recommendations

<img src="docs/screenshots/tableau de bord etudiant.jpg" alt="Student dashboard" width="80%"/>

<br/><br/>

**Diagnostic Test** — multi-type questions with a progress bar and instant feedback

<img src="docs/screenshots/qcm.jpg" alt="Diagnostic test interface" width="80%"/>

<br/><br/>

**AI Pedagogical Report** — personalized post-test analysis with corrective exercises

<img src="docs/screenshots/bilan1.jpg" alt="AI generated pedagogical report" width="80%"/>
<img src="docs/screenshots/bilan2.jpg" alt="AI generated pedagogical report" width="80%"/>
<img src="docs/screenshots/bilan3.jpg" alt="AI generated pedagogical report" width="80%"/>

<br/><br/>

**Admin Analytics Dashboard** — per-class, per-sequence, and per-attempt statistics

<img src="docs/screenshots/analytics_parclasse.jpg" alt="Admin analytics dashboard" width="80%"/>
<img src="docs/screenshots/analytics_paretudiant.jpg" alt="Admin per-student analytics" width="80%"/>

</div>

---

## Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=py,fastapi,postgres,js,html,css,git,github,vscode" alt="Tech stack logos"/>

</div>

<div align="center">

| Layer | Technologies |
|---|---|
| **Backend** | Python · FastAPI · Uvicorn (ASGI) |
| **Database** | PostgreSQL 16 — hosted on **Neon** (serverless) |
| **Validation** | Pydantic v2 |
| **Security** | Bearer Token Auth · bcrypt · RBAC |
| **Frontend** | HTML5 · CSS3 · Vanilla JavaScript (SPA) · i18n (fr/en) |
| **AI / LLM** | OpenRouter — Nemotron-120B · GPT-OSS-20B · Gemma-4-31B |
| **Hosting** | **Render** (Web Service — Free tier) |
| **Tooling** | Git · GitHub · Visual Studio Code |

</div>

---

## Architecture

AdaptiveLearn follows a classic **three-tier architecture**:

<div align="center">

<img src="docs/screenshots/architechture.png" alt="AdaptiveLearn three-tier architecture diagram" width="80%"/>

</div>

---

## AI Engine

The AI engine powers three features through the **OpenRouter** unified API, with an automatic **model-cascade fallback** that guarantees continuity when a free model hits a rate limit (`HTTP 429`):

```
nvidia/nemotron-120b:free
        └─▶ openai/gpt-oss-20b:free
                └─▶ google/gemma-4-31b-it:free
                        └─▶ openrouter/auto
```

| Endpoint | Purpose |
|---|---|
| `POST /ai/explain` | Explains why a given answer is correct. |
| `POST /ai/learning-guide` | Generates the personalized pedagogical report. |
| `POST /ai/corrective-exercises` | Builds targeted MCQs from the student's mistakes. |

---

## Getting Started

### Prerequisites

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-API%20key-6566F1?logo=openai&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00E599?logo=postgresql&logoColor=white)

- Python 3.11+
- An [OpenRouter](https://openrouter.ai) API key (free tier works)
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Tahainfo/AdaptiveLearn-AI-Based-Adaptive-Learning-System-for-Computer-Science---v3.git
cd AdaptiveLearn-AI-Based-Adaptive-Learning-System-for-Computer-Science---v3

# 2. Create a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

### Environment variables

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
DATABASE_URL=postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

> **Never commit your `.env`** — make sure it is listed in `.gitignore`.

### Run the app locally

```bash
uvicorn backend.main:app --reload --host localhost --port 8000
```

Then open **http://localhost:8000** in your browser.

---

## Deployment

AdaptiveLearn is deployed in production with the following stack:

| Service | Role | URL |
|---|---|---|
| **Render** | Web server (FastAPI + Uvicorn) | [adaptivelearn-ppe.onrender.com](https://adaptivelearn-ppe.onrender.com) |
| **Neon** | Serverless PostgreSQL database | [neon.tech](https://neon.tech) |

### Deploy your own instance

1. Create a free PostgreSQL database on [Neon](https://neon.tech) and copy the connection string.
2. Create a free Web Service on [Render](https://render.com) connected to this GitHub repo.
3. Set the following environment variables on Render:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |

4. Set the **Start Command** on Render to:
```
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```
5. Add a `.python-version` file at the repo root containing `3.11.0`.

> The free Render instance spins down after 15 minutes of inactivity — the first request may take ~30 seconds to wake up.

---

## User Roles

<div align="center">

| Student | Teacher (Admin) |
|---|---|
| Register / log in | Manage student accounts |
| Take diagnostic tests | Create & edit diagnostic exercises |
| Read the AI report | View class & per-student analytics |
| Practice corrective exercises | Track mastery by concept and attempt |
| Track progress & earn badges | Consult the audit log |

</div>

---

## Project Structure

```
AdaptiveLearn/
├── backend/
│   ├── database/       # PostgreSQL connection, init_db, seed data
│   ├── routes/         # FastAPI routers (auth, diagnostic, AI, analytics...)
│   ├── models/         # Pydantic models
│   └── main.py         # FastAPI app entry point
├── frontend/           # SPA — HTML / CSS / JavaScript, i18n
├── docs/               # Screenshots, banner, documentation
├── .env                # API keys (not committed)
├── .python-version     # Forces Python 3.11 on Render
├── requirements.txt
└── README.md
```

---

## Results & Validation

The system was validated on the **TCS1** pilot class (**30 students**, 3 attempts per concept):

<div align="center">

| Class | Students | Attempt 1 | Attempt 2 | Attempt 3 | Gain |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **TCS1** | 30 | 66.1% | 80.7% | 88.9% | **+22.8 pts** |

</div>

This progression validates the core learning loop:

```
Diagnose  →  Adaptive Exercises  →  Re-assess
```

**Database stats (production — Neon PostgreSQL):**

| Table | Rows |
|---|---|
| students | 124 |
| diagnostic_attempts | 1,476 |
| diagnostic_question_results | 3,310 |
| mastery_state | 531 |
| concepts | 39 |

---

## Roadmap

- [x] Full TCS curriculum (4 modules, 12 sequences, 40+ concepts)
- [x] AI engine with model-cascade fallback (OpenRouter)
- [x] Deployed on Render with PostgreSQL on Neon
- [ ] Pilot testing in a real classroom with live data collection
- [ ] Mobile version (PWA)
- [ ] Extension to other subjects (Math, Physics-Chemistry, Life Sciences)
- [ ] Deep Knowledge Tracing (LSTM-based mastery modeling)
- [ ] Computerized Adaptive Testing (Item Response Theory)
- [ ] Parent progress dashboard
- [ ] LMS integration (Moodle / Google Classroom via SCORM / xAPI)

---

## Author

**ISMAILI Taha**
Personal Supervised Project (PPE) — CRMEF Casablanca-Settat
Supervised by **Mme. BAZI Kaoutar**
2025 / 2026

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **CRMEF Casablanca-Settat** for the training and pedagogical guidance.
- The teachers and students of the qualifying high schools who took part in the field observations.
- Pedagogical foundations: *Astolfi (1997)*, *Bloom (1984)*, *Black & Wiliam (1998)*, *Vygotsky (1978)*, *Bruner (1966)*.
- Infrastructure: [Render](https://render.com) · [Neon](https://neon.tech) · [OpenRouter](https://openrouter.ai)

<div align="center">

---

**If you find this project useful, consider giving it a star.**

</div>
