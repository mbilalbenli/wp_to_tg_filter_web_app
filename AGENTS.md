# Agent Rules & Documentation Contract (`wp_to_tg_filter_web_app`)

## 1. Core Engineering & Quality Rules
- Avoid unnecessary secondary labels and descriptions. Let the layout speak for itself. Avoid using `eyebrow text` components.
- Fix issues at their root cause. Reason from first principles and established best practices. Don't mask symptoms with patches or workarounds.
- Treat reviews as evidence-based quality gates, not open-ended opportunities for improvement. Block progress only for:
  - Reproducible, task-relevant bugs demonstrated by failing tests or concrete reproduction steps.
  - P0 security vulnerabilities with a credible exploit path or critical impact, such as unauthorized access, secret exposure, or irreversible data loss.
- Evaluate findings based on evidence, severity, and actual impact rather than speculation or hypothetical edge cases.
- Fix blocking issues at their root cause and verify the fix. Record all non-blocking findings, improvements, refactoring suggestions, and speculative concerns in `docs/BACKLOG.md` with a brief rationale, then continue the original task.
- Do not enter repeated review cycles or delay completion without new, concrete evidence of a blocking issue. Prefer shipping verified, working changes over pursuing theoretical perfection. 

## 2. Mandatory `/docs` Synchronization Contract (All 12 Documents)
Every document under `/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/` MUST be populated, referenced, and kept 100% synchronized throughout the lifecycle of the project:

1. **`docs/PROJECT_TARGET.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/PROJECT_TARGET.md`):
2. **`docs/ARCHITECTURE.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/ARCHITECTURE.md`):
3. **`docs/DOMAIN_MODEL.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/DOMAIN_MODEL.md`):
4. **`docs/API_CONTRACT.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/API_CONTRACT.md`):
5. **`docs/DESIGN.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/DESIGN.md`):
6. **`docs/COMPONENTS.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/COMPONENTS.md`):
7. **`docs/STATES.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/STATES.md`):
8. **`docs/PACKAGES.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/PACKAGES.md`):
9. **`docs/SEED_DATA.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/SEED_DATA.md`):
10. **`docs/INFRASTRUCTURE.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/INFRASTRUCTURE.md`):
11. **`docs/TESTING.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/TESTING.md`):
12. **`docs/BACKLOG.md`** (`/Users/bilalbenli/Documents/Projects/demo_projects/wp_to_tg_filter_web_app/docs/BACKLOG.md`):
