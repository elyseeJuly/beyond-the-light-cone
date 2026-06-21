import { TecTree } from "./TecTree";
import { TecTreeType } from "../types/enums";

export class TecTreeManager {
  public trees: Map<TecTreeType, TecTree> = new Map();

  constructor() {
    this.init();
  }

  public init(): void {
    this.buildPhysicsTree();
    this.buildAerospaceTree();
    this.buildMilitaryTree();
    this.buildInformationTree();
    this.buildInterstellarTree();
  }

  private buildPhysicsTree(): void {
    const tree = new TecTree(TecTreeType.PHYSICS);

    tree.addNode("", "天文观测", false, 60, 10, "基础天文探测能力。");
    tree.addNode("天文观测", "50光年远镜", false, 100, 50, "观测范围扩展至50光年。");
    tree.addNode("50光年远镜", "1万光年远镜", false, 200, 100, "观测范围扩展至1万光年。");
    tree.addNode("1万光年远镜", "银河系远镜", false, 300, 150, "观测范围覆盖银河系。");
    tree.addNode("天文观测", "太阳波放大器50光年", false, 100, 20, "主动探测50光年星系。");
    tree.addNode("太阳波放大器50光年", "太阳波放大器1万光年", false, 200, 50, "主动探测1万光年星系。");
    tree.addNode("太阳波放大器1万光年", "太阳波放大器银河系", false, 300, 100, "主动探测银河系星系。");

    tree.addNode("", "粒子对撞实验", false, 80, 20, "开启粒子物理研究。");
    tree.addNode("粒子对撞实验", "质子3维展开", false, 150, 50, "了解智子基本结构。");
    tree.addNode("粒子对撞实验", "反物质实验", false, 200, 100, "反物质基础研究。");
    tree.addNode("反物质实验", "反物质弹", false, 300, 500, "制造反物质弹，可摧毁星球。");
    tree.addNode("质子3维展开", "质子6维展开", false, 180, 80, "深入理解质子高维结构。");
    tree.addNode("质子6维展开", "质子9维展开", false, 230, 150, "接近智子技术核心。");
    tree.addNode("质子6维展开", "智子工程", false, 250, 170, "制造智子，可反制封锁。");
    tree.addNode("质子9维展开", "质子11维展开", false, 300, 200, "完全掌握质子技术。");
    tree.addNode("质子3维展开", "强相互作用力材料", false, 200, 120, "开发超级材料，建造行星发动机前提。");
    tree.addNode("强相互作用力材料", "行星发动机基础", false, 250, 150, "行星发动机理论验证。");

    tree.addNode("", "维度物理", false, 150, 80, "空间维度理论研究。");
    tree.addNode("维度物理", "曲率驱动理论", false, 350, 300, "光速飞船前置理论。");
    tree.addNode("曲率驱动理论", "光速飞船原型", false, 500, 400, "建造第一艘光速飞船。");
    tree.addNode("维度物理", "二向箔防御学", false, 400, 350, "防御降维打击。");

    this.trees.set(TecTreeType.PHYSICS, tree);
  }

