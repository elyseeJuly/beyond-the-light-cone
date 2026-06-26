/**
 * SliceNarrativeEngine - 切片叙事引擎 (UEE Layer 7)
 *
 * 将宏观事件通过"小人物"视角具象化，提升沉浸感。
 * 每个宏观事件可以关联多个切片叙事，展示不同视角。
 *
 * 设计原则：
 * - 切片叙事不改变游戏状态（纯叙事内容）
 * - 每个切片的角色为虚构小人物（不占用角色解锁资源）
 * - 可基于 Tag 自动生成切片
 */

export interface SliceNarrative {
  eventId: string;          // 关联的宏观事件ID
  characterName: string;    // 虚构小人物姓名
  characterRole: string;    // 社会角色（"地下城厨师"、"星舰工程师"等）
  scene: string;            // 场景描述
  innerMonologue: string;   // 内心独白
  impact: string;           // 事件对小人物生活的影响
}

interface MonologueTemplate {
  innerMonologue: string;
  action: string;
  dataState?: string;
  theme: string;
}

// 小人物名字池（虚构，包括两字、三字中文名以及外国译名，不占角色解锁资源）
const NPC_NAMES = [
  // 中文名 (双字 & 三字)
  "张伟", "王芳", "李强", "赵丽", "陈明", "刘洋", "周杰", "吴敏", "林静",
  "张建国", "李慕华", "陈思睿", "王景和", "刘立人", "赵秀兰", "孙志远", "钱淑芬",
  "周泽宇", "吴欣怡", "郑少华",
  // 国际姓名 (译名)
  "约翰", "艾米丽", "索菲亚", "卡尔", "安娜", "大卫", "汉斯", "阿列克谢", "埃琳娜",
  "辛格", "田中", "法蒂玛", "穆罕默德", "路易", "安东尼奥", "李梅", "山本", "伊万"
];

const NPC_ROLES = [
  "地下城配给管理员", "星舰维修工程师", "生态循环站技术员",
  "行星发动机操作员", "信息监测站观察员", "物资调配中心调度员",
  "社会秩序维护员", "文化档案管理员", "能源站运维工程师",
  "通讯中继站值班员",
];

const SCENE_TEMPLATES = [
  "地下城{area}区的昏暗走廊里，{role}正在{action}。",
  "{role}站在{location}的控制台前，屏幕上的数据{data_state}。",
  "在{location}的休息区，{role}与同事低声讨论着最近的{event_theme}。",
  "{role}的个人日志上记录着这样一段文字：『{monologue}』",
];

const AREAS = ["A-7", "B-12", "C-3", "D-9", "E-5", "F-1", "G-8"];

