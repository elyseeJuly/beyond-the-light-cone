/**
 * tutorialMachine — 教程状态机
 *
 * 抽自原 Tutorial.tsx 的步骤推进与验证逻辑，封装为独立类。
 *
 * 职责：
 *  - 维护当前 step 索引
 *  - 在 step 切换时触发 onStepEnter/onStepExit 回调
 *  - 接收语义事件（SemanticTutorialEvent）并完成对应步骤
 *  - 管理 welcome 步骤的自动过渡定时器（1500ms）
 *  - 管理目标缺失超时恢复（3000ms 后触发 onTargetMissing）
 *  - 提供 subscribe() 让 React 组件响应状态变化
 *
 * 不依赖：
 *  - React 运行时（纯 TS 类，可在单元测试中直接实例化）
 *  - GameInstance（validate 由 React 层调用并 dispatch AUTO_COMPLETE）
 *
 * 这样设计让状态机可独立测试，并避免 React 的 useEffect 重跑导致状态机被重新创建。
 */

import { SemanticTutorialEvent, TutorialStep, WELCOME_AUTO_ADVANCE_MS, TARGET_MISSING_TIMEOUT_MS } from './tutorialSteps';

export interface TutorialMachineCallbacks {
  /** 进入新 step 时触发（用于 dispatch change-active-view、focusStar 等） */
  onStepEnter: (step: TutorialStep, index: number) => void;
  /** 离开当前 step 时触发（用于清理 pulse 等） */
  onStepExit: (step: TutorialStep, index: number) => void;
  /** 教程全部完成（最后一步完成或跳过） */
  onComplete: () => void;
  /** 目标元素连续缺失超过阈值（用于 Toast 提示或自动跳过） */
  onTargetMissing: (step: TutorialStep, index: number) => void;
}

export class TutorialMachine {
  private readonly steps: TutorialStep[];
  private readonly callbacks: TutorialMachineCallbacks;
  private readonly listeners: Set<() => void> = new Set();

  private _index = 0;
  private _completed = false;
  private welcomeTimer: ReturnType<typeof setTimeout> | null = null;
  private targetMissingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(steps: TutorialStep[], callbacks: TutorialMachineCallbacks) {
    this.steps = steps;
    this.callbacks = callbacks;
  }

  /** React 组件 mount 后调用，进入第一步 */
  start(): void {
    this.enterStep();
  }

  private enterStep(): void {
    const step = this.currentStep();
    if (!step) return;

    // WELCOME_TIMEOUT：启动自动过渡定时器（在状态机内部管理，避免 React effect 重跑导致重入）
    if (step.completionEvent === SemanticTutorialEvent.WELCOME_TIMEOUT) {
      this.welcomeTimer = setTimeout(() => {
        this.welcomeTimer = null;
        this.dispatch(SemanticTutorialEvent.WELCOME_TIMEOUT);
      }, WELCOME_AUTO_ADVANCE_MS);
    }

    this.callbacks.onStepEnter(step, this._index);
  }

  /**
   * 标记目标元素缺失（由 React RAF 循环调用）。
   * 连续缺失超过 TARGET_MISSING_TIMEOUT_MS 后触发 onTargetMissing。
   * 一旦 markTargetFound 被调用，计时器重置。
   */
  markTargetMissing(): void {
    const step = this.currentStep();
    if (!step || !step.highlightTarget) return; // 仅对依赖 highlightTarget 的步骤生效
    if (this.targetMissingTimer) return; // 已在计时，避免重复启动
    this.targetMissingTimer = setTimeout(() => {
      this.targetMissingTimer = null;
      this.callbacks.onTargetMissing(step, this._index);
    }, TARGET_MISSING_TIMEOUT_MS);
  }

  /** 标记目标元素已找到，重置缺失计时器 */
  markTargetFound(): void {
    if (this.targetMissingTimer) {
      clearTimeout(this.targetMissingTimer);
      this.targetMissingTimer = null;
    }
  }

  /** 派发语义事件，若匹配当前步骤的 completionEvent 则完成本步 */
  dispatch(event: SemanticTutorialEvent): void {
    const step = this.currentStep();
    if (!step || this._completed) return;
    if (event !== step.completionEvent) return;
    this.completeCurrent();
  }

  private completeCurrent(): void {
    const step = this.currentStep();
    if (!step) return;

    // 清理本步骤的定时器
    if (this.welcomeTimer) { clearTimeout(this.welcomeTimer); this.welcomeTimer = null; }
    if (this.targetMissingTimer) { clearTimeout(this.targetMissingTimer); this.targetMissingTimer = null; }

    this.callbacks.onStepExit(step, this._index);

    if (this._index >= this.steps.length - 1) {
      // 最后一步完成 → 教程结束
      this._completed = true;
      this.listeners.forEach((l) => l());
      this.callbacks.onComplete();
      return;
    }

    this._index += 1;
    this.listeners.forEach((l) => l());
    this.enterStep();
  }

  /** 跳过教程（按钮或 ESC 触发） */
  skip(): void {
    if (this._completed) return;
    if (this.welcomeTimer) { clearTimeout(this.welcomeTimer); this.welcomeTimer = null; }
    if (this.targetMissingTimer) { clearTimeout(this.targetMissingTimer); this.targetMissingTimer = null; }
    const step = this.currentStep();
    if (step) this.callbacks.onStepExit(step, this._index);
    this._completed = true;
    this.listeners.forEach((l) => l());
    this.callbacks.onComplete();
  }

  /** 订阅状态变化（step 切换、完成） */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  currentIndex(): number { return this._index; }
  currentStep(): TutorialStep | null { return this.steps[this._index] ?? null; }
  isComplete(): boolean { return this._completed; }
  totalSteps(): number { return this.steps.length; }

  /** 释放所有定时器与监听器（组件卸载时调用） */
  dispose(): void {
    if (this.welcomeTimer) { clearTimeout(this.welcomeTimer); this.welcomeTimer = null; }
    if (this.targetMissingTimer) { clearTimeout(this.targetMissingTimer); this.targetMissingTimer = null; }
    this.listeners.clear();
  }
}