  private buildAerospaceTree(): void {
    const tree = new TecTree(TecTreeType.AEROSPACE);

    tree.addNode("", "化学推进", false, 60, 10, "基础航天推进技术。");
    tree.addNode("化学推进", "10%光速飞船", false, 100, 30, "可探索50光年星域。");
    tree.addNode("10%光速飞船", "50%光速飞船", false, 150, 50, "可探索1万光年星域。");
    tree.addNode("50%光速飞船", "99%光速飞船", false, 230, 100, "可探索银河系星域。");
    tree.addNode("99%光速飞船", "光速飞船", false, 500, 400, "真正光速航行。");
    tree.addNode("化学推进", "太空电梯", false, 150, 80, "星际建设成本降低30%。");
    tree.addNode("太空电梯", "轨道空间站", false, 200, 120, "大型武器建造时间减半。");
    tree.addNode("轨道空间站", "太空船坞", false, 300, 200, "可建造星际方舟等超级单位。");
    tree.addNode("太空电梯", "地月转运系统", false, 180, 100, "月球基地效率翻倍。");

    tree.addNode("", "核聚变推进", false, 120, 50, "利用核聚变进行星际航行。");
    tree.addNode("核聚变推进", "重元素聚变", false, 200, 120, "更高效的能量来源。");
    tree.addNode("重元素聚变", "行星发动机Ⅰ型", false, 250, 150, "工厂产出提升500%。");
    tree.addNode("行星发动机Ⅰ型", "行星发动机Ⅱ型", false, 300, 200, "推力提升50%。");
    tree.addNode("行星发动机Ⅱ型", "行星发动机Ⅲ型", false, 400, 300, "推力再提升100%，满足流浪条件。");
    tree.addNode("行星发动机Ⅰ型", "转向发动机", false, 200, 120, "地球可改变轨道方向。");
    tree.addNode("重元素聚变", "星际方舟", false, 350, 250, "建造大型星际殖民船。");
    tree.addNode("核聚变推进", "月球发动机", false, 180, 100, "月球可脱离地球轨道。");
    tree.addNode("月球发动机", "月球推离系统", false, 250, 150, "将月球完全推离。");

    tree.addNode("", "行星工程", false, 80, 30, "行星级别工程建设基础。");
    tree.addNode("行星工程", "地下城Ⅰ", false, 100, 50, "人口容量+200。");
    tree.addNode("地下城Ⅰ", "地下城Ⅱ", false, 150, 80, "人口容量+500。");
    tree.addNode("地下城Ⅱ", "地下城Ⅲ", false, 200, 120, "人口容量+1000。");
    tree.addNode("地下城Ⅰ", "地下城农业系统", false, 120, 60, "每回合额外获得经济+20。");
    tree.addNode("行星工程", "地表冷却防护", false, 150, 80, "抵御太阳氦闪的极端高温。");

    tree.addNode("", "星矿Ⅰ", false, 100, 20, "采矿效率提升。");
    tree.addNode("星矿Ⅰ", "星矿Ⅱ", false, 120, 50, "采矿效率大幅提升。");
    tree.addNode("星矿Ⅱ", "星矿Ⅲ", false, 150, 80, "采矿效率最大值。");

    tree.addNode("", "星厂Ⅰ", false, 100, 20, "工厂经济产出提升。");
    tree.addNode("星厂Ⅰ", "星厂Ⅱ", false, 120, 50, "工厂经济大幅提升。");
    tree.addNode("星厂Ⅱ", "星厂Ⅲ", false, 150, 80, "工厂经济产出最大值。");

    tree.addNode("", "殖民城Ⅰ", false, 100, 20, "人口增长率提升。");
    tree.addNode("殖民城Ⅰ", "殖民城Ⅱ", false, 120, 50, "人口大幅增长。");
    tree.addNode("殖民城Ⅱ", "殖民城Ⅲ", false, 150, 80, "人口增长率最大值。");

    this.trees.set(TecTreeType.AEROSPACE, tree);
  }

  private buildMilitaryTree(): void {
    const tree = new TecTree(TecTreeType.MILITARY);

    tree.addNode("", "小行星级氢弹", false, 100, 30, "初步核打击能力。");
    tree.addNode("小行星级氢弹", "行星级氢弹", false, 180, 60, "可摧毁行星的核武器。");
    tree.addNode("行星级氢弹", "恒星级氢弹", false, 250, 120, "可摧毁恒星的终极核武器。");

    tree.addNode("", "宏原子聚变", false, 100, 10, "宏原子武器基础理论。");
    tree.addNode("宏原子聚变", "球状闪电", false, 300, 150, "新型量子态武器。");
    tree.addNode("球状闪电", "宏化部队", false, 500, 200, "宏原子量子态士兵部队。");

    tree.addNode("", "黑暗森林威慑", false, 150, 80, "理解黑暗森林理论。");
    tree.addNode("黑暗森林威慑", "天体社会学Ⅰ", false, 100, 30, "宇宙文明分析方法。");
    tree.addNode("天体社会学Ⅰ", "引力波广播系统", false, 300, 200, "解锁执剑人机制。");
    tree.addNode("引力波广播系统", "万有引力号", false, 400, 300, "终极宇宙战舰。");
    tree.addNode("天体社会学Ⅰ", "黑暗森林打击", false, 350, 250, "可广播指定文明坐标。");

    tree.addNode("", "降维打击", false, 400, 300, "空间维度武器基础。");
    tree.addNode("降维打击", "二向箔武器化", false, 500, 500, "终极二向箔打击能力。");

    this.trees.set(TecTreeType.MILITARY, tree);
  }

