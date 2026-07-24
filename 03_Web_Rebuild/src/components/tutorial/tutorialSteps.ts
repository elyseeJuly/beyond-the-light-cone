/**
 * tutorialSteps — 教程步骤配置模块
 *
 * 抽自原 Tutorial.tsx 的 buildSteps()，新增：
 *  - SemanticTutorialEvent 枚举：替代字符串 stepId 分支，描述步骤完成的语义触发源
 *  - step.completionEvent：声明每个步骤由哪个语义事件完成
 *  - step.validate：可选的即时校验函数，进入步骤时若返回 true 则直接完成（如玩家已有采矿场）
 *
 * 设计原则：纯数据 + 描述性，不包含运行时副作用或 React 逻辑。
 */

import type { ActiveViewType } from '../LeftHub';
import type { Game } from '../../core/Game';
import { STAR_INDEX } from '../../config/starIndices';
import { t } from '../../utils/i18n';

export interface TutorialStep {
  /** 步骤 ID（保留用于进度显示"步骤 N/M"与单元测试断言） */
  id: string;
  title: string;
  description: string;
  highlightTarget?: string;
  activeView: ActiveViewType;
  inspectorTab?: 'overview' | 'build' | 'fleet' | 'history';
  cardPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center';
  /** 是否为教程聚焦星（启用 StarMapRenderer.pulse + 强制居中） */
  focusStar?: number;
  /** 自定义高亮框尺寸（覆盖默认 110px），用于不规则命中区 */
  highlightSize?: number;
  /** 是否允许"宽容点击"：高亮框内任意点击都算完成本步（不依赖真实命中） */
  forgivingClick?: boolean;
  /** 是否需要手动点击「下一步」推进（纯阅读或阶段谢幕步骤） */
  requiresManualAdvance?: boolean;
  /** 资源/AP 成本提示文案（如"消耗 30 经济"、"消耗 10 AP"），显示在描述下方 */
  costHint?: string;
  /** 此步骤由哪个语义事件完成 */
  completionEvent: SemanticTutorialEvent;
  /** 可选：进入步骤时若返回 true，立即完成（用于已满足条件时跳过） */
  validate?: (game: Game) => boolean;
}

/**
 * 教程步骤完成的语义事件类型。
 *
 * 替代原代码中以 stepId 字符串分支判断步骤完成条件的做法：
 *   - 旧：if (stepId === 'next-turn') window.addEventListener('game-turn-complete', ...)
 *   - 新：if (step.completionEvent === SemanticTutorialEvent.TURN_COMPLETE) addEventListener(...)
 *
 * 新增 TARGET_MISSING 用于目标缺失超时自动恢复。
 */
export enum SemanticTutorialEvent {
  /** welcome 步骤的 1.5s 自动过渡 */
  WELCOME_TIMEOUT = 'welcome_timeout',
  /** requiresManualAdvance 步骤的「下一步」按钮点击 */
  MANUAL_ADVANCE = 'manual_advance',
  /** click-earth 步骤：地球被选中（监听 star-selected 事件） */
  EARTH_SELECTED = 'earth_selected',
  /** build-stope / resource-production / start-research：即时检查条件满足 */
  AUTO_COMPLETE = 'auto_complete',
  /** next-turn 步骤：回合结算完成（监听 game-turn-complete 事件） */
  TURN_COMPLETE = 'turn_complete',
  /** resolve-event 步骤：StoryModal 关闭（监听 game-event-resolved 事件） */
  EVENT_RESOLVED = 'event_resolved',
  /** tutorial-end 步骤：手动点击「完成校准」按钮 */
  FINISH = 'finish',
  /** 目标元素缺失超过阈值（自动恢复机制） */
  TARGET_MISSING = 'target_missing',
}

/** 欢迎页自动过渡时长（毫秒） */
export const WELCOME_AUTO_ADVANCE_MS = 1500;

/** 目标缺失自动恢复阈值（毫秒）。连续缺失超过此时长则派发 TARGET_MISSING 事件。 */
export const TARGET_MISSING_TIMEOUT_MS = 3000;

/**
 * 重设计后的新手教程：9 步（欢迎、核心操作与智脑校准收尾）。
 * 核心修复：
 *  - 步骤 1 启动时自动将地球居中并放大（focusOnStar），杜绝"找不到地球"
 *  - 步骤 1 高亮框扩大到 110×110px，覆盖 StarMapRenderer 60px 实际命中区
 *  - 步骤 1 启用 forgivingClick + StarMapRenderer pulse 环，引导玩家视线
 *  - 用单一可点击 hotspot 替换 4 块分块遮罩，消除接缝漏点
 *  - 增加欢迎页（1.5s 自动过渡或点击"开始"），给玩家仪式感与思考空间
 *
 * @param hasStope 是否已建好采矿场（决定 build-stope 步骤的引导文案与高亮目标）
 * @param initialMiningRatio 教程启动时的初始采矿比例（用于 resource-production 步骤的 validate）。
 *   传入 NaN 表示"不自动完成"（仅用于 TUTORIAL_STEPS 静态导出）。
 */