// 标签驱动的叙事配置
const TAG_NARRATIVES: Record<string, MonologueTemplate[]> = {
  population_crisis: [
    {
      innerMonologue: "「配给大厅里一天比一天冷清，好多工作岗位都空置了。人越来越少，这地下城感觉快要变成一座钢铁墓穴了……」",
      action: "看着空荡荡的通道和两旁关闭的店铺，叹了口气",
      dataState: "显示着数个区域的人口红线警报",
      theme: "人口锐减与劳动力危机"
    },
    {
      innerMonologue: "「今天看到隔壁的空房间被封锁了。曾经热热闹闹的一家人全调走了，以后可能再也见不到了吧。」",
      action: "抚摸着邻居家斑驳的合金门框",
      dataState: "数据曲线呈现出陡峭的下滑趋势",
      theme: "社区的消亡与人口危机"
    }
  ],
  civil_unrest: [
    {
      innerMonologue: "「听着外面此起彼伏的口号声，我根本没心思工作。大家都说上面隐瞒了真相，可就算知道了真相，又能怎么样呢？」",
      action: "紧了紧安全帽，听着防护闸门外隐约传来的抗议声",
      dataState: "警报红灯因外部示威活动频繁闪烁",
      theme: "街头冲突与信任危机"
    },
    {
      innerMonologue: "「巡逻队的步伐声越来越沉重。邻居因为私藏逃亡主义传单被带走了，邻里之间的信任快磨灭干净了。」",
      action: "拉下百叶窗，神色戒备地望向黑暗的走廊",
      dataState: "显示着社会治安指数持续走低",
      theme: "高压戒备与民心动荡"
    }
  ],
  resource_depleted: [
    {
      innerMonologue: "「今天的合成淀粉配给量又削减了百分之十，口感就像嚼木屑。电网也开始定时断电，温室供暖越来越难维持了。」",
      action: "分食着金属餐盘中仅有的一小块灰色蛋白块",
      dataState: "能量储备刻度已经滑入红色危险区",
      theme: "物资匮乏与生存压力"
    },
    {
      innerMonologue: "「循环水的过滤阀已经老化，出来的水里有一股浓重的锈味，但现在根本没有替换零件。大家都省着在用。」",
      action: "拿着空水杯在排队接水，面带倦容",
      dataState: "过滤效率曲线跌到了历史最低点",
      theme: "基础设施衰退与资源枯竭"
    }
  ],
  resource_surplus: [
    {
      innerMonologue: "「最新的配给公报上写着物资供应充足，今天的食堂甚至供应了久违的真正新鲜蔬菜，虽然只有一小片，但感觉像是过节。」",
      action: "品尝着餐盘里那一缕绿色，脸上浮现出久违的笑容",
      dataState: "库存容量条显示出明亮的绿色满载状态",
      theme: "物资充沛与生活水平提升"
    }
  ],
  tech_boom: [
    {
      innerMonologue: "「重核聚变技术又取得突破了！听说新式的发动机推力提升了数倍，我们终于看到了逃离智子封锁的微弱曙光。」",
      action: "兴奋地与同事指着控制板上的新参数讨论",
      dataState: "推力与能效比数值正在直线上升",
      theme: "技术飞跃与复兴希望"
    },
    {
      innerMonologue: "「看到那些全新下线的微型太空工程机，不得不佩服那些科学家。在这种封锁下，他们依然在创造奇迹。」",
      action: "为新运抵的工程机器打上批准序列号",
      dataState: "自检程序发出密集的‘成功解锁新工艺’声",
      theme: "工业升级与科技创新"
    }
  ],
  exile_sentiment: [
    {
      innerMonologue: "「这艘飞船、这个地下城……根本不可能带所有人走。逃亡主义不是背叛，它只是为了让人类这个物种有一丝活下去的火种。」",
      action: "在日志终端输入一段加密的想法",
      dataState: "星图中标记着数个遥远的逃逸扇区",
      theme: "逃亡主义思潮"
    }
  ],
  foil_imminent: [
    {
      innerMonologue: "「二向箔已经跌入太阳系了……整片三维空间都在不可逆转地向二维塌缩。我们要变成纸片了，可撤离飞船的名单上根本没有我们。」",
      action: "绝望地贴在太空城透明视窗前，注视着远处正在扁平化的天体",
      dataState: "空间维度读数正在由 3.00 疯狂跌向 2.00",
      theme: "降维打击与末日降临"
    }
  ],
  waterdrop_used: [
    {
      innerMonologue: "「水滴……那个光滑完美的死神。它只用了一撞就把联合舰队全部毁灭了。在绝对的科技代差面前，我们的骄傲是多么可笑。」",
      action: "惨白着脸看着太空中传回的舰队殉爆废墟残留信号",
      dataState: "显示着大片探测信号丢失的静默虚线",
      theme: "水滴毁灭性打击"
    }
  ],
  eto_remnant: [
    {
      innerMonologue: "「ETO 的幽灵还没有散去。网络中到处都有关于主降临的秘密布道，他们在这个绝望的时代比以往更加危险。」",
      action: "正在清理局域网底层的加密中继日志",
      dataState: "捕获到数个不明源头的异常脉冲信号",
      theme: "ETO 秘密活动"
    }
  ]
};