  private buildInformationTree(): void {
    const tree = new TecTree(TecTreeType.INFORMATION);

    tree.addNode("", "思想钢印Ⅰ", false, 100, 30, "文化增长权重提升至3。");
    tree.addNode("思想钢印Ⅰ", "思想钢印Ⅱ", false, 200, 70, "文化增长权重提升至4。");
    tree.addNode("思想钢印Ⅱ", "思想钢印Ⅲ", false, 300, 140, "文化增长权重提升至5。");

    tree.addNode("", "数字文明", false, 120, 60, "数字生命研究前提。");
    tree.addNode("数字文明", "数字生命研究", false, 180, 100, "理解数字生命概念。");
    tree.addNode("数字生命研究", "意识上传", false, 250, 150, "人口不再因灾害下降。");
    tree.addNode("意识上传", "数字复活", false, 200, 120, "角色可复活。");
    tree.addNode("意识上传", "550W量子计算机", false, 350, 250, "可对抗智子封锁。");
    tree.addNode("550W量子计算机", "全域AI监控网", false, 200, 150, "自动侦察所有已知星球。");
    tree.addNode("550W量子计算机", "MOSS协议", false, 300, 200, "被攻击额外减伤20%。");
    tree.addNode("意识上传", "数字方舟", false, 400, 350, "触发数字永生胜利。");
    tree.addNode("数字文明", "量子通信", false, 200, 120, "超光速信息传输。");
    tree.addNode("量子通信", "超光速通信", false, 300, 200, "与最远星域即时联络。");

    tree.addNode("", "面壁者心理学", false, 150, 80, "解锁面壁者系统。");
    tree.addNode("", "冬眠技术", false, 120, 60, "角色可休眠等待未来。");

    this.trees.set(TecTreeType.INFORMATION, tree);
  }

  private buildInterstellarTree(): void {
    const tree = new TecTree(TecTreeType.INTERSTELLAR);

    tree.addNode("", "宇宙社会学", false, 150, 80, "理解宇宙文明基本规律。");
    tree.addNode("宇宙社会学", "猜疑链理论", false, 200, 120, "用于外交谈判。");
    tree.addNode("猜疑链理论", "技术爆炸预判", false, 250, 150, "预判文明科技发展。");
    tree.addNode("技术爆炸预判", "宇宙文明图谱", false, 300, 200, "自动显示所有文明详细信息。");
    tree.addNode("宇宙社会学", "安全声明理论", false, 300, 200, "黑域生成前提。");
    tree.addNode("安全声明理论", "黑域生成", false, 500, 500, "发布宇宙安全声明，达成黑域胜利。");
    tree.addNode("宇宙社会学", "宇宙道德学", false, 250, 150, "星际外交理论基础。");
    tree.addNode("宇宙道德学", "银河共同体", false, 400, 350, "达成外交胜利。");

    tree.addNode("", "流浪地球计划", false, 200, 150, "推动地球流浪的基本方案。");
    tree.addNode("流浪地球计划", "新家园选址", false, 300, 200, "触发流浪胜利。");

    tree.addNode("", "归零者研究", false, 350, 250, "研究归零者文明。");
    tree.addNode("归零者研究", "宇宙重启理论", false, 500, 400, "隐藏结局。");

    this.trees.set(TecTreeType.INTERSTELLAR, tree);
  }

  public isTecFinished(type: TecTreeType, name: string): boolean {
    const tree = this.trees.get(type);
    if (!tree) return false;
    return tree.isFinished(name);
  }

  public isTecFinishedAnywhere(name: string): boolean {
    for (const tree of this.trees.values()) {
      if (tree.isFinished(name)) return true;
    }
    return false;
  }
}
