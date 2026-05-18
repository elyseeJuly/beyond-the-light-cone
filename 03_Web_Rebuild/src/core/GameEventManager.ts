import { GameEvent, createGameEvent } from "./GameEvent";
import eventsData from "../data/events.json";
import randomEventsData from "../data/randomevents.json";
import { DialogNode, FilteredEventPayload } from "../types/narrative";
import { GameInstance } from "./Game";
import { getImageUrl } from "../utils/assetUrl";

export class GameEventManager {
  public events: GameEvent[] = [];
  public randomEvents: GameEvent[] = [];
  public filteredEvents: FilteredEventPayload[] = [];
  public triggeredFilteredIds: Set<string> = new Set();

  constructor() {
    this.init();
  }

  private mapAvatar(bmpName: string): string {
    if (!bmpName || bmpName === "default") return getImageUrl("character_default.png");

    let name = bmpName.toLowerCase();
    name = name.replace("/images/", "").replace("character_", "").replace("unified_", "");
    name = name.replace(".png", "").replace(".bmp", "");
    name = name.split("_")[0];

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
      "wangmiao": "character_wangmiao_1778724166873.png",
      "hines": "character_hines_1778724207245.png",
      "xieenshi": "character_hines_1778724207245.png",
      "reydiaz": "character_reydiaz_1778724231986.png",
      "leidiyaizi": "character_reydiaz_1778724231986.png",
      "tyler": "character_tyler_1778724253558.png",
      "taile": "character_tyler_1778724253558.png",
      "aa": "character_aiaa_1778724300313.png",
      "aiaa": "character_aiaa_1778724300313.png",
      "guanyifan": "character_guanyifan_1778724448368.png",
      "linyun": "character_linyun_1778724276166.png",
      "dingyi": "character_dingyi_1778724123469.png",
      "evans": "character_evans_1778724472738.png",
      "yiwensi": "character_evans_1778724472738.png",
      "yangdong": "character_yangdong_1778724413422.png",
      "huahua": "character_huahua_1778818926539.png",
      "yiyi": "character_yiyi_1778724524669.png",
      "shenyuan": "character_shenyuan_1778726061895.png",
      "hawking": "character_hawking_1778726088806.png",
      "huoking": "character_hawking_1778726088806.png",
      "changweisi": "character_changweisi_1778724189193.png",
      "zhuangyan": "character_zhuangyan_1778724322851.png",
      "shuiwa": "character_shuiwa_1778726120500.png",
      "leizhicheng": "character_leizhicheng_1778818873520.png",
      "yangweining": "character_yangweining_1778818900159.png",
      "yanjing": "character_yanjing_1778819395854.png",
      "baibing": "character_baibing_1778819424975.png",
      "miaofuquan": "character_miaofuquan_1778818954566.png",
      "huatang": "character_huatang_1778819276066.png",
      "zhuhanyang": "character_zhuhanyang_1778833149488.png",
      "liucixin": "character_liucixin_1778819370180.png",
      "keiko": "character_keiko_1778724347302.png",
      "shanshanhuizi": "character_keiko_1778724347302.png"
    };

    if (mapping[name]) return getImageUrl(mapping[name]);

    if (bmpName.startsWith("/images/") || bmpName.startsWith("character_") || bmpName.startsWith("unified_") || bmpName.endsWith(".png")) {
      const fileName = bmpName.startsWith("/images/") ? bmpName.replace("/images/", "") : bmpName;
      return getImageUrl(fileName);
    }