// 纪元驱动的叙事配置
const EPOCH_NARRATIVES: Record<string, MonologueTemplate[]> = {
  crisis_era_deep: [
    {
      innerMonologue: "「智子在看着我们，天空就像一只巨大的无形眼睛。但即使被锁死了基础物理，我们普通人也得在这钢铁地下城努力活着啊。」",
      action: "调整着地下管道的空气阀门，抹了抹汗水",
      dataState: "显示着大气的含氧量在安全值内浮动",
      theme: "智子监视与地下城生活"
    },
    {
      innerMonologue: "「面壁者们的计划听起来像神话一样疯狂。谁知道他们能不能成功呢？只要能保证我们的配给面包不断供就好。」",
      action: "整理着配给大厅里堆放的食用菌箱",
      dataState: "配给清单长长地向下滚动",
      theme: "面壁计划与平民期望"
    },
    {
      innerMonologue: "「听昨晚下哨的太空军士兵说，他们正在小行星带建设第一批永久基地。真想去看看真正的群星啊。」",
      action: "仰头看着穹顶上被磨损的模拟星空投射器",
      dataState: "雷达界面隐约能收到月球基地的信标",
      theme: "太空军建设与星空向往"
    }
  ],
  deterrence_era: [
    {
      innerMonologue: "「三体人居然在和我们进行文化交流。电视里正放着他们用智子创作的画作，这种脆弱又奇妙的和平真让人感到眩晕。」",
      action: "靠在控制台旁，百无聊赖地刷着新闻终端",
      dataState: "播放着来自引力波广播塔的静音状态测试信号",
      theme: "威慑平衡下的异样和平"
    },
    {
      innerMonologue: "「执剑者罗辑已经在那个幽暗的地堡里坐了半辈子了。他要是打个瞌睡，或者下一任按钮人手抖了，人类是不是就完了？」",
      action: "更换着发电机组 of 偏振偏置电容，心里泛起一丝疑虑",
      dataState: "显示着全球引力波发射塔处于待命状态",
      theme: "执剑者威慑的沉重阴影"
    }
  ],
  broadcast_era: [
    {
      innerMonologue: "「三体的坐标被广播出去了。黑暗森林的猎手随时都会开火，地球完蛋了，三体也完蛋了。我们能逃去哪里？」",
      action: "有些神经质地抓紧了怀里的个人数据卡",
      dataState: "监测着太阳风层边缘的不寻常波动",
      theme: "黑暗森林暴露的恐慌"
    },
    {
      innerMonologue: "「所有人都在疯狂抢购远航飞船的船票。可没有曲率驱动，常规飞船飞不出几光年就会变成铁棺材……」",
      action: "坐在空旷的操作舱里，神色木然",
      dataState: "购票网站上显示着排队人数为九位数",
      theme: "大逃亡潮与科技天花板"
    }
  ],
  bunker_era_deep: [
    {
      innerMonologue: "「躲在木星背后真的有用吗？如果打击不是光粒，而是其他的什么高维度手段呢？但在黑暗森林里，这里是唯一的掩体了。」",
      action: "在巨大的木星引力防护墙阴影下检查推进接口",
      dataState: "显示着庞大的木星磁层数据波动",
      theme: "掩体太空城的生活"
    },
    {
      innerMonologue: "「联合政府居然禁止私自研究曲率驱动。如果连逃跑的自由都被剥夺了，那呆在这漆黑的掩体世界里等死又算什么？」",
      action: "在昏暗的宿舍里偷偷阅读禁忌的物理学论文",
      dataState: "显示着违规流量警告，急忙关闭了页面",
      theme: "逃亡权之争与曲率禁令"
    }
  ],
  galaxy_era_deep: [
    {
      innerMonologue: "「在新世界的重力场下，我终于见到了没有过滤网的日光。可当我闭上眼，总会想起那个被压成二维油画的太阳系……」",
      action: "眯起眼注视着头顶陌生的恒星，微风吹拂着面颊",
      dataState: "记录着新行星表面的生态系统读数",
      theme: "银河人类的乡愁"
    }
  ],
  stardust_era_deep: [
    {
      innerMonologue: "「世界正在衰亡，甚至连黑洞都在蒸发。我们在宇宙底层的死线里挣扎，真希望能在小宇宙的避难所里撑到下一次大爆炸。」",
      action: "整理着微型密封舱最后的循环物资",
      dataState: "显示着宇宙热寂极限的倒计时读数",
      theme: "小宇宙避难与宇宙热寂"
    }
  ]
};

