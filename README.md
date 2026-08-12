# 🛰️ AI Governance Radar

An open-source **AI Governance Intelligence Dashboard** that runs entirely on your own
computer. It watches AI regulation, standards, incidents, and AI security developments,
then shows you **what changed and why it matters** — a radar, not another news feed.

Built for AI governance, risk, compliance, and security professionals — no developer
background required to run it.

## ✨ Why you might want this

- 🆓 **Free and yours** — open source, runs on your machine, no account, no subscription
- 🔌 **No AI subscription needed** — works completely without ChatGPT, Claude, or any
  AI service. (Optional AI features may come later, and even then you'll choose your
  own provider — including free local models.)
- 🔒 **Private by default** — your data never leaves your computer
- 📌 **Facts you can trust** — every regulation shows its official source, key dates,
  a confidence level, and the date a human last verified it. The software never
  invents legal facts.
- 🖥️ **Made to scan** — a dark, information-dense dashboard you can read in one glance
  over morning coffee

## 🚀 Getting it running

You'll copy and paste a few commands into a terminal. That's the extent of the
technical skill required — promise.

### Option 1 — Docker (easiest, if you have Docker Desktop installed)

```bash
git clone <repo-url>
cd ai-governance-radar
docker compose up
```

Then open **http://localhost:3000** in your browser. Done — the dashboard appears with
starter data already loaded.

### Option 2 — Run it directly (needs Python 3.12+ and Node.js 20+)

Think of it as two steps: **build the interface once**, then **start the app**.

```bash
git clone <repo-url>
cd ai-governance-radar

# Step 1: build the user interface (one time)
cd frontend
npm install
npm run build
cd ..

# Step 2: start the app
cd backend
python -m venv .venv
.venv\Scripts\activate          # on Mac/Linux use:  source .venv/bin/activate
pip install -e .
python -m app.cli serve
```

Open **http://127.0.0.1:8000**. The app creates its database and loads starter
content automatically the first time it runs.

### 📡 Pulling in fresh intelligence

The starter content gets you oriented. To fetch the latest real items from NIST, the
US Federal Register, GOV.UK, arXiv, and other monitored sources:

```bash
python -m app.cli ingest --force
```

Want it to check sources automatically while the app is running? Copy `.env.example`
to a file named `.env` and change `SCHEDULER_ENABLED=false` to `true`. (The `.env`
file is just a plain-text settings file — open it in any text editor.)

## 🧭 What's inside

| | Feature | What it gives you |
|---|---|---|
| 📊 | **Dashboard** | High-impact counts, top developments, a world map of regulatory activity, incidents, and standards — all on one screen |
| 🏛️ | **Regulatory Radar** | Tracked AI laws (Colorado AI Act, EU AI Act, and more) with status, key dates, penalties, and links to official sources |
| 📐 | **Standards** | NIST AI RMF, ISO/IEC 42001, OWASP, MITRE ATLAS — versions, status, and what changed |
| ⚠️ | **Incidents** | Real, documented AI incidents written up like intelligence reports, with severity and "confirmed vs. alleged" labels |
| 📰 | **All Sources** | Everything collected, newest first — filter by category, impact, confidence, or source |
| 🔍 | **Search** | One search box across everything, results grouped by type |
| 🩺 | **Source health** | See exactly which feeds are working, when they last succeeded, and why one failed |
| 📤 | **Import/export** | Take your settings with you, or export collected items as CSV — no lock-in, ever |

Starter/demo entries are always clearly labeled **DEMO DATA** so you never mistake
them for live intelligence.

## 🧠 How it works (the friendly version)

- Everything lives in **one program plus one database file** on your computer. The
  database is [SQLite](https://www.sqlite.org/) — no database server to install or
  manage; backing up means copying a single file.
- On a schedule (or when you click "Ingest"), the app **checks official feeds** —
  government sites, standards bodies, research archives — and files anything new.
- Every incoming item is automatically **sorted, de-duplicated, and scored** for
  impact and confidence using transparent rules you can inspect. Click any item and
  it shows you the math behind its score.
- Important distinction: **regulations, standards, and incidents are curated
  records** — maintained by humans with cited sources. The automatic feed-watcher can
  flag "something changed here, take a look," but it never rewrites legal facts on
  its own.
- The app is careful on the network, too: it only talks to the sources you've
  enabled, identifies itself honestly, and has guardrails against fetching anything
  it shouldn't (the security-minded can read [SECURITY.md](SECURITY.md)).

Want the deep technical version? See [ARCHITECTURE.md](ARCHITECTURE.md),
[DATA_MODEL.md](DATA_MODEL.md), and [DECISIONS.md](DECISIONS.md).

## ⚙️ Settings & customization

- Most things are configurable **inside the app** — turn sources on/off, change how
  often they're checked, add your own sources (RSS feeds or pages to watch).
- Sources are defined in a simple list file
  ([`data/sources/sources.yaml`](data/sources/sources.yaml)) — adding one is editing
  text, not writing code.
- Optional settings live in `.env` (copy `.env.example` to start). The app runs fine
  with no configuration at all.

## 🔐 Security & privacy

Designed for one person on their own machine: no login system, and the app only
listens on your computer (localhost) unless you deliberately change that. Don't
expose it to the open internet as-is. Details: [SECURITY.md](SECURITY.md).

## 🤝 Contributing

Contributions welcome — especially **new verified sources** (you don't need to code
to propose one!). Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## ⚖️ The obligatory disclaimer

AI Governance Radar is an information tool, **not legal advice**. Every regulatory
fact shows its source, dates, confidence, and when it was last verified — always
check the linked official source before acting. Map data:
[Natural Earth](https://www.naturalearthdata.com/) (public domain).

## 📄 License

See [LICENSE](LICENSE).
