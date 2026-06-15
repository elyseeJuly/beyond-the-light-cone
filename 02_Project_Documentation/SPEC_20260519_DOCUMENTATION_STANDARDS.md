# LegendOfUni Documentation Standard & Naming Specification
> **Establishment Date**: 2026-05-19  
> **Authoritative Version**: V1.0  
> **Target Directory**: `02_Project_Documentation/`  

---

## 📖 1. Overview & Purpose

As projects grow in complexity, keeping documentation organized is vital for rapid searching, context retrieval, and seamless AI handoffs. This document defines the **Date-Infused 5-Prefix Category System** for the *LegendOfUni* project. 

By enforcing this standard, all documentation files will automatically sort by their functional category first, and then chronologically by their modification/creation date. This makes it instantly clear how requirements, specifications, audits, and plans have evolved over the project's life.

> [!IMPORTANT]
> **AI Instruction / AI 接手指令:**
> Any AI taking over this codebase or contributing new documentation **MUST** strictly adhere to this naming standard. When creating a new document, you must determine its functional category, find or assign its date, and use the exact prefix syntax defined below.

---

## 🛠️ 2. The Naming Standard Formula

Every documentation file in `02_Project_Documentation/` must be named exactly as:

$$\Large \texttt{[CATEGORY\_PREFIX]\_[YYYYMMDD]\_[DOCUMENT\_NAME].md}$$

- **`[CATEGORY_PREFIX]`**: One of the five uppercase category identifiers (see below).
- **`[YYYYMMDD]`**: The date of document generation or last primary modification.
- **`[DOCUMENT_NAME]`**: A brief, concise, capitalized name using underscores `_` instead of spaces.

---

## 🏷️ 3. The Five Category Prefixes

| Category Prefix | Title / Nature | Primary Contents |
| :--- | :--- | :--- |
| **`SPEC_`** | **Specifications & Design Systems** | Core architectural designs, React/TS UI directives, art requirement specifications, migration plans. |
| **`AUDIT_`** | **Audits, Analyses & Reports** | Code review logs, narrative pacing curves, strategy balancing reports, game optimization plans. |
| **`TEST_`** | **Testing Standards & Cases** | Playtesting guidelines, headless autoplay framework standards, full coverage test cases. |
| **`HIST_`** | **Dev History & Chronicles** | Consolidation of developmental iterations, readme chronologies, legacy logs. |
| **`EXEC_`** | **Active Execution Artifacts** | Active session checklists, implementation plans, daily walkthroughs. |

---

## 🗃️ 4. Full Organized File Inventory

Below is the complete inventory of the files organized under the new standard:

### 4.1 Specifications & Design Systems (`SPEC_`)
Documents defining features, architectures, and design directives.
*   [SPEC_20260514_NARRATIVE_FLOW_UI_DIRECTIVES_V2.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260514_NARRATIVE_FLOW_UI_DIRECTIVES_V2.md) — *AI directives for React UI presentation layer*
*   [SPEC_20260514_REBUILD_PART1.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260514_REBUILD_PART1.md) — *Rebuild specification, Part 1*
*   [SPEC_20260514_REBUILD_PART2.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260514_REBUILD_PART2.md) — *Rebuild specification, Part 2*
*   [SPEC_20260514_UI_ART_PLAN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260514_UI_ART_PLAN.md) — *Design plan for UI art assets*
*   [SPEC_20260514_WEB_MIGRATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260514_WEB_MIGRATION.md) — *Web reconstruction and migration roadmap*
*   [SPEC_20260517_ART_OVERHAUL.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260517_ART_OVERHAUL.md) — *Art overhaul guidelines*
*   [SPEC_20260518_ITERATION_V1.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260518_ITERATION_V1.md) — *Rebuild V1 iteration spec*
*   [SPEC_20260519_ENDING_ART_REQUIREMENTS.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260519_ENDING_ART_REQUIREMENTS.md) — *Cinematic end-game art requirements*
*   [SPEC_20260519_GRAND_FINALE_SYSTEM.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260519_GRAND_FINALE_SYSTEM.md) — *Grand finale ending cinematic engine specifications*
*   [SPEC_20260519_DOCUMENTATION_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260519_DOCUMENTATION_STANDARDS.md) — ***[THIS FILE] Naming conventions & standards***
*   [SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260520_GLOBAL_DEVELOPMENT_STANDARDS.md) — *Global development, archiving, & naming specification rules*
*   [SPEC_20260603_REVISED_ITERATION_PLAN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260603_REVISED_ITERATION_PLAN.md) — *Revised iteration development roadmap, AI prompts, and human director operation guidelines*
*   [SPEC_20260608_SUPPLEMENTARY_CG_PROMPTS_SPEC.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260608_SUPPLEMENTARY_CG_PROMPTS_SPEC.md) — *Midjourney generation prompts and naming requirements spec for supplementary CGs*
*   [SPEC_20260612_UNIVERSAL_EVENT_ENGINE_V1.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260612_UNIVERSAL_EVENT_ENGINE_V1.md) — *Universal Event Engine (UEE v1.0) architecture and dynamic generation rules*
*   [SPEC_20260612_COMPREHENSIVE_ARCHITECTURE_REFACTORING.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260612_COMPREHENSIVE_ARCHITECTURE_REFACTORING.md) — *Comprehensive architecture refactoring specification blueprints*
*   [SPEC_20260615_EPOCH_CHRONICLES_OST.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260615_EPOCH_CHRONICLES_OST.md) — *Beyond the Light Cone: Epoch Chronicles OST specifications planning book*

### 4.2 Audits & Analyses (`AUDIT_`)
Diagnostic reviews and balance reports.
*   [AUDIT_20260512_BUGFIXES.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260512_BUGFIXES.md) — *Legacy audit of game bugs and numerical limits*
*   [AUDIT_20260514_BUGFIX_V2.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260514_BUGFIX_V2.md) — *Audit of game bugs and numerical limits*
*   [AUDIT_20260514_NARRATIVE_SYSTEM.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260514_NARRATIVE_SYSTEM.md) — *Narrative pacing and choice balance review*
*   [AUDIT_20260515_STRATEGY_OPTIMIZATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260515_STRATEGY_OPTIMIZATION.md) — *Strategy curve pacing reports*
*   [AUDIT_20260517_GAME_OPTIMIZATION_PLAN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260517_GAME_OPTIMIZATION_PLAN.md) — *10-turn Autoplay data + multi-level optimization plan*
*   [AUDIT_20260518_CODE_QUALITY.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260518_CODE_QUALITY.md) — *Static code analysis*
*   [AUDIT_20260518_STRATEGY_CURVE.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260518_STRATEGY_CURVE.md) — *Difficulty and strategy curve analysis*
*   [AUDIT_20260519_CODE_AUDIT_REPORT.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260519_CODE_AUDIT_REPORT.md) — *Vitest code audit and optimization report*
*   [AUDIT_20260519_OPTIMIZATION_NOTES.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260519_OPTIMIZATION_NOTES.md) — *Core engine optimization notes*
*   [AUDIT_20260520_RANDOM_EVENTS_CANON_ANALYSIS.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260520_RANDOM_EVENTS_CANON_ANALYSIS.md) — *Canonical analysis of pure random events and infinite triggers audit*
*   [AUDIT_20260525_FULL_NARRATIVE_PHYSICS_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260525_FULL_NARRATIVE_PHYSICS_AUDIT.md) — *Full narrative/physics/balance deep audit with optimization proposals for AI handoff*
*   [AUDIT_20260603_GODOT_MIGRATION_FEASIBILITY.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260603_GODOT_MIGRATION_FEASIBILITY.md) — *Feasibility analysis and evaluation on Godot transplantation vs. Web rebuild roadmap*
*   [AUDIT_20260605_ART_ASSETS_STYLE_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260605_ART_ASSETS_STYLE_AUDIT.md) — *Style consistency audit and reconstruction proposals of non-CG art assets*
*   [AUDIT_20260605_CG_LOSS_ANALYSIS.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260605_CG_LOSS_ANALYSIS.md) — *CG graphic loss and name mismatch core root cause analysis report*
*   [AUDIT_20260605_REVISED_ITERATION_STATUS.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260605_REVISED_ITERATION_STATUS.md) — *Implementation progress audit of the new iteration plan*
*   [AUDIT_20260608_EVENT_TIMELINE_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260608_EVENT_TIMELINE_AUDIT.md) — *Narrative pacing, event structure, dynamic triggers, and character lifetimes audit*