// 通用日常独白配置
const GENERAL_NARRATIVES: MonologueTemplate[] = [
  {
    innerMonologue: "「今天的循环食物吃起来有一股劣质香精的味道，不过在这个时代，能吃饱就已经算是一种奢侈了。」",
    action: "在配给窗口领到了两块灰色合成蛋白块",
    dataState: "显示着配给仓储余量尚在安全线以上",
    theme: "地下城平民的日常生活"
  },
  {
    innerMonologue: "「人造穹顶的仿真白云坏了几天了，现在只剩下一片刺眼的白光。希望技术部明天能修好它，哪怕换个下雨的图案也行。」",
    action: "坐在长椅上，揉了揉被仿真阳光晃得发酸的眼睛",
    dataState: "显示穹顶控制电路发生硬件级接地故障",
    theme: "人工气候环境维护"
  },
  {
    innerMonologue: "「昨晚深空广播电台又放了那首黄金时代的古老歌谣，隔壁的老人听着听着就哭了。他们见过的那个世界，我们真的能重新拥有吗？」",
    action: "将维修手记记在斑驳的触控板上，陷入了沉思",
    dataState: "接收到一段来自遥远空间站的历史音频流",
    theme: "黄金时代的回忆与渴望"
  },
  {
    innerMonologue: "「重力模拟机组最近经常有微小的颤噪，听久了那低频的嗡嗡声，反而成了地下城里最棒的助眠药。」",
    action: "正在用万用电表检测主转子的谐振频率",
    dataState: "震动传感器回传了一串规律的波形",
    theme: "日常设备维护与白噪音"
  },
  {
    innerMonologue: "「我的仙人掌居然在无土栽培槽里开出了第一朵白色的小花。在这冰冷的钢铁世界里，这一点绿色简直是奇迹。」",
    action: "用滴管小心翼翼地往植物根部滴注营养液",
    dataState: "显示植物生命体征稳定，水分充足",
    theme: "冷酷地下城中的一抹绿意"
  }
];

export class SliceNarrativeEngine {
  private slices: Map<string, SliceNarrative[]> = new Map();
  private usedNpcNames: Set<string> = new Set();

  /** 注册切片叙事 */
  registerSlice(eventId: string, slice: SliceNarrative): void {
    const existing = this.slices.get(eventId) || [];
    existing.push(slice);
    this.slices.set(eventId, existing);
  }

  /** 批量注册切片叙事 */
  registerSlices(eventId: string, slices: SliceNarrative[]): void {
    const existing = this.slices.get(eventId) || [];
    this.slices.set(eventId, [...existing, ...slices]);
  }

  /** 获取事件的切片叙事 */
  getSlices(eventId: string): SliceNarrative[] {
    return this.slices.get(eventId) || [];
  }