export function buildSteps(hasStope: boolean, initialMiningRatio: number = NaN): TutorialStep[] {
  return [
    {
      id: 'welcome',
      title: t('智脑辅助校准'),
      description: t('公元 2009 年，三体舰队启航。智脑战略系统初始化完成，即将开始校准。'),
      activeView: 'starmap',
      cardPosition: 'center',
      requiresManualAdvance: true,
      completionEvent: SemanticTutorialEvent.MANUAL_ADVANCE,
    },
    {
      id: 'click-earth',
      title: t('选中家园星系'),
      description: t('已为您自动定位并选中地球坐标。这是我们在这片暗黑森林中唯一的基石。'),
      highlightTarget: 'earth-star',
      highlightSize: 110,
      forgivingClick: true,
      activeView: 'starmap',
      cardPosition: 'left',
      focusStar: STAR_INDEX.EARTH,
      requiresManualAdvance: true,
      completionEvent: SemanticTutorialEvent.MANUAL_ADVANCE,
    },
    {
      id: 'read-status',
      title: t('监控三维产出'),
      description: t('查看右侧面板。矿产维持工业、经济驱动发展、文化决定科研速率。'),
      highlightTarget: 'right-inspector',
      activeView: 'starmap',
      inspectorTab: 'overview',
      cardPosition: 'left',
      requiresManualAdvance: true,
      completionEvent: SemanticTutorialEvent.MANUAL_ADVANCE,
    },
    {
      id: 'build-stope',
      title: t('建设矿业基础'),
      description: hasStope
        ? t('检查建好的采矿场。工业与太空防线的建立离不开资源供应。')
        : t('切换至建造面板，在地球轨道新建一座采矿场，奠定工业基础。'),
      costHint: hasStope ? undefined : t('消耗 30 经济 · 预估 5 回合完工'),
      highlightTarget: hasStope ? 'right-inspector' : 'btn-build-stope',
      activeView: 'starmap',
      inspectorTab: hasStope ? 'overview' : 'build',
      cardPosition: 'left',
      requiresManualAdvance: true,
      completionEvent: SemanticTutorialEvent.MANUAL_ADVANCE,
      validate: (game) => {
        const star = game.starManager.getStar(STAR_INDEX.EARTH);
        return !!star?.hasStope || !!star?.buildingProgress?.stope;
      },
    },
    {
      id: 'resource-production',
      title: t('调配劳力分配'),
      description: t('拖动采矿比例滑块。劳动资源有限，需根据战略重心合理取舍。'),
      costHint: t('每次调整消耗 10 AP'),
      highlightTarget: 'mining-ratio-section',
      activeView: 'starmap',
      inspectorTab: 'overview',
      cardPosition: 'left',
      requiresManualAdvance: true,
      completionEvent: SemanticTutorialEvent.MANUAL_ADVANCE,
      validate: (game) => game.earthCivi.miningRatio !== initialMiningRatio,
    },
    {
      id: 'start-research',
      title: t('启动科技演进'),
      description: t('进入科技树面板，点击选择「天文观测」节点启动首项研究。'),
      costHint: t('启动或切换研究消耗 20 AP'),
      highlightTarget: 'tech-node-天文观测',
      activeView: 'techtree',
      cardPosition: 'right',
      requiresManualAdvance: true,
      completionEvent: SemanticTutorialEvent.MANUAL_ADVANCE,
      validate: (game) => {
        for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
          for (const node of tree.nodes.values()) {
            if (node.inResearch && !node.finished) return true;
          }
        }
        return false;
      },
    },
    {
      id: 'next-turn',
      title: '执行首回合决策',
      description: '点击「下一回合」。时间将向前推移，智脑将演算各部门运转效果。',
      highlightTarget: 'btn-next-turn',
      activeView: 'starmap',
      cardPosition: 'bottom',
      completionEvent: SemanticTutorialEvent.TURN_COMPLETE,
    },
    {
      id: 'resolve-event',
      title: '应对突发危机',
      description: '智脑推演到危机事件。每一个抉择都将深刻书写文明的生存命运。',
      activeView: 'starmap',
      cardPosition: 'center',
      requiresManualAdvance: true,
      completionEvent: SemanticTutorialEvent.MANUAL_ADVANCE,
    },
    {
      id: 'tutorial-end',
      title: '智脑校准完毕',
      description: '校准完成！局势目标面板与智脑战术顾问已解锁，愿文明薪火永存。',
      activeView: 'starmap',
      cardPosition: 'center',
      requiresManualAdvance: true,
      completionEvent: SemanticTutorialEvent.FINISH,
    },
  ];
}

/** 保留导出以兼容旧测试引用，默认走"无采矿场"路径 */
export const TUTORIAL_STEPS: TutorialStep[] = buildSteps(false);
