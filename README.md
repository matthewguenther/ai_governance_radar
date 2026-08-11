# AI Governance Radar

Open-source, local-first **AI Governance Intelligence Dashboard**. It monitors AI
regulation, standards & frameworks, incidents, and AI security developments, then
surfaces **what changed and why it matters** — a radar, not a news feed.

> **Status: pre-alpha (planning complete, implementation not started).**
> This README is a stub; it grows with the product (see TASKS.md T-032).

- Free, self-hostable, no cloud dependency
- **Fully functional without any LLM or paid API key**; model-agnostic AI enrichment
  comes later as an optional layer
- Dark, dense, professional intelligence-terminal UI

## Planned quick start (target UX — not functional yet)

```bash
git clone <repo-url>
cd ai-governance-radar
docker compose up
# open http://localhost:3000
```

## Project documentation

| File | Purpose |
|---|---|
| [PRODUCT_SPEC.md](PRODUCT_SPEC.md) | Normalized product requirements |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design & stack |
| [DATA_MODEL.md](DATA_MODEL.md) | Database schema & integrity rules |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | UI tokens, components, accessibility |
| [TASKS.md](TASKS.md) | V1 backlog |
| [DECISIONS.md](DECISIONS.md) | Architecture decision records |
| [TEST_PLAN.md](TEST_PLAN.md) | Verification strategy |

## Disclaimer

This application is an information and intelligence tool. **It is not legal advice.**
Regulatory information is presented with its source, date, jurisdiction, confidence,
and verification timestamp; verify against primary sources before acting.

## License

See [LICENSE](LICENSE).