### 4.3 Testing Standards & Coverage (`TEST_`)
Standards and definitions of tests.
*   [TEST_20260517_CASE_FULL_COVERAGE.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/TEST_20260517_CASE_FULL_COVERAGE.md) — *Full coverage test case scenarios*
*   [TEST_20260517_HEADLESS_AUTOPLAY_STANDARD.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/TEST_20260517_HEADLESS_AUTOPLAY_STANDARD.md) — *Autoplay headless bot simulation instructions*
*   [TEST_20260517_SUITE_FULL_COVERAGE.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/TEST_20260517_SUITE_FULL_COVERAGE.md) — *Full coverage test suite harness*
*   [TEST_20260518_SUPPLEMENT_CASES.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/TEST_20260518_SUPPLEMENT_CASES.md) — *Supplementary playtest cases*
*   [TEST_20260519_VITEST_REPORT.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/TEST_20260519_VITEST_REPORT.md) — *Vitest and @testing-library report with suggestions*
*   [TEST_20260520_FRAMEWORK_ANALYSIS.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/TEST_20260520_FRAMEWORK_ANALYSIS.md) — *Vitest vs alternative testing frameworks analysis report*

### 4.4 Development Histories & Chronicles (`HIST_`)
Archived logs and historical progression tracking.
*   [HIST_20260514_DEV_LOG.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260514_DEV_LOG.md) — *Consolidated development/git logs*
*   [HIST_20260514_NARRATIVE_SYSTEM_M8.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260514_NARRATIVE_SYSTEM_M8.md) — *Narrative engine special development history (Stage M8)*
*   [HIST_20260514_README_HISTORY.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260514_README_HISTORY.md) — *README.md modification history*
*   [HIST_20260515_DEVELOPMENT_V2.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260515_DEVELOPMENT_V2.md) — *Development log V2*
*   [HIST_20260517_DEVELOPMENT_V3.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260517_DEVELOPMENT_V3.md) — *Development log V3*
*   [HIST_20260517_DEVELOPMENT_V4.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260517_DEVELOPMENT_V4.md) — *Development log V4*
*   [HIST_20260518_DEVELOPMENT_MAIN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260518_DEVELOPMENT_MAIN.md) — *Master chronological dev history*
*   [HIST_20260518_DEVELOPMENT_V5.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260518_DEVELOPMENT_V5.md) — *Development log V5*
*   [HIST_20260518_DEVELOPMENT_V6.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260518_DEVELOPMENT_V6.md) — *Development log V6*
*   [HIST_20260519_DEVELOPMENT_LOG_M0_M9.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260519_DEVELOPMENT_LOG_M0_M9.md) — *Web Rebuild full dev chronologies M0-M9*
*   [HIST_20260520_DEVELOPMENT_V7.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260520_DEVELOPMENT_V7.md) — *Development log V7*
*   [HIST_20260525_ART_UI_UNIFICATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/HIST_20260525_ART_UI_UNIFICATION.md) — *Archived dev history of characters Gongbi Cyberpunk style and letterbox UI*
*   [HIST_20260615_UI_REBUILD_DIALOGUE.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/HIST_20260615_UI_REBUILD_DIALOGUE.md) — *Dialogue and decision chronicles of the UI/UX refactoring*

