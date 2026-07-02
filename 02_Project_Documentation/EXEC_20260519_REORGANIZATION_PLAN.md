# Document Reorganization and Naming Specifications Plan

The objective is to establish a rigorous, clear, and future-proof naming convention for the LegendOfUni project's local documentation (located in `02_Project_Documentation`), rename all existing 31 files to match this system, and generate a standardized guidelines document (`SPEC_20260519_DOCUMENTATION_STANDARDS.md`) so that any future AI or developer taking over can seamlessly adhere to the exact same standards.

All file contents will remain completely untouched.

---

## The Date-Infused Naming Specifications (Category + Date Order)

To ensure high readability and rapid chronological searching, we will name each document using the following structure:
`[CATEGORY_PREFIX]_[YYYYMMDD]_[DOCUMENT_NAME].md`

This allows files to be:
1. Grouped automatically by their functional category first.
2. Ordered chronologically within that category, making development evolution instantly recognizable.

### The Five Category Prefixes:
1. **`SPEC_`** — **Specifications, Technical Requirements, & Design Systems**
2. **`AUDIT_`** — **Reviews, Deep Analyses, & Balance/Optimization Proposals**
3. **`TEST_`** — **Testing Criteria, QA Suites, & Autoplay Standards**
4. **`HIST_`** — **Chronicles, Dev Logs, & Legacy Version Histories**
5. **`EXEC_`** — **Active Execution Artifacts & Directives**

---

## Detailed File Renaming Mapping

Here is the exact mapping of current files to their new name utilizing the modification dates retrieved directly from the filesystem:

### 1. Specifications & Design Systems (`SPEC_`)
| Current Filename | Date | Proposed Standard Filename |
|---|---|---|
| `REBUILD_SPEC_PART1.md` | 20260514 | `SPEC_20260514_REBUILD_PART1.md` |
| `REBUILD_SPEC_PART2.md` | 20260514 | `SPEC_20260514_REBUILD_PART2.md` |
| `ui_art_plan.md` | 20260514 | `ASSET_20260514_UI_ART_PLAN.md` |
| `WEB_MIGRATION_SPEC.md` | 20260514 | `SPEC_20260514_WEB_MIGRATION.md` |
| `叙事心流与UI优化开发指令(V2).md` | 20260514 | `SPEC_20260514_NARRATIVE_FLOW_UI_DIRECTIVES_V2.md` |
| `ART_OVERHAUL_DOCUMENTATION.md` | 20260517 | `SPEC_20260517_ART_OVERHAUL.md` |
| `ITERATION_SPEC_V1.md` | 20260518 | `SPEC_20260518_ITERATION_V1.md` |
| `ENDING_ART_REQUIREMENTS.md` | 20260519 | `ASSET_20260519_ENDING_ART_REQUIREMENTS.md` |
| `GRAND_FINALE_SYSTEM.md` | 20260519 | `SPEC_20260519_GRAND_FINALE_SYSTEM.md` |

### 2. Audits, Analyses & Optimizations (`AUDIT_`)
| Current Filename | Date | Proposed Standard Filename |
|---|---|---|
| `BUGFIX_AUDIT_V2.md` | 20260514 | `AUDIT_20260514_BUGFIX_V2.md` |
| `NARRATIVE_SYSTEM_AUDIT.md` | 20260514 | `AUDIT_20260514_NARRATIVE_SYSTEM.md` |
| `STRATEGY_OPTIMIZATION_REPORT.md` | 20260515 | `AUDIT_20260515_STRATEGY_OPTIMIZATION.md` |
| `GAME_OPTIMIZATION_PLAN.md` | 20260517 | `AUDIT_20260517_GAME_OPTIMIZATION_PLAN.md` |
| `CODE_AUDIT_2026_05_18.md` | 20260518 | `AUDIT_20260518_CODE_QUALITY.md` |
| `STRATEGY_CURVE_ANALYSIS_2026_05_18.md` | 20260518 | `AUDIT_20260518_STRATEGY_CURVE.md` |

### 3. Testing & Autoplay Standards (`TEST_`)
| Current Filename | Date | Proposed Standard Filename |
|---|---|---|
| `HEADLESS_AUTOPLAY_STANDARD.md` | 20260517 | `TEST_20260517_HEADLESS_AUTOPLAY_STANDARD.md` |
| `TEST_CASE_FULL_COVERAGE.md` | 20260517 | `TEST_20260517_CASE_FULL_COVERAGE.md` |
| `TEST_SUITE_FULL_COVERAGE.md` | 20260517 | `TEST_20260517_SUITE_FULL_COVERAGE.md` |
| `TEST_SUPPLEMENT_2026_05_18.md` | 20260518 | `TEST_20260518_SUPPLEMENT_CASES.md` |

### 4. Chronicles & Dev Histories (`HIST_`)
| Current Filename | Date | Proposed Standard Filename |
|---|---|---|
| `DEV_HISTORY_LOG.md` | 20260514 | `HIST_20260514_DEV_LOG.md` |
| `README_HISTORY.md` | 20260514 | `HIST_20260514_README_HISTORY.md` |
| `DEVELOPMENT_DOC_V2.md` | 20260515 | `HIST_20260515_DEVELOPMENT_V2.md` |
| `DEV_HISTORY_V3.md` | 20260517 | `HIST_20260517_DEVELOPMENT_V3.md` |
| `DEV_HISTORY_V4.md` | 20260517 | `HIST_20260517_DEVELOPMENT_V4.md` |
| `DEVELOPMENT_HISTORY.md` | 20260518 | `HIST_20260518_DEVELOPMENT_MAIN.md` |
| `DEV_HISTORY_V5.md` | 20260518 | `HIST_20260518_DEVELOPMENT_V5.md` |
| `DEV_HISTORY_V6.md` | 20260518 | `HIST_20260518_DEVELOPMENT_V6.md` |

### 5. Active Execution Artifacts (`EXEC_`)
| Current Filename | Date | Proposed Standard Filename |
|---|---|---|
| `implementation_plan.md` | 20260514 | `EXEC_20260514_IMPLEMENTATION_PLAN.md` |
| `task.md` | 20260514 | `EXEC_20260514_TASK.md` |
| `walkthrough.md` | 20260514 | `EXEC_20260514_WALKTHROUGH.md` |
| `WALKTHROUGH_FINAL.md` | 20260514 | `EXEC_20260514_WALKTHROUGH_FINAL.md` |

---

## Documenting the Standard: `SPEC_20260519_DOCUMENTATION_STANDARDS.md`

We will write a new Markdown file `02_Project_Documentation/SPEC_20260519_DOCUMENTATION_STANDARDS.md` which will serve as the authoritative standard for this project.

---

## Verification Plan

1. **Renaming Verification**: Check filesystem to ensure all files exist with their new date-infused names.
2. **Content Verification**: Spot-check original files and renamed files to confirm content is 100% untouched.
