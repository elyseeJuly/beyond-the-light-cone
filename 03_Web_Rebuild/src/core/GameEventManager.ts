import { GameEvent, createGameEvent } from "./GameEvent";
import eventsData from "../data/events.json";
import randomEventsData from "../data/randomevents.json";
import { DialogNode, FilteredEventPayload } from "../types/narrative";
import { GameInstance } from "./Game";
import { getImageUrl } from "../utils/assetUrl";
import { normalizeEventMeta, pickWeightedEvent, isEventEligible } from "./EventCadence";
import { EventLane } from "../types/enums";

export class GameEventManager {
  public events: GameEvent[] = [];
  public randomEvents: GameEvent[] = [];
  public filteredEvents: FilteredEventPayload[] = [];
  public triggeredFilteredIds: Set<string> = new Set();

  public lastAnyEventYear: number = 0;
  public lastLaneTriggeredYear: Map<EventLane, number> = new Map();
  public randomEventTriggerCounts: Map<string, number> = new Map();
  public lastTagTriggeredYear: Map<string, number> = new Map();

  constructor() {
    this.init();
  }

  public formatAvatarUrl(bmpName: string, speakerName?: string): string {
    return this.mapAvatar(bmpName, speakerName);
  }

  private mapAvatar(bmpName: string, speakerName?: string): string {
    // 1. If bmpName represents a CG image, resolve it first
    if (bmpName) {
      const lowerBmp = bmpName.toLowerCase();
      if (lowerBmp.includes("event_") || lowerBmp.includes("cg_")) {
        let name = lowerBmp.replace(/^\/?images\//, "").replace("character_", "").replace("unified_", "");
        name = name.replace(".png", "").replace(".bmp", "");
        
        if (name.startsWith("event_crisis_start")) return getImageUrl("cg_crisis_start.png");
        if (name.startsWith("event_guzheng")) return getImageUrl("cg_guzheng.png");
        if (name.startsWith("event_moon_crisis")) return getImageUrl("cg_moon_crisis.png");
        if (name.startsWith("event_wandering_earth")) return getImageUrl("cg_wandering_earth.png");
        if (name.startsWith("event_dimensional_strike") || name === "dimensional_threat_alert") return getImageUrl("cg_dimensional_strike.png");
        if (name.startsWith("event_droplet_attack")) return getImageUrl("cg_doomsday_battle.png");
        if (name.startsWith("event_deterrence_established")) return getImageUrl("cg_deterrence_established.png");
        if (name.startsWith("event_deterrence_broken")) return getImageUrl("cg_deterrence_broken.png");
        if (name.startsWith("event_gravitational_broadcast")) return getImageUrl("cg_gravitational_broadcast.png");
        if (name.startsWith("event_bunker_world")) return getImageUrl("cg_bunker_world.png");
        if (name.startsWith("event_galaxy_era")) return getImageUrl("cg_galaxy_era.png");
        if (name.startsWith("event_stardust_era")) return getImageUrl("cg_stardust_era.png");
        if (name.startsWith("event_red_shore_base")) return getImageUrl("cg_red_shore_base.png");
        if (name.startsWith("event_yewenjie_signal")) return getImageUrl("cg_yewenjie_signal.png");
        if (name.startsWith("event_trisolaris_reply")) return getImageUrl("cg_trisolaris_reply.png");
        if (name.startsWith("event_eto_founded")) return getImageUrl("cg_eto_founded.png");
        if (name.startsWith("event_yangdong_suicide")) return getImageUrl("cg_yangdong_suicide.png");
        if (name.startsWith("event_ghost_countdown")) return getImageUrl("cg_ghost_countdown.png");
        if (name.startsWith("event_beihai_assassination")) return getImageUrl("cg_beihai_assassination.png");
        if (name.startsWith("event_thought_seal")) return getImageUrl("cg_thought_seal.png");
        if (name.startsWith("event_great_ravine_ended")) return getImageUrl("cg_great_ravine_ended.png");
        if (name.startsWith("event_great_ravine")) return getImageUrl("cg_great_ravine.png");
        if (name.startsWith("event_tech_explosion")) return getImageUrl("cg_tech_explosion.png");
        if (name.startsWith("event_dark_battle")) return getImageUrl("cg_dark_battle.png");
        if (name.startsWith("event_tech_exchange")) return getImageUrl("cg_tech_exchange.png");
        if (name.startsWith("event_australia_migration")) return getImageUrl("cg_australia_migration.png");
        if (name.startsWith("event_trisolaris_destroyed")) return getImageUrl("cg_trisolaris_destroyed.png");
        if (name.startsWith("event_trisolaris_fleet_escaped")) return getImageUrl("cg_trisolaris_fleet_escaped.png");
        if (name.startsWith("event_wade_coup")) return getImageUrl("cg_wade_coup.png");
        if (name.startsWith("event_wade_executed")) return getImageUrl("cg_wade_executed.png");
        if (name.startsWith("event_pluto_museum")) return getImageUrl("cg_pluto_museum.png");
        if (name.startsWith("event_solar_system_flattened")) return getImageUrl("cg_solar_system_flattened.png");
        if (name.startsWith("event_swordholder_handover")) return getImageUrl("cg_swordholder_handover.png");

        const fileName = bmpName.replace(/^\/?images\//, "");
        return getImageUrl(fileName);
      }
    }

    // 2. Intercept speakerName for all 36 major characters to prevent default mechanical head fallbacks
    if (speakerName) {
      const lowerSpeaker = speakerName.toLowerCase();
      if (lowerSpeaker.includes("丁仪")) return getImageUrl("unified_dingyi_1779691512032.png");
      if (lowerSpeaker.includes("智子")) return getImageUrl("unified_sophon_1778921509458.png");
      if (lowerSpeaker.includes("艾aa") || lowerSpeaker.includes("aa")) return getImageUrl("unified_aiaa_1779691888124.png");
      if (lowerSpeaker.includes("罗辑")) return getImageUrl("unified_luoji_1778921262534.png");
      if (lowerSpeaker.includes("大史") || lowerSpeaker.includes("史强")) return getImageUrl("unified_dashi_1778921331273.png");
      if (lowerSpeaker.includes("章北海")) return getImageUrl("unified_beihai_1778921366897.png");
      if (lowerSpeaker.includes("程心")) return getImageUrl("unified_chengxin_1778921400346.png");
      if (lowerSpeaker.includes("叶文洁")) return getImageUrl("unified_yewenjie_1778921299091.png");
      if (lowerSpeaker.includes("维德")) return getImageUrl("unified_wade_1778921437022.png");
      if (lowerSpeaker.includes("云天明")) return getImageUrl("unified_tianming_1778921470963.png");
      if (lowerSpeaker.includes("汪淼")) return getImageUrl("unified_wangmiao_1779691527760.png");
      if (lowerSpeaker.includes("希恩斯")) return getImageUrl("unified_hines_1779691718751.png");
      if (lowerSpeaker.includes("雷迪亚兹")) return getImageUrl("unified_reydiaz_1779691732536.png");
      if (lowerSpeaker.includes("泰勒")) return getImageUrl("unified_tyler_1779691745991.png");
      if (lowerSpeaker.includes("关一帆")) return getImageUrl("unified_guanyifan_1779691901857.png");
      if (lowerSpeaker.includes("林云")) return getImageUrl("unified_linyun_1779691542667.png");
      if (lowerSpeaker.includes("伊文斯")) return getImageUrl("unified_evans_1779691557999.png");
      if (lowerSpeaker.includes("杨冬")) return getImageUrl("unified_yangdong_1779691583143.png");
      if (lowerSpeaker.includes("常伟思")) return getImageUrl("unified_changweisi_1779691759159.png");
      if (lowerSpeaker.includes("东方延绪")) return getImageUrl("unified_dongfang_1779691773663.png");
      if (lowerSpeaker.includes("沈渊")) return getImageUrl("unified_shenyuan_1779691919176.png");
      if (lowerSpeaker.includes("华华")) return getImageUrl("unified_huahua_1780649946315.png");
      if (lowerSpeaker.includes("伊依")) return getImageUrl("unified_yiyi_1780649999542.png");
      if (lowerSpeaker.includes("霍金")) return getImageUrl("unified_hawking_1780649926625.png");
      if (lowerSpeaker.includes("庄颜")) return getImageUrl("unified_zhuangyan_1779712921189.png");
      if (lowerSpeaker.includes("水娃")) return getImageUrl("unified_shuiwa_1779712987486.png");
      if (lowerSpeaker.includes("雷志成")) return getImageUrl("unified_leizhicheng_1779713006589.png");
      if (lowerSpeaker.includes("杨卫宁")) return getImageUrl("unified_yangweining_1779713020653.png");
      if (lowerSpeaker.includes("严井")) return getImageUrl("unified_yanjing_1780649978771.png");
      if (lowerSpeaker.includes("白冰")) return getImageUrl("unified_baibing_1779713036549.png");
      if (lowerSpeaker.includes("苗福全")) return getImageUrl("unified_miaofuquan_1779713095135.png");
      if (lowerSpeaker.includes("滑膛") || lowerSpeaker.includes("华堂")) return getImageUrl("unified_huatang_1779713110568.png");
      if (lowerSpeaker.includes("朱汉扬")) return getImageUrl("unified_zhuhanyang_1779713125007.png");
      if (lowerSpeaker.includes("刘慈欣")) return getImageUrl("unified_liucixin_1779712937103.png");
      if (lowerSpeaker.includes("山杉惠子")) return getImageUrl("unified_keiko_1779713141458.png");
      if (lowerSpeaker.includes("萨伊")) return getImageUrl("unified_say_1780649885202.png");
    }

    if (!bmpName || bmpName === "default") {
      if (speakerName) {
        return this.classifyAvatar(speakerName);
      }
      return getImageUrl("character_default.png");
    }

    let name = bmpName.toLowerCase();
    name = name.replace(/^\/?images\//, "").replace("character_", "").replace("unified_", "");
    name = name.replace(".png", "").replace(".bmp", "");
    
    // Do not split by '_' if it's an event or cg image
    if (!name.startsWith("event_") && !name.startsWith("cg_") && name.includes("_")) {
      name = name.split("_")[0];
    }

    const mapping: Record<string, string> = {
      "dashi": "unified_dashi_1778921331273.png",
      "shiqiang": "unified_dashi_1778921331273.png",
      "sophon": "unified_sophon_1778921509458.png",
      "zhizi": "unified_sophon_1778921509458.png",
      "luoji": "unified_luoji_1778921262534.png",
      "beihai": "unified_beihai_1778921366897.png",
      "zhangbeihai": "unified_beihai_1778921366897.png",
      "chengxin": "unified_chengxin_1778921400346.png",
      "yewenjie": "unified_yewenjie_1778921299091.png",
      "wade": "unified_wade_1778921437022.png",
      "weide": "unified_wade_1778921437022.png",
      "tianming": "unified_tianming_1778921470963.png",
      "yuntianming": "unified_tianming_1778921470963.png",
      
      // New Unified Characters
      "wangmiao": "unified_wangmiao_1779691527760.png",
      "hines": "unified_hines_1779691718751.png",
      "xieenshi": "unified_hines_1779691718751.png",
      "reydiaz": "unified_reydiaz_1779691732536.png",
      "leidiyaizi": "unified_reydiaz_1779691732536.png",
      "tyler": "unified_tyler_1779691745991.png",
      "taile": "unified_tyler_1779691745991.png",
      "aa": "unified_aiaa_1779691888124.png",
      "aiaa": "unified_aiaa_1779691888124.png",
      "guanyifan": "unified_guanyifan_1779691901857.png",
      "linyun": "unified_linyun_1779691542667.png",
      "dingyi": "unified_dingyi_1779691512032.png",
      "evans": "unified_evans_1779691557999.png",
      "yiwensi": "unified_evans_1779691557999.png",
      "lin": "unified_linyun_1779691542667.png",
      "guan": "unified_guanyifan_1779691901857.png",
      "yangdong": "unified_yangdong_1779691583143.png",
      "changweisi": "unified_changweisi_1779691759159.png",
      "dongfang": "unified_dongfang_1779691773663.png",
      "shenyuan": "unified_shenyuan_1779691919176.png",

      // Remaining legacy fallbacks
      "huahua": "unified_huahua_1780649946315.png",
      "yiyi": "unified_yiyi_1780649999542.png",
      "hawking": "unified_hawking_1780649926625.png",
      "huoking": "unified_hawking_1780649926625.png",
      "zhuangyan": "unified_zhuangyan_1779712921189.png",
      "shuiwa": "unified_shuiwa_1779712987486.png",
      "leizhicheng": "unified_leizhicheng_1779713006589.png",
      "yangweining": "unified_yangweining_1779713020653.png",
      "yanjing": "unified_yanjing_1780649978771.png",
      "baibing": "unified_baibing_1779713036549.png",
      "miaofuquan": "unified_miaofuquan_1779713095135.png",
      "huatang": "unified_huatang_1779713110568.png",
      "zhuhanyang": "unified_zhuhanyang_1779713125007.png",
      "liucixin": "unified_liucixin_1779712937103.png",
      "keiko": "unified_keiko_1779713141458.png",
      "shanshanhuizi": "unified_keiko_1779713141458.png",
      "say": "unified_say_1780649885202.png",
      "sayi": "unified_say_1780649885202.png"
    };

    // Override CG mappings for Epochs and Major Events
    if (name.startsWith("event_crisis_start")) return getImageUrl("cg_crisis_start.png");
    if (name.startsWith("event_guzheng")) return getImageUrl("cg_guzheng.png");
    if (name.startsWith("event_moon_crisis")) return getImageUrl("cg_moon_crisis.png");
    if (name.startsWith("event_wandering_earth")) return getImageUrl("cg_wandering_earth.png");
    if (name.startsWith("event_dimensional_strike") || name === "dimensional_threat_alert") return getImageUrl("cg_dimensional_strike.png");
    if (name.startsWith("event_droplet_attack")) return getImageUrl("cg_droplet_attack.png");
    if (name.startsWith("event_deterrence_established")) return getImageUrl("cg_deterrence_established.png");
    if (name.startsWith("event_deterrence_broken")) return getImageUrl("cg_deterrence_broken.png");
    if (name.startsWith("event_gravitational_broadcast")) return getImageUrl("cg_gravitational_broadcast.png");
    if (name.startsWith("event_bunker_world")) return getImageUrl("cg_bunker_world.png");
    if (name.startsWith("event_galaxy_era")) return getImageUrl("cg_galaxy_era.png");
    if (name.startsWith("event_stardust_era")) return getImageUrl("cg_stardust_era.png");

    if (mapping[name]) return getImageUrl(mapping[name]);

    if (bmpName.startsWith("/images/") || bmpName.startsWith("images/") || bmpName.startsWith("character_") || bmpName.startsWith("unified_") || bmpName.startsWith("event_") || bmpName.startsWith("cg_") || bmpName.endsWith(".png")) {
      let fileName = bmpName.replace(/^\/?images\//, "");
      if (!fileName.endsWith(".png")) fileName += ".png";
      return getImageUrl(fileName);
    }

    // Final fallback: classify by speakerName if available
    if (speakerName) {
      return this.classifyAvatar(speakerName);
    }
    return getImageUrl("character_default.png");
  }

  /**
   * NPC 分类头像匹配 — 根据说话者名字关键词分类到职业头像
   *
   * 预留图片文件名（public/images/npc_*.png），待 AI 生成后放入：
   * - npc_military_commander.png  — 军事指挥官
   * - npc_scientist.png           — 科学家/研究员
   * - npc_official.png            — 政务官员
   * - npc_engineer.png            — 工程师/矿工
   * - npc_civilian.png            — 平民代表
   * - npc_medic.png               — 医疗人员
   * - npc_rebel.png               — 反叛者/ETO
   * - npc_ai_terminal.png         — AI/系统终端
   * - npc_comms_officer.png       — 通讯/监听员
   * - npc_merchant.png            — 商人/走私者
   *
   * 当 NPC 头像文件不存在时，会自然 fallback 到浏览器的 broken-image 或
   * StoryModal 中可以处理 onError 降级到 character_default.png。
   */
  private classifyAvatar(speakerName: string): string {
    const name = speakerName;

    // 军事类
    if (/指挥|将军|司令|边防|舰队|安全局|军|参谋|战术|特遣|防卫/.test(name)) {
      return getImageUrl("npc_military_commander.png");
    }
    // 科学家
    if (/博士|教授|物理|化学|科学|研究|实验|天文|数学|首席.*学|分析/.test(name)) {
      return getImageUrl("npc_scientist.png");
    }
    // 政务官员
    if (/秘书长|局长|民政|发言人|联合国|PDC|PIA|政府|部长|行政|总管|理事/.test(name)) {
      return getImageUrl("npc_official.png");
    }
    // 工程师/矿工
    if (/工程|矿|工厂|建造|维修|技术|总监/.test(name)) {
      return getImageUrl("npc_engineer.png");
    }
    // 医疗人员
    if (/医|护|卫生|心理|伦理|生物保护/.test(name)) {
      return getImageUrl("npc_medic.png");
    }
    // 反叛/ETO
    if (/ETO|降临|破壁|叛|恐怖|激进|鼹鼠|青色/.test(name)) {
      return getImageUrl("npc_rebel.png");
    }
    // AI/系统
    if (/AI|系统|终端|警告|通告|检测|自动|卫星/.test(name)) {
      return getImageUrl("npc_ai_terminal.png");
    }
    // 通讯/监听
    if (/监听|通讯|信号|观测|频率|深空/.test(name)) {
      return getImageUrl("npc_comms_officer.png");
    }
    // 商人/走私
    if (/商|走私|黑市|贸易|代言/.test(name)) {
      return getImageUrl("npc_merchant.png");
    }
    // 平民代表
    if (/代表|工人|居民|难民|民众|工会|群众/.test(name)) {
      return getImageUrl("npc_civilian.png");
    }

    // 默认
    return getImageUrl("character_default.png");
  }

  public init(): void {
    this.events = this.parseEventData(eventsData);
    this.randomEvents = this.parseEventData(randomEventsData);
    this.seedFilteredEvents();

    this.events = this.events.map(e => normalizeEventMeta(e));
    this.randomEvents = this.randomEvents.map(e => normalizeEventMeta(e));

    if (this.events.length === 0) {
      console.warn("Event data empty, adding fallback welcome event.");
      this.events.push(createGameEvent(
        "系统初始化完成",
        0, 0, "模拟器叙事系统已就绪。",
        0,
        [{ speakerName: "系统 AI", content: "欢迎来到《LegendOfUni》模拟器。当前叙事引擎已由于数据缺失进入紧急备用模式。", avatarUrl: getImageUrl("character_default.png") }]
      ));
    }
  }

  private seedFilteredEvents(): void {
    this.filteredEvents = [
      {
        id: "wallfacer_election",
        title: "面壁者选拔",
        tip: "联合国行星防御理事会(PCD)正在选拔面壁者。",
        dialogQueue: [
          { speakerName: "联合国秘书长", content: "女士们先生们，现在是人类文明存亡的危急关头。我们正式启动面壁计划。", avatarUrl: this.mapAvatar("default", "联合国秘书长") },
          { speakerName: "萨伊", content: "四位面壁者将获得人类文明的全部资源支持。", avatarUrl: this.mapAvatar("say") }
        ],
        condition: { minYear: 10, maxYear: 50, epoch: "CRISIS", minCulture: 10 },
        choices: [
          { label: "全力支持面壁计划", effects: [{ type: "flag", target: "wallfacer_project", value: 1 }, { type: "resource", target: "culture", value: 20 }] },
          { label: "谨慎观望", effects: [{ type: "flag", target: "wallfacer_cautious", value: 1 }, { type: "resource", target: "military", value: 2 }] }
        ]
      },
      {
        id: "deterrence_establishment",
        title: "建立威慑体系",
        tip: "罗辑博士提出了黑暗森林威慑理论。",
        dialogQueue: [
          { speakerName: "罗辑", content: "我找到了对抗三体文明的终极方案。", avatarUrl: this.mapAvatar("luoji") },
          { speakerName: "大史", content: "罗老弟，你确定这能行？", avatarUrl: this.mapAvatar("shiqiang") }
        ],
        condition: { minYear: 50, epoch: "CRISIS", reqTech: "黑暗森林威慑", minDeterrence: 50 },
        choices: [
          { label: "任命罗辑为执剑人", effects: [{ type: "flag", target: "swordholder_appointed", value: 1 }, { type: "resource", target: "prestige", value: 50 }] },
          { label: "暂缓威慑体系建设", effects: [{ type: "flag", target: "deterrence_delayed", value: 1 }, { type: "resource", target: "treachery", value: 10 }] }
        ]
      },
      {
        id: "sophon_blockade",
        title: "智子封锁生效",
        tip: "三体文明正式启动了智子对地球科技的全方位封锁。",
        dialogQueue: [
          { speakerName: "智子", content: "你们是虫子。", avatarUrl: this.mapAvatar("sophon") },
          { speakerName: "丁仪", content: "我们的基础物理学...被锁死了。", avatarUrl: this.mapAvatar("dingyi") }
        ],
        condition: { minYear: 10, maxYear: 300, epoch: "CRISIS", reqNotFlag: "sophon_broken" },
        choices: [
          { label: "加速研发量子计算机", effects: [{ type: "flag", target: "quantum_focus", value: 1 }, { type: "resource", target: "economy", value: -20 }] },
          { label: "放弃基础物理，主攻应用技术", effects: [{ type: "flag", target: "applied_tech_focus", value: 1 }, { type: "resource", target: "economy", value: 30 }] }
        ]
      },
      {
        id: "wandering_earth_decision",
        title: "流浪地球大辩论",
        tip: "面对即将到来的太阳氦闪，人类必须在多个方案中做出选择。",
        dialogQueue: [
          { speakerName: "联合政府发言人", content: "经过充分论证，流浪地球计划是人类唯一的生路。", avatarUrl: this.mapAvatar("default", "联合政府发言人") },
          { speakerName: "反对派", content: "这是拿全人类的生命在赌博！我们需要数字方舟方案！", avatarUrl: this.mapAvatar("default", "反对派") }
        ],
        condition: { minYear: 100, epoch: "CRISIS", reqTech: "行星发动机基础", loreDomain: "liu_cixin_crossover" },
        choices: [
          { label: "启动流浪地球计划", effects: [{ type: "flag", target: "wandering_chosen", value: 1 }, { type: "resource", target: "economy", value: -100 }, { type: "resource", target: "prestige", value: 30 }] },
          { label: "转向数字方舟方案", effects: [{ type: "flag", target: "digital_ark_chosen", value: 1 }, { type: "resource", target: "culture", value: 50 }] }
        ]
      },
      {
        id: "alien_first_contact",
        title: "地外文明初接触",
        tip: "我们的深空探测阵列发现了一个新的地外文明信号。",
        dialogQueue: [
          { speakerName: "林云", content: "长官，我们接收到一个极其复杂的数学信号。", avatarUrl: this.mapAvatar("lin_yun") },
          { speakerName: "维德", content: "不回应。不要暴露我们的坐标。", avatarUrl: this.mapAvatar("weide") }
        ],
        condition: { minYear: 80, epoch: "CRISIS", reqTech: "50光年远镜" },
        choices: [
          { label: "保持静默", effects: [{ type: "flag", target: "silent_contact", value: 1 }, { type: "resource", target: "prestige", value: 10 }] },
          { label: "发送友好信号", effects: [{ type: "flag", target: "friendly_broadcast", value: 1 }, { type: "resource", target: "culture", value: -20 }] }
        ]
      },
      {
        id: "rebellion_crisis",
        title: "逃亡主义叛乱",
        tip: "逃亡主义的蔓延正在撕裂人类社会的根基。",
        dialogQueue: [
          { speakerName: "褚岩", content: "我们有权离开！我们有权活下去！", avatarUrl: this.mapAvatar("default", "褚岩") },
          { speakerName: "联合政府发言人", content: "请保持冷静，逃亡即是背叛全人类。", avatarUrl: this.mapAvatar("default", "联合政府发言人") }
        ],
        condition: { minYear: 60, maxTreachery: 30, epoch: "CRISIS" },
        choices: [
          { label: "严厉打击逃亡主义", effects: [{ type: "resource", target: "treachery", value: -15 }, { type: "resource", target: "military", value: 3 }] },
          { label: "疏导安抚民心", effects: [{ type: "resource", target: "treachery", value: -5 }, { type: "resource", target: "culture", value: 15 }] }
        ]
      },
      {
        id: "sophon_countermeasure",
        title: "智子反制突破",
        tip: "550W量子计算机研制成功，智子科技封锁出现破口。",
        dialogQueue: [
          { speakerName: "罗辑", content: "智子的监视盲区被我们找到了。", avatarUrl: this.mapAvatar("luoji") },
          { speakerName: "面壁者", content: "从这一刻开始，真正的面壁计划正式开始。", avatarUrl: this.mapAvatar("default", "面壁者") }
        ],
        condition: { minYear: 30, reqTech: "550W量子计算机", reqNotFlag: "sophon_countermeasure_activated" },
        choices: [
          { label: "秘密启动面壁会议室", effects: [{ type: "flag", target: "sophon_countermeasure_activated", value: 1 }, { type: "flag", target: "sophon_broken", value: 1 }, { type: "resource", target: "prestige", value: 40 }] }
        ]
      },
      {
        id: "resource_crisis",
        title: "全球资源危机",
        tip: "工业扩张导致地球资源链濒临崩溃，各国代表齐聚联合国紧急会议。",
        dialogQueue: [
          { speakerName: "联合国秘书长", content: "诸位，我们正在消耗地球最后的气力。", avatarUrl: this.mapAvatar("default", "联合国秘书长") },
          { speakerName: "雷迪亚兹", content: "核爆采矿可以在小行星带提供无限资源。", avatarUrl: this.mapAvatar("reydiaz") }
        ],
        condition: { minYear: 25, epoch: "CRISIS", minEconomy: 30 },
        choices: [
          { label: "推进小行星带采矿计划", effects: [{ type: "flag", target: "asteroid_mining", value: 1 }, { type: "resource", target: "economy", value: -40 }, { type: "resource", target: "resource", value: 80 }] },
          { label: "实施全球资源配给制", effects: [{ type: "resource", target: "economy", value: -10 }, { type: "resource", target: "treachery", value: 10 }, { type: "resource", target: "prestige", value: -10 }] }
        ]
      },
      {
        id: "united_nations_assembly",
        title: "联合国紧急大会",
        tip: "面对危机，联合国召开全球领导人大会，决定人类未来的战略方向。",
        dialogQueue: [
          { speakerName: "萨伊", content: "我们必须在全面军备和文明存续之间做出选择。", avatarUrl: this.mapAvatar("say") },
          { speakerName: "泰勒", content: "只有最强大的军队才能保障我们的生存。", avatarUrl: this.mapAvatar("tyler") }
        ],
        condition: { minYear: 15, epoch: "CRISIS", minPopulation: 100 },
        choices: [
          { label: "以军事为优先", effects: [{ type: "flag", target: "military_first", value: 1 }, { type: "resource", target: "military", value: 5 }, { type: "resource", target: "culture", value: -10 }] },
          { label: "科技与文化并重", effects: [{ type: "flag", target: "balanced_approach", value: 1 }, { type: "resource", target: "culture", value: 15 }, { type: "resource", target: "prestige", value: 10 }] }
        ]
      },
      {
        id: "technological_breakthrough",
        title: "科学突破时刻",
        tip: "全球顶级物理学家在日内瓦联合宣布了一项可能改变人类命运的重大发现。",
        dialogQueue: [
          { speakerName: "丁仪", content: "我们的理论物理在智子封锁下找到了新的出路！", avatarUrl: this.mapAvatar("dingyi") },
          { speakerName: "杨冬", content: "这是...我们从未想象过的可能性。", avatarUrl: this.mapAvatar("yangdong") }
        ],
        condition: { minYear: 20, epoch: "CRISIS", minCulture: 40 },
        choices: [
          { label: "全力资助新理论研究", effects: [{ type: "flag", target: "scientific_push", value: 1 }, { type: "resource", target: "economy", value: -30 }, { type: "resource", target: "prestige", value: 30 }] },
          { label: "谨慎观望，继续应用研究", effects: [{ type: "resource", target: "economy", value: 15 }, { type: "resource", target: "prestige", value: -5 }] }
        ]
      },
      {
        id: "stf_formation",
        title: "太空军正式成军",
        tip: "太阳系舰队（STF）宣告成立，人类第一次拥有了成建制的太空武装力量。",
        dialogQueue: [
          { speakerName: "常伟思", content: "从今天起，我们是太空人类了。", avatarUrl: this.mapAvatar("changweisi") },
          { speakerName: "章北海", content: "首长，我申请调往前线舰队。", avatarUrl: this.mapAvatar("beihai") }
        ],
        condition: { minYear: 20, epoch: "CRISIS", minEconomy: 50 },
        choices: [
          { label: "任命常伟思为太空军总司令", effects: [{ type: "flag", target: "stf_established", value: 1 }, { type: "resource", target: "military", value: 8 }, { type: "resource", target: "prestige", value: 20 }] },
          { label: "暂缓太空军建设", effects: [{ type: "resource", target: "economy", value: 20 }, { type: "resource", target: "military", value: 1 }] }
        ]
      },
      {
        id: "deterrence_strain",
        title: "威慑天平倾斜",
        tip: "黑暗森林威慑体系面临严峻考验，人类需要决定如何应对日益紧张的国际局势。",
        dialogQueue: [
          { speakerName: "程心", content: "我们必须坚持爱的选择，威慑不能靠恐惧来维持。", avatarUrl: this.mapAvatar("chengxin") },
          { speakerName: "维德", content: "失去兽性，失去一切。把按钮给我。", avatarUrl: this.mapAvatar("wade") }
        ],
        condition: { minYear: 70, epoch: "DETERRENCE", reqFlag: "swordholder_appointed", minDeterrence: 40 },
        choices: [
          { label: "坚守威慑底线，增加投入", effects: [{ type: "flag", target: "deterrence_reinforced", value: 1 }, { type: "resource", target: "economy", value: -30 }] },
          { label: "推行和平共处外交", effects: [{ type: "resource", target: "culture", value: 25 }, { type: "resource", target: "treachery", value: -5 }] }
        ]
      },
      {
        id: "lightspeed_project",
        title: "光速飞船提案",
        tip: "少数科学家提出了一个疯狂的方案：建造光速飞船逃离太阳系。",
        dialogQueue: [
          { speakerName: "希恩斯", content: "曲率驱动在理论上是可行的。", avatarUrl: this.mapAvatar("hines") },
          { speakerName: "维德", content: "前进！不择手段地前进！", avatarUrl: this.mapAvatar("wade") }
        ],
        condition: { minYear: 90, epoch: "DETERRENCE", reqTech: "曲率驱动理论", reqNotFlag: "lightspeed_project_approved" },
        choices: [
          { label: "秘密资助光速飞船研究", effects: [{ type: "flag", target: "lightspeed_project_approved", value: 1 }, { type: "resource", target: "economy", value: -50 }, { type: "resource", target: "prestige", value: 30 }] },
          { label: "公开否决，维护威慑体系", effects: [{ type: "resource", target: "prestige", value: -15 }, { type: "flag", target: "lightspeed_rejected", value: 1 }] }
        ]
      },
      {
        id: "broadcast_era_dawn",
        title: "广播纪元开幕",
        tip: "黑暗森林威慑被打破，人类被迫向全宇宙广播三体坐标。广播纪元正式来临。",
        dialogQueue: [
          { speakerName: "智子", content: "你们输了。三体星系即将被摧毁，但你们也暴露了自己。", avatarUrl: this.mapAvatar("sophon") },
          { speakerName: "罗辑", content: "我早就说过，黑暗森林不是闹着玩的。", avatarUrl: this.mapAvatar("luoji") }
        ],
        condition: { minYear: 120, epoch: "BROADCAST", reqNotFlag: "broadcast_dawn_seen" },
        choices: [
          { label: "加速建设掩体计划", effects: [{ type: "flag", target: "broadcast_dawn_seen", value: 1 }, { type: "resource", target: "military", value: 10 }, { type: "resource", target: "economy", value: -40 }] },
          { label: "全力发展逃亡科技", effects: [{ type: "flag", target: "broadcast_dawn_seen", value: 1 }, { type: "flag", target: "escape_tech_focus", value: 1 }, { type: "resource", target: "culture", value: -10 }] }
        ]
      },
      {
        id: "bunker_project_debate",
        title: "掩体计划大辩论",
        tip: "面对可能的黑暗森林打击，人类在掩体计划和光速飞船之间激烈争论。",
        dialogQueue: [
          { speakerName: "艾AA", content: "掩体计划是最现实的选择，我们已经在木星背后建造了基地。", avatarUrl: this.mapAvatar("aa") },
          { speakerName: "关一帆", content: "如果打击不是光粒，掩体毫无意义。只有逃走才有用。", avatarUrl: this.mapAvatar("guanyifan") }
        ],
        condition: { minYear: 150, epoch: "BROADCAST", reqFlag: "broadcast_dawn_seen" },
        choices: [
          { label: "全面推行掩体计划", effects: [{ type: "flag", target: "bunker_project_active", value: 1 }, { type: "resource", target: "economy", value: -80 }, { type: "resource", target: "military", value: 5 }] },
          { label: "掩体与光速飞船并行", effects: [{ type: "flag", target: "dual_strategy", value: 1 }, { type: "resource", target: "economy", value: -120 }, { type: "resource", target: "prestige", value: 20 }] }
        ]
      },
      {
        id: "dimensional_threat_alert",
        title: "维度打击警报",
        tip: "深空探测器发现异常空间曲率波动——这可能意味着二向箔攻击正在逼近。",
        dialogQueue: [
          { speakerName: "系统警告", content: "深空探测器发现异常空间曲率波动——这可能意味着二向箔攻击正在逼近。", avatarUrl: this.mapAvatar("event_dimensional_strike") },
          { speakerName: "林云", content: "空间曲率读数异常，长官。这不是自然现象。", avatarUrl: this.mapAvatar("linyun") },
          { speakerName: "关一帆", content: "这就是传说中的降维打击...我们必须离开这个星系。", avatarUrl: this.mapAvatar("guanyifan") }
        ],
        condition: { minYear: 180, epoch: "BUNKER", reqNotFlag: "dimensional_alert_seen" },
        choices: [
          { label: "启动紧急撤离预案", effects: [{ type: "flag", target: "dimensional_alert_seen", value: 1 }, { type: "resource", target: "economy", value: -60 }, { type: "resource", target: "prestige", value: 15 }] },
          { label: "加强掩体防御工事", effects: [{ type: "flag", target: "dimensional_alert_seen", value: 1 }, { type: "resource", target: "military", value: 8 }, { type: "resource", target: "prestige", value: -10 }] }
        ]
      },
      {
        id: "galaxy_era_exodus",
        title: "银河纪元启航",
        tip: "人类终于跨出了银河系殖民的第一步，文明进入全新的篇章。",
        dialogQueue: [
          { speakerName: "云天明", content: "整个银河系都在我们眼前展开。", avatarUrl: this.mapAvatar("tianming") },
          { speakerName: "程心", content: "我们还能回到地球吗？", avatarUrl: this.mapAvatar("chengxin") }
        ],
        condition: { minYear: 220, epoch: "GALAXY", reqNotFlag: "galaxy_exodus_seen" },
        choices: [
          { label: "向银河系深处进发", effects: [{ type: "flag", target: "galaxy_exodus_seen", value: 1 }, { type: "resource", target: "prestige", value: 50 }, { type: "resource", target: "culture", value: 30 }] },
          { label: "先稳固现有殖民地", effects: [{ type: "flag", target: "galaxy_exodus_seen", value: 1 }, { type: "resource", target: "economy", value: 40 }, { type: "resource", target: "resource", value: 60 }] }
        ]
      },
      {
        id: "alien_civilization_diplomacy",
        title: "异星文明外交",
        tip: "我们在银河系边缘遇到了一个古老的非碳基文明，它们发出了善意的接触信号。",
        dialogQueue: [
          { speakerName: "关一帆", content: "他们的科技至少领先我们一千年，但似乎没有敌意。", avatarUrl: this.mapAvatar("guanyifan") },
          { speakerName: "云天明", content: "黑暗森林法则之外，也许存在着第三种可能。", avatarUrl: this.mapAvatar("tianming") }
        ],
        condition: { minYear: 200, epoch: "GALAXY", minCulture: 60, reqNotFlag: "alien_diplomacy_seen" },
        choices: [
          { label: "建立外交关系", effects: [{ type: "flag", target: "alien_diplomacy_seen", value: 1 }, { type: "flag", target: "alien_alliance", value: 1 }, { type: "resource", target: "prestige", value: 60 }, { type: "resource", target: "culture", value: 40 }] },
          { label: "保持距离，暗中观察", effects: [{ type: "flag", target: "alien_diplomacy_seen", value: 1 }, { type: "resource", target: "military", value: 5 }, { type: "resource", target: "prestige", value: 15 }] }
        ]
      },
      {
        id: "reunion_homeworld",
        title: "故土重归",
        tip: "银河系流浪数百年后，人类舰队收到了来自太阳系的微弱信号。",
        dialogQueue: [
          { speakerName: "程心", content: "那是...那是地球的频率。", avatarUrl: this.mapAvatar("chengxin") },
          { speakerName: "云天明", content: "回家了，我们终于可以回家了。", avatarUrl: this.mapAvatar("tianming") }
        ],
        condition: { minYear: 280, epoch: "GALAXY", reqFlag: "galaxy_exodus_seen", minCulture: 80 },
        choices: [
          { label: "全速返回太阳系", effects: [{ type: "flag", target: "return_to_home", value: 1 }, { type: "resource", target: "prestige", value: 80 }, { type: "resource", target: "culture", value: 50 }] },
          { label: "派遣探测器先行侦察", effects: [{ type: "flag", target: "cautious_return", value: 1 }, { type: "resource", target: "prestige", value: 30 }, { type: "resource", target: "military", value: 5 }] }
        ]
      },
      {
        id: "inner_conflict_resolution",
        title: "文明内讧危机",
        tip: "长期的星际航行导致了社会分裂，舰队内部出现了两个对立的派系。",
        dialogQueue: [
          { speakerName: "褚岩", content: "我们已经不是地球人类了，应该有新的规则。", avatarUrl: this.mapAvatar("default", "褚岩") },
          { speakerName: "庄颜", content: "但我们的根永远在那里。分崩离析只会毁灭我们自己。", avatarUrl: this.mapAvatar("zhuangyan") }
        ],
        condition: { minYear: 160, epoch: "BROADCAST", minCulture: 40 },
        choices: [
          { label: "武力镇压分裂势力", effects: [{ type: "resource", target: "treachery", value: -15 }, { type: "resource", target: "military", value: 3 }, { type: "resource", target: "prestige", value: -15 }] },
          { label: "召开全民公决大会", effects: [{ type: "resource", target: "treachery", value: -5 }, { type: "resource", target: "culture", value: 25 }, { type: "resource", target: "prestige", value: 10 }] }
        ]
      },
      {
        id: "great_filter_confrontation",
        title: "大过滤器降临",
        tip: "一个远超我们认知的文明探测器抵达了银河系边缘，它是猎手，还是观察者？",
        dialogQueue: [
          { speakerName: "智子", content: "这个文明的科技水平...我无法分析。他们超越了所有已知模型。", avatarUrl: this.mapAvatar("sophon") },
          { speakerName: "罗辑", content: "黑暗森林的终极猎手现身了。我们现在只有一条路：保持静默。", avatarUrl: this.mapAvatar("luoji") }
        ],
        condition: { minYear: 260, epoch: "GALAXY", reqFlag: "galaxy_exodus_seen", minDeterrence: 70 },
        choices: [
          { label: "全文明进入静默状态", effects: [{ type: "flag", target: "great_filter_silence", value: 1 }, { type: "resource", target: "prestige", value: 100 }, { type: "resource", target: "economy", value: -50 }] },
          { label: "尝试建立联系", effects: [{ type: "flag", target: "great_filter_contact", value: 1 }, { type: "resource", target: "prestige", value: -30 }] }
        ]
      },
    ];
  }

  public getFilteredEventsForTurn(): FilteredEventPayload[] {
    const game = GameInstance.get();
    const result: FilteredEventPayload[] = [];

    for (const fev of this.filteredEvents) {
      if (this.triggeredFilteredIds.has(fev.id)) {
        if (fev.cooldownYears && fev.lastTriggeredYear) {
          if (game.year - fev.lastTriggeredYear < fev.cooldownYears) continue;
        } else continue;
      }

      if (!this.checkFilterConditions(fev.condition)) continue;

      result.push(fev);
    }
    return result;
  }

  private isEpochMatch(targetEpoch: string | number, currentEpoch: string): boolean {
    if (targetEpoch === undefined || targetEpoch === null || targetEpoch === "ANY") return true;

    let targetStr: string;
    if (typeof targetEpoch === "number") {
      const epochNames = ["GOLDEN", "CRISIS", "DETERRENCE", "BROADCAST", "BUNKER", "GALAXY", "STARDUST"];
      targetStr = epochNames[targetEpoch] || "";
    } else {
      targetStr = targetEpoch;
    }

    const targets = targetStr.split(",").map(s => s.trim());
    
    for (const t of targets) {
      if (t === currentEpoch) return true;
      if (t === "WANDERING" && (currentEpoch === "BROADCAST" || currentEpoch === "BUNKER" || currentEpoch === "GALAXY")) return true;
      if (t === "SHELTER" && currentEpoch === "BUNKER") return true;
    }

    return false;
  }

  private checkFilterConditions(cond: any): boolean {
    const game = GameInstance.get();
    const e = game.earthCivi;
    const epochNames = ["GOLDEN", "CRISIS", "DETERRENCE", "BROADCAST", "BUNKER", "GALAXY", "STARDUST"];
    const currentEpoch = epochNames[game.epoch];

    if (cond.loreDomain && game.loreMode === 'strict_three_body' && cond.loreDomain !== 'three_body_canon') return false;

    if (cond.minYear !== undefined && game.year < cond.minYear) return false;
    if (cond.maxYear !== undefined && game.year > cond.maxYear) return false;
    if (cond.epoch && !this.isEpochMatch(cond.epoch, currentEpoch)) return false;
    if (cond.reqTech && !this.isTecFinishedInAnyTree(cond.reqTech)) return false;
    if (cond.reqFlag && !game.hasFlag(cond.reqFlag)) return false;
    if (cond.reqNotFlag && game.hasFlag(cond.reqNotFlag)) return false;
    if (cond.minEconomy !== undefined && e.economy < cond.minEconomy) return false;
    if (cond.maxEconomy !== undefined && e.economy > cond.maxEconomy) return false;
    if (cond.minPopulation !== undefined && e.population < cond.minPopulation) return false;
    if (cond.maxPopulation !== undefined && e.population > cond.maxPopulation) return false;
    if (cond.minCulture !== undefined && e.culture < cond.minCulture) return false;
    if (cond.maxCulture !== undefined && e.culture > cond.maxCulture) return false;
    if (cond.minDeterrence !== undefined && e.deterrenceValue < cond.minDeterrence) return false;
    if (cond.maxDeterrence !== undefined && e.deterrenceValue > cond.maxDeterrence) return false;
    if (cond.minTreachery !== undefined && e.treachery < cond.minTreachery) return false;
    if (cond.maxTreachery !== undefined && e.treachery > cond.maxTreachery) return false;

    if (cond.probability && game.rng() > cond.probability) return false;

    return true;
  }

  private isTecFinishedInAnyTree(name: string): boolean {
    const game = GameInstance.get();
    return game.earthCivi.tecTreeManager.isTecFinishedAnywhere(name);
  }

  public markFilteredEventTriggered(id: string, year: number): void {
    this.triggeredFilteredIds.add(id);
    const fev = this.filteredEvents.find(f => f.id === id);
    if (fev) fev.lastTriggeredYear = year;
  }

  public parseEventData(dataList: any): GameEvent[] {
    const events: GameEvent[] = [];
    if (!dataList || !Array.isArray(dataList)) return events;

    dataList.forEach((data: any) => {
      let dialogNodes: DialogNode[] = [];

      if (data.dialogQueue) {
        dialogNodes = data.dialogQueue.map((node: any) => {
          const mappedUrl = this.mapAvatar(node.avatarUrl, node.speakerName);
          return {
            speakerName: node.speakerName,
            speakerTitle: node.speakerTitle,
            content: node.content,
            avatarUrl: mappedUrl,
            isCG: mappedUrl.includes('cg_') || !!node.isCG
          };
        });
      } else {
        const talkCount = data.talkcount || 1;
        for (let i = 0; i < talkCount; i++) {
          const speaker = data[`talk${i}_talker`];
          const content = data[`talk${i}_content`];
          const pic = data[`talk${i}_pic`];

          if (speaker && content) {
            const mappedUrl = this.mapAvatar(pic, speaker);
            dialogNodes.push({
              speakerName: speaker,
              content: content,
              avatarUrl: mappedUrl,
              isCG: mappedUrl.includes('cg_')
            });
          }
        }
      }

      let inYear = data.inYear ?? 0;
      if (inYear === 0 && typeof data.name === 'number') {
        inYear = data.name;
      }

      const e = createGameEvent(
        data.title || (typeof data.name === 'string' ? data.name : `纪元大事记_${inYear}`),
        data.eventtype ?? 0,
        inYear,
        data.tip || (dialogNodes.length > 0 ? dialogNodes[0].content : ""),
        data.eventeffect ?? 0,
        dialogNodes,
        data.id,
        data.triggerCondition,
        data.choices,
        data.effects
      );
      events.push(e);
    });
    return events;
  }

  public checkEvents(currentYear: number): GameEvent[] {
    const game = GameInstance.get();
    const triggered: GameEvent[] = [];
    this.events.forEach(e => {
      if (!e.hasTriggered && currentYear >= e.inYear) {
        // Enforce loreMode for fixed events if they have a loreDomain defined
        if (e.cadenceMeta && e.cadenceMeta.loreDomain) {
          if (game && game.loreMode === 'strict_three_body' && e.cadenceMeta.loreDomain !== 'three_body_canon') {
            return; // Skip this event
          }
        }
        // Enforce triggerCondition if defined (e.g. epoch checking)
        if (e.triggerCondition) {
          if (!this.checkFilterConditions(e.triggerCondition)) {
            return; // Skip for now, will check again in future turns
          }
        }
        e.hasTriggered = true;
        triggered.push(e);
      }
    });
    return triggered;
  }

  private isPersonAliveInEpoch(personName: string, epochName: string): boolean {
    const epochDeathMap: Record<string, string[]> = {
      "伊文斯": ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"],
      "林云": ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"],
      "泰勒": ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"],
      "雷迪亚兹": ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"],
      "希恩斯": ["BROADCAST", "BUNKER", "GALAXY"],
      "罗辑": ["GALAXY"],
      "章北海": ["BROADCAST", "BUNKER", "GALAXY"],
      "丁仪": ["BROADCAST", "BUNKER", "GALAXY"],
      "庄颜": ["BROADCAST", "BUNKER", "GALAXY"],
      "维德": ["GALAXY"],
      "程心": [],
      "云天明": [],
      "艾AA": ["CRISIS"],
      "智子": [],
      "关一帆": ["CRISIS", "DETERRENCE"],
    };
    return !(epochDeathMap[personName] || []).includes(epochName);
  }

  private isEventCharactersUnlocked(e: GameEvent): boolean {
    const game = GameInstance.get();
    if (!game) return true;

    const available = game.personManager.availablePersons;

    // These core story characters must be locked until officially unlocked in events.json
    const coreStoryPersons = [
      "伊文斯", "林云", "罗辑", "泰勒", "雷迪亚兹", "希恩斯",
      "章北海", "庄颜", "程心", "维德", "艾AA", "云天明", "智子", "关一帆"
    ];

    const epochNames = ["GOLDEN", "CRISIS", "DETERRENCE", "BROADCAST", "BUNKER", "GALAXY", "STARDUST"];
    const currentEpoch = epochNames[game.epoch];

    if (e.dialogNodes) {
      for (const node of e.dialogNodes) {
        const speaker = node.speakerName;
        if (speaker) {
          // Skip alive check for historical records/playbacks/inspections
          if (speaker.includes("历史") || speaker.includes("录像") || speaker.includes("档案") || speaker.includes("遗言")) {
            continue;
          }
          // Check if speaker contains any core person name (e.g., "安全官 维德" contains "维德")
          for (const corePerson of coreStoryPersons) {
            if (speaker.includes(corePerson)) {
              if (!available.has(corePerson)) {
                return false;
              }
              if (!this.isPersonAliveInEpoch(corePerson, currentEpoch)) {
                return false;
              }
            }
          }
        }
      }
    }

    return true;
  }

  public checkRandomEvents(): GameEvent | null {
    const game = GameInstance.get();
    const eligible: GameEvent[] = [];

    for (const e of this.randomEvents) {
      if (!isEventEligible(e, game, this.lastLaneTriggeredYear, this.randomEventTriggerCounts, this.lastAnyEventYear)) continue;

      // Enforce: Wallfacer/Story characters must be unlocked before their random events can trigger
      if (!this.isEventCharactersUnlocked(e)) continue;

      if (e.triggerCondition) {
        const cond = { ...e.triggerCondition };
        // Exclude probability from checkFilterConditions to prevent double rolling
        delete cond.probability;

        if (!this.checkFilterConditions(cond)) {
          continue;
        }

        if (e.triggerCondition.reqStar) {
          const star = game.starManager.getStarByName(e.triggerCondition.reqStar);
          if (!star || star.belongToCivi !== "地球") {
            continue;
          }
        }
      }

      const prob = (e.cadenceMeta?.probability) ?? 0.02;
      e.cadenceMeta!.probability = prob;
      eligible.push(e);
    }

    const picked = pickWeightedEvent(eligible, () => game.rng());
    if (picked) {
      const count = this.randomEventTriggerCounts.get(picked.id || picked.name) || 0;
      this.randomEventTriggerCounts.set(picked.id || picked.name, count + 1);

      const lane = picked.cadenceMeta?.lane || 'ambient';
      this.lastLaneTriggeredYear.set(lane, game.year);
      this.lastAnyEventYear = game.year;
    }

    return picked;
  }

  public getEventDiversityStats() {
    const storyTotal = this.events.length;
    const storyTriggered = this.events.filter(e => e.hasTriggered).length;

    const randomTotal = this.randomEvents.length;
    const randomTriggered = this.randomEventTriggerCounts.size;

    const filteredTotal = this.filteredEvents.length;
    const triggeredFiltered = this.triggeredFilteredIds.size;

    const total = storyTotal + randomTotal + filteredTotal;
    const triggered = storyTriggered + randomTriggered + triggeredFiltered;
    const percentage = total > 0 ? Math.round((triggered / total) * 100) : 0;

    return {
      storyTotal,
      storyTriggered,
      randomTotal,
      randomTriggered,
      filteredTotal,
      triggeredFiltered,
      total,
      triggered,
      percentage
    };
  }
}

if (import.meta.hot) {
  import.meta.hot.accept('../data/events.json', (newModule) => {
    console.log('[HMR] events.json updated');
    const game = GameInstance.get();
    if (game && game.eventManager) {
      game.eventManager.events = game.eventManager.parseEventData(newModule ? newModule.default : null);
      game.eventManager.events = game.eventManager.events.map(e => normalizeEventMeta(e));
      window.dispatchEvent(new CustomEvent('game-loaded'));
    }
  });

  import.meta.hot.accept('../data/randomevents.json', (newModule) => {
    console.log('[HMR] randomevents.json updated');
    const game = GameInstance.get();
    if (game && game.eventManager) {
      game.eventManager.randomEvents = game.eventManager.parseEventData(newModule ? newModule.default : null);
      game.eventManager.randomEvents = game.eventManager.randomEvents.map(e => normalizeEventMeta(e));
      window.dispatchEvent(new CustomEvent('game-loaded'));
    }
  });
}