    return getImageUrl("character_default.png");
  }

  public init(): void {
    this.events = this.parseEventData(eventsData);
    this.randomEvents = this.parseEventData(randomEventsData);
    this.seedFilteredEvents();

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
          { speakerName: "联合国秘书长", content: "女士们先生们，现在是人类文明存亡的危急关头。我们正式启动面壁计划。", avatarUrl: this.mapAvatar("default") },
          { speakerName: "萨伊", content: "四位面壁者将获得人类文明的全部资源支持。", avatarUrl: this.mapAvatar("default") }
        ],
        condition: { minYear: 10, maxYear: 50, epoch: "CRISIS", minCulture: 30 },
        choices: [
          { label: "全力支持面壁计划", effects: [{ type: "flag", target: "wallfacer_project", value: 1 }, { type: "resource", target: "culture", value: 20 }] },
          { label: "谨慎观望", effects: [{ type: "flag", target: "wallfacer_cautious", value: 1 }, { type: "resource", target: "military", value: 2 }] }
        ],
        cooldownYears: 10
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
        condition: { minYear: 10, maxYear: 200, epoch: "CRISIS", reqNotFlag: "sophon_broken" },
        choices: [
          { label: "加速研发量子计算机", effects: [{ type: "flag", target: "quantum_focus", value: 1 }, { type: "resource", target: "economy", value: -20 }] },
          { label: "放弃基础物理，主攻应用技术", effects: [{ type: "flag", target: "applied_tech_focus", value: 1 }, { type: "resource", target: "economy", value: 30 }] }
        ],
        cooldownYears: 5
      },
      {
        id: "wandering_earth_decision",
        title: "流浪地球大辩论",
        tip: "面对即将到来的太阳氦闪，人类必须在多个方案中做出选择。",
        dialogQueue: [
          { speakerName: "联合政府发言人", content: "经过充分论证，流浪地球计划是人类唯一的生路。", avatarUrl: this.mapAvatar("default") },
          { speakerName: "反对派", content: "这是拿全人类的生命在赌博！我们需要数字方舟方案！", avatarUrl: this.mapAvatar("default") }
        ],
        condition: { minYear: 100, epoch: "CRISIS", reqTech: "行星发动机基础" },
        choices: [
          { label: "启动流浪地球计划", effects: [{ type: "flag", target: "wandering_chosen", value: 1 }, { type: "resource", target: "economy", value: -100 }, { type: "resource", target: "prestige", value: 30 }] },
          { label: "转向数字方舟方案", effects: [{ type: "flag", target: "digital_ark_chosen", value: 1 }, { type: "resource", target: "culture", value: 50 }] }
        ],
        cooldownYears: 40
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
        ],
        cooldownYears: 30
      },
      {
        id: "rebellion_crisis",
        title: "逃亡主义叛乱",
        tip: "逃亡主义的蔓延正在撕裂人类社会的根基。",
        dialogQueue: [
          { speakerName: "褚岩", content: "我们有权离开！我们有权活下去！", avatarUrl: this.mapAvatar("default") },
          { speakerName: "联合政府发言人", content: "请保持冷静，逃亡即是背叛全人类。", avatarUrl: this.mapAvatar("default") }
        ],
        condition: { minYear: 60, maxTreachery: 30, epoch: "CRISIS" },
        choices: [
          { label: "严厉打击逃亡主义", effects: [{ type: "resource", target: "treachery", value: -15 }, { type: "resource", target: "military", value: 3 }] },
          { label: "疏导安抚民心", effects: [{ type: "resource", target: "treachery", value: -5 }, { type: "resource", target: "culture", value: 15 }] }
        ],
        cooldownYears: 15
      },
      {
        id: "sophon_countermeasure",
        title: "智子反制突破",
        tip: "550W量子计算机研制成功，智子科技封锁出现破口。",
        dialogQueue: [
          { speakerName: "罗辑", content: "智子的监视盲区被我们找到了。", avatarUrl: this.mapAvatar("luoji") },
          { speakerName: "面壁者", content: "从这一刻开始，真正的面壁计划正式开始。", avatarUrl: this.mapAvatar("default") }
        ],
        condition: { minYear: 30, reqTech: "550W量子计算机", reqNotFlag: "sophon_countermeasure_activated" },
        choices: [
          { label: "秘密启动面壁会议室", effects: [{ type: "flag", target: "sophon_countermeasure_activated", value: 1 }, { type: "flag", target: "sophon_broken", value: 1 }, { type: "resource", target: "prestige", value: 40 }] }
        ],
        cooldownYears: 5
      },
      {
        id: "resource_crisis",
        title: "全球资源危机",
        tip: "工业扩张导致地球资源链濒临崩溃，各国代表齐聚联合国紧急会议。",
        dialogQueue: [
          { speakerName: "联合国秘书长", content: "诸位，我们正在消耗地球最后的气力。", avatarUrl: this.mapAvatar("default") },
          { speakerName: "雷迪亚兹", content: "核爆采矿可以在小行星带提供无限资源。", avatarUrl: this.mapAvatar("reydiaz") }
        ],
        condition: { minYear: 25, epoch: "CRISIS", minEconomy: 30 },
        choices: [
          { label: "推进小行星带采矿计划", effects: [{ type: "flag", target: "asteroid_mining", value: 1 }, { type: "resource", target: "economy", value: -40 }, { type: "resource", target: "resource", value: 80 }] },
          { label: "实施全球资源配给制", effects: [{ type: "resource", target: "economy", value: -10 }, { type: "resource", target: "treachery", value: 10 }, { type: "resource", target: "prestige", value: -10 }] }
        ],
        cooldownYears: 20
      },
      {
        id: "united_nations_assembly",
        title: "联合国紧急大会",
        tip: "面对危机，联合国召开全球领导人大会，决定人类未来的战略方向。",
        dialogQueue: [
          { speakerName: "萨伊", content: "我们必须在全面军备和文明存续之间做出选择。", avatarUrl: this.mapAvatar("default") },
          { speakerName: "泰勒", content: "只有最强大的军队才能保障我们的生存。", avatarUrl: this.mapAvatar("tyler") }
        ],
        condition: { minYear: 15, epoch: "CRISIS", minPopulation: 100 },
        choices: [
          { label: "以军事为优先", effects: [{ type: "flag", target: "military_first", value: 1 }, { type: "resource", target: "military", value: 5 }, { type: "resource", target: "culture", value: -10 }] },
          { label: "科技与文化并重", effects: [{ type: "flag", target: "balanced_approach", value: 1 }, { type: "resource", target: "culture", value: 15 }, { type: "resource", target: "prestige", value: 10 }] }
        ],
        cooldownYears: 18
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
        ],
        cooldownYears: 22
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
        ],
        cooldownYears: 12
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
        ],
        cooldownYears: 16
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
        ],
        cooldownYears: 30
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
        ],
        cooldownYears: 25
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
        ],
        cooldownYears: 20
      },
      {
        id: "dimensional_threat_alert",
        title: "维度打击警报",
        tip: "深空探测器发现异常空间曲率波动——这可能意味着二向箔攻击正在逼近。",
        dialogQueue: [
          { speakerName: "林云", content: "空间曲率读数异常，长官。这不是自然现象。", avatarUrl: this.mapAvatar("linyun") },
          { speakerName: "关一帆", content: "这就是传说中的降维打击...我们必须离开这个星系。", avatarUrl: this.mapAvatar("guanyifan") }
        ],
        condition: { minYear: 180, epoch: "BUNKER", reqNotFlag: "dimensional_alert_seen" },
        choices: [
          { label: "启动紧急撤离预案", effects: [{ type: "flag", target: "dimensional_alert_seen", value: 1 }, { type: "resource", target: "economy", value: -60 }, { type: "resource", target: "prestige", value: 15 }] },
          { label: "加强掩体防御工事", effects: [{ type: "flag", target: "dimensional_alert_seen", value: 1 }, { type: "resource", target: "military", value: 8 }, { type: "resource", target: "prestige", value: -10 }] }
        ],
        cooldownYears: 30
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
        ],
        cooldownYears: 35
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
        ],
        cooldownYears: 40
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
        ],
        cooldownYears: 40
      },
      {
        id: "inner_conflict_resolution",
        title: "文明内讧危机",
        tip: "长期的星际航行导致了社会分裂，舰队内部出现了两个对立的派系。",
        dialogQueue: [
          { speakerName: "褚岩", content: "我们已经不是地球人类了，应该有新的规则。", avatarUrl: this.mapAvatar("default") },
          { speakerName: "庄颜", content: "但我们的根永远在那里。分崩离析只会毁灭我们自己。", avatarUrl: this.mapAvatar("zhuangyan") }
        ],
        condition: { minYear: 160, epoch: "BROADCAST", minCulture: 40 },
        choices: [
          { label: "武力镇压分裂势力", effects: [{ type: "resource", target: "treachery", value: -15 }, { type: "resource", target: "military", value: 3 }, { type: "resource", target: "prestige", value: -15 }] },
          { label: "召开全民公决大会", effects: [{ type: "resource", target: "treachery", value: -5 }, { type: "resource", target: "culture", value: 25 }, { type: "resource", target: "prestige", value: 10 }] }
        ],
        cooldownYears: 20
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
        ],
        cooldownYears: 50
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
      const epochNames = ["CRISIS", "DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"];
      targetStr = epochNames[targetEpoch] || "";
    } else {
      targetStr = targetEpoch;
    }

    if (targetStr === currentEpoch) return true;

    // WANDERING corresponds to late-game eras: BROADCAST, BUNKER, or GALAXY
    if (targetStr === "WANDERING") {
      return currentEpoch === "BROADCAST" || currentEpoch === "BUNKER" || currentEpoch === "GALAXY";
    }

    // SHELTER corresponds to the Bunker Era (BUNKER)
    if (targetStr === "SHELTER") {
      return currentEpoch === "BUNKER";
    }

    return false;
  }

  private checkFilterConditions(cond: any): boolean {
    const game = GameInstance.get();
    const e = game.earthCivi;
    const epochNames = ["CRISIS", "DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"];
    const currentEpoch = epochNames[game.epoch];

    if (cond.minYear !== undefined && game.year < cond.minYear) return false;
    if (cond.maxYear !== undefined && game.year > cond.maxYear) return false;
    if (cond.epoch && !this.isEpochMatch(cond.epoch, currentEpoch)) return false;
    if (cond.reqTech && !this.isTecFinishedInAnyTree(cond.reqTech)) return false;
    if (cond.reqFlag && !game.hasFlag(cond.reqFlag)) return false;
    if (cond.reqNotFlag && game.hasFlag(cond.reqNotFlag)) return false;
    if (cond.minEconomy !== undefined && e.economy < cond.minEconomy) return false;
    if (cond.minPopulation !== undefined && e.population < cond.minPopulation) return false;
    if (cond.minCulture !== undefined && e.culture < cond.minCulture) return false;
    if (cond.minDeterrence !== undefined && e.deterrenceValue < cond.minDeterrence) return false;
    if (cond.maxTreachery !== undefined && e.treachery > cond.maxTreachery) return false;

    if (cond.probability && Math.random() > cond.probability) return false;

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

  private parseEventData(dataList: any): GameEvent[] {
    const events: GameEvent[] = [];
    if (!dataList || !Array.isArray(dataList)) return events;

    dataList.forEach((data: any) => {
      let dialogNodes: DialogNode[] = [];

      if (data.dialogQueue) {
        dialogNodes = data.dialogQueue.map((node: any) => ({
          speakerName: node.speakerName,
          content: node.content,
          avatarUrl: this.mapAvatar(node.avatarUrl)
        }));
      } else {
        const talkCount = data.talkcount || 1;
        for (let i = 0; i < talkCount; i++) {
          const speaker = data[`talk${i}_talker`];
          const content = data[`talk${i}_content`];
          const pic = data[`talk${i}_pic`];

          if (speaker && content) {
            dialogNodes.push({
              speakerName: speaker,
              content: content,
              avatarUrl: this.mapAvatar(pic)
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
    const triggered: GameEvent[] = [];
    this.events.forEach(e => {
      if (!e.hasTriggered && e.inYear === currentYear) {
        e.hasTriggered = true;
        triggered.push(e);
      }
    });
    return triggered;
  }

  public checkRandomEvents(): GameEvent | null {
    const game = GameInstance.get();
    const currentEpoch = game.epoch;
    const epochNames = ["CRISIS", "DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"];
    let epochName = epochNames[currentEpoch];

    const pool = [...this.randomEvents].sort(() => Math.random() - 0.5);

    for (const e of pool) {
      const prob = e.triggerCondition?.probability ?? 0.4;
      if (Math.random() > prob) continue;

      if (e.triggerCondition?.epoch && !this.isEpochMatch(e.triggerCondition.epoch, epochName)) {
        continue;
      }

      if (e.triggerCondition?.reqTech) {
        if (!game.earthCivi.tecTreeManager.isTecFinishedAnywhere(e.triggerCondition.reqTech)) {
          continue;
        }
      }

      return e;
    }

    return null;
  }
}