  /** 自动生成切片叙事 */
  generateSlice(eventId: string, eventTitle: string, tagManager: any, currentYear?: number): SliceNarrative {
    const name = this.getNextNpcName();
    const role = NPC_ROLES[Math.floor(Math.random() * NPC_ROLES.length)];
    const area = AREAS[Math.floor(Math.random() * AREAS.length)];

    let matchedTemplate: MonologueTemplate | null = null;

    // 标签时效性过滤：非里程碑标签只在应用后 30 年内产生切片叙事，避免时代错乱
    const isTagFresh = (tagId: string): boolean => {
      if (!tagManager || typeof tagManager.getTag !== 'function') return true;
      const tag = tagManager.getTag(tagId);
      if (!tag) return false;
      if (tag.isMilestone) return true;
      if (typeof currentYear !== 'number') return true;
      return currentYear - tag.firstAppliedYear <= 30;
    };

    // 1. 优先尝试从活跃的世界标签 (World Tags) 中匹配叙事
    if (tagManager && typeof tagManager.hasTag === 'function') {
      const activeTags = Object.keys(TAG_NARRATIVES).filter(tagId => tagManager.hasTag(tagId, 1) && isTagFresh(tagId));
      if (activeTags.length > 0) {
        // 随机选一个激活的标签
        const chosenTag = activeTags[Math.floor(Math.random() * activeTags.length)];
        const templates = TAG_NARRATIVES[chosenTag];
        if (templates && templates.length > 0) {
          matchedTemplate = templates[Math.floor(Math.random() * templates.length)];
        }
      }
    }

    // 2. 如果没有匹配到世界标签，尝试根据当前的纪元 (Epoch) 匹配叙事
    if (!matchedTemplate && tagManager && typeof tagManager.hasTag === 'function') {
      const activeEpochTags = Object.keys(EPOCH_NARRATIVES).filter(tagId => tagManager.hasTag(tagId, 1));
      if (activeEpochTags.length > 0) {
        const chosenEpochTag = activeEpochTags[Math.floor(Math.random() * activeEpochTags.length)];
        const templates = EPOCH_NARRATIVES[chosenEpochTag];
        if (templates && templates.length > 0) {
          matchedTemplate = templates[Math.floor(Math.random() * templates.length)];
        }
      }
    }

    // 3. 如果还是没有匹配到（例如在测试环境或极早期），从通用随机叙事池中挑选
    if (!matchedTemplate) {
      matchedTemplate = GENERAL_NARRATIVES[Math.floor(Math.random() * GENERAL_NARRATIVES.length)];
    }

    // 处理主题和独白替换
    // 如果 eventTitle 为 "年份推进"，我们使用叙事模板中预定义的主题，否则使用传入的 eventTitle
    const isYearProgress = eventTitle === "年份推进";
    const theme = isYearProgress ? matchedTemplate.theme : eventTitle;
    const finalMonologue = isYearProgress
      ? matchedTemplate.innerMonologue
      : `「${eventTitle}……这会对我们的生活造成什么影响呢？」`;

    // 替换场景模板中的占位符
    const action = matchedTemplate.action;
    const location = role.includes("星舰") || role.includes("通讯") ? "星舰" : "地下城";
    const dataState = matchedTemplate.dataState || "显示着轻微的数据波动";

    const sceneTemplate = SCENE_TEMPLATES[Math.floor(Math.random() * SCENE_TEMPLATES.length)];
    const scene = sceneTemplate
      .replace('{area}', area)
      .replace('{role}', role)
      .replace('{action}', action)
      .replace('{location}', location)
      .replace('{data_state}', dataState)
      .replace('{event_theme}', theme)
      .replace('{monologue}', finalMonologue.replace(/[「」]/g, ''));

    const slice: SliceNarrative = {
      eventId,
      characterName: name,
      characterRole: role,
      scene,
      innerMonologue: finalMonologue,
      impact: `作为一名${role}，${name}的工作节奏因为${theme}而被打乱。`,
    };

    this.registerSlice(eventId, slice);
    return slice;
  }

  /** 获取下一个可用的 NPC 名字 */
  private getNextNpcName(): string {
    const available = NPC_NAMES.filter(n => !this.usedNpcNames.has(n));
    if (available.length === 0) {
      this.usedNpcNames.clear(); // 循环使用
      return NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
    }
    const name = available[Math.floor(Math.random() * available.length)];
    this.usedNpcNames.add(name);
    return name;
  }

  /** 检查事件是否有切片叙事 */
  hasSlices(eventId: string): boolean {
    return (this.slices.get(eventId)?.length ?? 0) > 0;
  }

  toJSON(): object {
    return {
      slices: Array.from(this.slices.entries()),
      usedNpcNames: Array.from(this.usedNpcNames),
    };
  }

  static fromJSON(data: any): SliceNarrativeEngine {
    const sne = new SliceNarrativeEngine();
    if (data?.slices) {
      for (const [k, v] of data.slices) {
        sne.slices.set(k, v);
      }
    }
    if (data?.usedNpcNames) {
      sne.usedNpcNames = new Set(data.usedNpcNames);
    }
    return sne;
  }

  reset(): void {
    this.slices.clear();
    this.usedNpcNames.clear();
  }
}