### 4.5 Active Execution & Tasks (`EXEC_`)
Active development logs, blueprints, and task runners.
*   [EXEC_20260514_IMPLEMENTATION_PLAN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260514_IMPLEMENTATION_PLAN.md) — *Workspace development blueprint*
*   [EXEC_20260514_TASK.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260514_TASK.md) — *Active task/checklist log*
*   [EXEC_20260514_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260514_WALKTHROUGH.md) — *Walkthrough for daily verification*
*   [EXEC_20260514_WALKTHROUGH_FINAL.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260514_WALKTHROUGH_FINAL.md) — *Walkthrough for grand finale and event audits*
*   [EXEC_20260519_AUDIT_OPTIMIZATION_ITERATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260519_AUDIT_OPTIMIZATION_ITERATION.md) — *Audit optimization first phase execution plan*
*   [EXEC_20260519_AUDIT_OPTIMIZATION_ITERATION_v2.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260519_AUDIT_OPTIMIZATION_ITERATION_v2.md) — *Audit optimization second phase execution plan*
*   [EXEC_20260519_REORGANIZATION_PLAN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260519_REORGANIZATION_PLAN.md) — *Documentation naming reorganization execution plan*
*   [EXEC_20260519_REORGANIZATION_TASK.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260519_REORGANIZATION_TASK.md) — *Documentation naming reorganization task checklist*
*   [EXEC_20260519_REORGANIZATION_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260519_REORGANIZATION_WALKTHROUGH.md) — *Documentation naming reorganization walkthrough*
*   [EXEC_20260520_EVENT_SYSTEM_OVERHAUL_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260520_EVENT_SYSTEM_OVERHAUL_WALKTHROUGH.md) — *Walkthrough for event system and Liu Cixin narrative integration*
*   [EXEC_20260520_TACTICAL_BULLETIN_BOARD_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260520_TACTICAL_BULLETIN_BOARD_WALKTHROUGH.md) — *Walkthrough for vertical strategic bulletin board implementation*
*   [EXEC_20260525_FIX_AUDIT_PLAN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260525_FIX_AUDIT_PLAN.md) — *Execution plan for fixing narrative, numerical balance, and star map physics issues*
*   [EXEC_20260525_FIX_AUDIT_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260525_FIX_AUDIT_WALKTHROUGH.md) — *Walkthrough of the implemented narrative, physics, and UI/UX corrections*
*   [EXEC_20260525_NARRATIVE_FLOW_REMEDIATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260525_NARRATIVE_FLOW_REMEDIATION.md) — *Remediation log of narrative pacing and event node blocking*
*   [EXEC_20260526_FLEET_MANAGEMENT_OVERHAUL.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260526_FLEET_MANAGEMENT_OVERHAUL.md) — *Fleet management panel and movement visualization overhaul walkthrough*
*   [EXEC_20260602_DEEP_AUDIT_FIXES.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260602_DEEP_AUDIT_FIXES.md) — *Remediation walkthrough of deep code gaps and testing enhancements*
*   [EXEC_20260602_NARRATIVE_ART_REMEDIATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260602_NARRATIVE_ART_REMEDIATION.md) — *Remediation of main narrative images into white background white brush strokes*
*   [EXEC_20260602_REMEDIATION_REPORT.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260602_REMEDIATION_REPORT.md) — *Remediation summary report on narrative art, engine pacing, and UI layouts*
*   [EXEC_20260603_CI_BUGFIX_AND_UI_OPTIMIZATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260603_CI_BUGFIX_AND_UI_OPTIMIZATION.md) — *CI pipeline compiling fixes, coverage elevation, and double bracket normalization walkthrough*
*   [EXEC_20260605_ART_ASSETS_AND_EVENT_FIXES.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260605_ART_ASSETS_AND_EVENT_FIXES.md) — *Execution walkthrough of restoring missing CG assets and event references*
*   [EXEC_20260605_ITERATION_STAGES_ABC_REPORT.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260605_ITERATION_STAGES_ABC_REPORT.md) — *Audit report summarizing development phases A, B, and C completion*
*   [EXEC_20260605_TIME_SYNCHRONIZATION_AND_SUBTITLE_REBUILD.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260605_TIME_SYNCHRONIZATION_AND_SUBTITLE_REBUILD.md) — *Walkthrough of time synchronization logic and subtitle rendering rebuild*
*   [EXEC_20260608_EVENT_AUDIT_IMPLEMENTATION_PLAN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260608_EVENT_AUDIT_IMPLEMENTATION_PLAN.md) — *Implementation plan for auditing and overhauling events and timeline*
*   [EXEC_20260608_EVENT_AUDIT_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260608_EVENT_AUDIT_WALKTHROUGH.md) — *Walkthrough of the completed event/timeline refactoring and verification*
*   [EXEC_20260612_APPENDIX_B_IMPLEMENTATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260612_APPENDIX_B_IMPLEMENTATION.md) — *Appendix B missing items implementation execution report*
*   [EXEC_20260612_ARCHITECTURE_REFACTORING_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260612_ARCHITECTURE_REFACTORING_WALKTHROUGH.md) — *Complete UEE system architecture refactoring execution report*
*   [EXEC_20260612_CG_ASSETS_UPDATE.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260612_CG_ASSETS_UPDATE.md) — *Gongbi Cyberpunk 21:9 story CG updates and ending page particle UI execution report*
*   [EXEC_20260612_NPC_STYLE_UNIFICATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260612_NPC_STYLE_UNIFICATION.md) — *General NPC portrait updates and redundant asset cleaning report*
*   [EXEC_20260612_CRITICAL_ISSUES_IMPLEMENTATION_PLAN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260612_CRITICAL_ISSUES_IMPLEMENTATION_PLAN.md) — *Critical issues implementation plan addressing six user-reported problems*
*   [EXEC_20260612_CRITICAL_ISSUES_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260612_CRITICAL_ISSUES_WALKTHROUGH.md) — *Walkthrough of the six critical issues resolution and test verification*
*   [EXEC_20260615_CHARACTER_ART_REMEDIATION_V2.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260615_CHARACTER_ART_REMEDIATION_V2.md) — *Second character art audit and remediation execution report fixing AIAA, Tyler, Ding Yi, and Guan Yifan*
*   [EXEC_20260615_AVATAR_FALLBACK_AND_THEME_REMEDIATION.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260615_AVATAR_FALLBACK_AND_THEME_REMEDIATION.md) — *Execution report on resolving avatar fallbacks, Sophon portrait, light theme default, and dark theme softening*
*   [EXEC_20260615_MUSIC_INTEGRATION_PLAN.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260615_MUSIC_INTEGRATION_PLAN.md) — *Execution plan for renaming music assets and pre-configuring BGM slots in code*
*   [EXEC_20260615_MUSIC_INTEGRATION_TASK.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260615_MUSIC_INTEGRATION_TASK.md) — *Task checklist for music assets renaming and BGM slots integration*
*   [EXEC_20260615_MUSIC_INTEGRATION_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/EXEC_20260615_MUSIC_INTEGRATION_WALKTHROUGH.md) — *Walkthrough report with file integration specifications and tests verification*
*   [EXEC_20260615_STARMAP_AND_SETTINGS_REBUILD_PLAN.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260615_STARMAP_AND_SETTINGS_REBUILD_PLAN.md) — *Execution plan for star map viewport reconstruction and settings integration*
*   [EXEC_20260615_STARMAP_AND_SETTINGS_REBUILD_WALKTHROUGH.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260615_STARMAP_AND_SETTINGS_REBUILD_WALKTHROUGH.md) — *Walkthrough of the completed star map viewports, settings modal, and modals styling unification*

---

## 📈 5. Guide for Creating New Documents

When a developer or AI needs to generate a new document in the folder, follow this lifecycle:

1. **Classify**: Determine which of the five prefixes fits the content best.
2. **Date Stamp**: Use the current system date in `YYYYMMDD` format.
3. **Draft the Filename**: e.g. `AUDIT_20260519_NEW_FEATURE_AUDIT.md`.
4. **Header Integration**: Always start the document with a concise header section detailing the topic, date, and author/system.
5. **Reference Updating**: Insert the new file into the inventory section of `SPEC_20260519_DOCUMENTATION_STANDARDS.md` under its corresponding category to keep the master directory synchronized.

---

> [!TIP]
> Keeping file naming consistent ensures a pleasant development flow, instant readability, and high cognitive speed. Let's maintain this discipline throughout the lifespan of the *LegendOfUni* project!
