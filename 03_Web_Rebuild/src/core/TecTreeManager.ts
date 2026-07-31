import { TecTree } from "./TecTree";
import { TecTreeType } from "../types/enums";
import { t } from "../utils/i18n";

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

    tree.addNode("", t("天文观测"), false, 60, 10, t("基础天文探测能力。"));
    tree.addNode(t("天文观测"), t("50光年远镜"), false, 100, 50, t("观测范围扩展至50光年。"));
    tree.addNode(t("50光年远镜"), t("1万光年远镜"), false, 200, 100, t("观测范围扩展至1万光年。"));
    tree.addNode(t("1万光年远镜"), t("银河系远镜"), false, 300, 150, t("观测范围覆盖银河系。"));
    tree.addNode(t("天文观测"), t("太阳波放大器50光年"), false, 100, 20, t("主动探测50光年星系。"));
    tree.addNode(t("太阳波放大器50光年"), t("太阳波放大器1万光年"), false, 200, 50, t("主动探测1万光年星系。"));
    tree.addNode(t("太阳波放大器1万光年"), t("太阳波放大器银河系"), false, 300, 100, t("主动探测银河系星系。"));

    tree.addNode("", t("粒子对撞实验"), false, 80, 20, t("开启粒子物理研究。"));
    tree.addNode(t("粒子对撞实验"), t("质子3维展开"), false, 150, 50, t("了解智子基本结构。"));
    tree.addNode(t("粒子对撞实验"), t("反物质实验"), false, 200, 100, t("反物质基础研究。"));
    tree.addNode(t("反物质实验"), t("反物质弹"), false, 300, 500, t("制造反物质弹，可摧毁星球。"));
    tree.addNode(t("质子3维展开"), t("质子6维展开"), false, 180, 80, t("深入理解质子高维结构。"));
    tree.addNode(t("质子6维展开"), t("质子9维展开"), false, 230, 150, t("接近智子技术核心。"));
    tree.addNode(t("质子6维展开"), t("智子工程"), false, 250, 170, t("制造智子，可反制封锁。"));
    tree.addNode(t("质子9维展开"), t("质子11维展开"), false, 300, 200, t("完全掌握质子技术。"));
    tree.addNode(t("质子3维展开"), t("强相互作用力材料"), false, 200, 120, t("开发超级材料，建造行星发动机前提。"));
    tree.addNode(t("强相互作用力材料"), t("行星发动机基础"), false, 250, 150, t("行星发动机理论验证。"));

    tree.addNode("", t("维度物理"), false, 150, 80, t("空间维度理论研究。"));
    tree.addNode(t("维度物理"), t("曲率驱动理论"), false, 350, 300, t("光速飞船前置理论。"));
    tree.addNode(t("曲率驱动理论"), t("光速飞船原型"), false, 500, 400, t("建造第一艘光速飞船。"));
    tree.addNode(t("维度物理"), t("二向箔防御学"), false, 400, 350, t("防御降维打击。"));

    this.trees.set(TecTreeType.PHYSICS, tree);
  }

  private buildAerospaceTree(): void {
    const tree = new TecTree(TecTreeType.AEROSPACE);

    tree.addNode("", t("化学推进"), false, 60, 10, t("基础航天推进技术。"));
    tree.addNode(t("化学推进"), t("10%光速飞船"), false, 100, 30, t("可探索50光年星域。"));
    tree.addNode(t("10%光速飞船"), t("50%光速飞船"), false, 150, 50, t("可探索1万光年星域。"));
    tree.addNode(t("50%光速飞船"), t("99%光速飞船"), false, 230, 100, t("可探索银河系星域。"));
    tree.addNode(t("99%光速飞船"), t("光速飞船"), false, 500, 400, t("真正光速航行。"));
    tree.addNode(t("化学推进"), t("太空电梯"), false, 150, 80, t("星际建设成本降低30%。"));
    tree.addNode(t("太空电梯"), t("轨道空间站"), false, 200, 120, t("大型武器建造时间减半。"));
    tree.addNode(t("轨道空间站"), t("太空船坞"), false, 300, 200, t("可建造星际方舟等超级单位。"));
    tree.addNode(t("太空电梯"), t("地月转运系统"), false, 180, 100, t("月球基地效率翻倍。"));

    tree.addNode("", t("核聚变推进"), false, 120, 50, t("利用核聚变进行星际航行。"));
    tree.addNode(t("核聚变推进"), t("重元素聚变"), false, 200, 120, t("更高效的能量来源。"));
    tree.addNode(t("重元素聚变"), t("行星发动机Ⅰ型"), false, 250, 150, t("工厂产出提升500%。"));
    tree.addNode(t("行星发动机Ⅰ型"), t("行星发动机Ⅱ型"), false, 300, 200, t("推力提升50%。"));
    tree.addNode(t("行星发动机Ⅱ型"), t("行星发动机Ⅲ型"), false, 400, 300, t("推力再提升100%，满足流浪条件。"));
    tree.addNode(t("行星发动机Ⅰ型"), t("转向发动机"), false, 200, 120, t("地球可改变轨道方向。"));
    tree.addNode(t("重元素聚变"), t("星际方舟"), false, 350, 250, t("建造大型星际殖民船。"));
    tree.addNode(t("核聚变推进"), t("月球发动机"), false, 180, 100, t("月球可脱离地球轨道。"));
    tree.addNode(t("月球发动机"), t("月球推离系统"), false, 250, 150, t("将月球完全推离。"));

    tree.addNode("", t("行星工程"), false, 80, 30, t("行星级别工程建设基础。"));
    tree.addNode(t("行星工程"), t("地下城Ⅰ"), false, 100, 50, t("人口容量+200。"));
    tree.addNode(t("地下城Ⅰ"), t("地下城Ⅱ"), false, 150, 80, t("人口容量+500。"));
    tree.addNode(t("地下城Ⅱ"), t("地下城Ⅲ"), false, 200, 120, t("人口容量+1000。"));
    tree.addNode(t("地下城Ⅰ"), t("地下城农业系统"), false, 120, 60, t("每回合额外获得经济+20。"));
    tree.addNode(t("行星工程"), t("地表冷却防护"), false, 150, 80, t("抵御太阳氦闪的极端高温。"));

    tree.addNode("", t("星矿Ⅰ"), false, 100, 20, t("采矿效率提升。"));
    tree.addNode(t("星矿Ⅰ"), t("星矿Ⅱ"), false, 120, 50, t("采矿效率大幅提升。"));
    tree.addNode(t("星矿Ⅱ"), t("星矿Ⅲ"), false, 150, 80, t("采矿效率最大值。"));

    tree.addNode("", t("星厂Ⅰ"), false, 100, 20, t("工厂经济产出提升。"));
    tree.addNode(t("星厂Ⅰ"), t("星厂Ⅱ"), false, 120, 50, t("工厂经济大幅提升。"));
    tree.addNode(t("星厂Ⅱ"), t("星厂Ⅲ"), false, 150, 80, t("工厂经济产出最大值。"));

    tree.addNode("", t("殖民城Ⅰ"), false, 100, 20, t("人口增长率提升。"));
    tree.addNode(t("殖民城Ⅰ"), t("殖民城Ⅱ"), false, 120, 50, t("人口大幅增长。"));
    tree.addNode(t("殖民城Ⅱ"), t("殖民城Ⅲ"), false, 150, 80, t("人口增长率最大值。"));

    this.trees.set(TecTreeType.AEROSPACE, tree);
  }

  private buildMilitaryTree(): void {
    const tree = new TecTree(TecTreeType.MILITARY);

    tree.addNode("", t("小行星级氢弹"), false, 100, 30, t("初步核打击能力。"));
    tree.addNode(t("小行星级氢弹"), t("行星级氢弹"), false, 180, 60, t("可摧毁行星的核武器。"));
    tree.addNode(t("行星级氢弹"), t("恒星级氢弹"), false, 250, 120, t("可摧毁恒星的终极核武器。"));

    tree.addNode("", t("宏原子聚变"), false, 100, 10, t("宏原子武器基础理论。"));
    tree.addNode(t("宏原子聚变"), t("球状闪电"), false, 300, 150, t("新型量子态武器。"));
    tree.addNode(t("球状闪电"), t("宏化部队"), false, 500, 200, t("宏原子量子态士兵部队。"));

    tree.addNode("", t("黑暗森林威慑"), false, 150, 80, t("理解黑暗森林理论。"));
    tree.addNode(t("黑暗森林威慑"), t("天体社会学Ⅰ"), false, 100, 30, t("宇宙文明分析方法。"));
    tree.addNode(t("天体社会学Ⅰ"), t("引力波广播系统"), false, 300, 200, t("解锁执剑人机制。"));
    tree.addNode(t("引力波广播系统"), t("万有引力号"), false, 400, 300, t("终极宇宙战舰。"));
    tree.addNode(t("天体社会学Ⅰ"), t("黑暗森林打击"), false, 350, 250, t("可广播指定文明坐标。"));

    tree.addNode("", t("降维打击"), false, 400, 300, t("空间维度武器基础。"));
    tree.addNode(t("降维打击"), t("二向箔武器化"), false, 500, 500, t("终极二向箔打击能力。"));

    this.trees.set(TecTreeType.MILITARY, tree);
  }

  private buildInformationTree(): void {
    const tree = new TecTree(TecTreeType.INFORMATION);

    tree.addNode("", t("思想钢印Ⅰ"), false, 100, 30, t("文化增长权重提升至3。"));
    tree.addNode(t("思想钢印Ⅰ"), t("思想钢印Ⅱ"), false, 200, 70, t("文化增长权重提升至4。"));
    tree.addNode(t("思想钢印Ⅱ"), t("思想钢印Ⅲ"), false, 300, 140, t("文化增长权重提升至5。"));

    tree.addNode("", t("数字文明"), false, 120, 60, t("数字生命研究前提。"));
    tree.addNode(t("数字文明"), t("数字生命研究"), false, 180, 100, t("理解数字生命概念。"));
    tree.addNode(t("数字生命研究"), t("意识上传"), false, 250, 150, t("人口不再因灾害下降。"));
    tree.addNode(t("意识上传"), t("数字复活"), false, 200, 120, t("角色可复活。"));
    tree.addNode(t("意识上传"), t("550W量子计算机"), false, 350, 250, t("可对抗智子封锁。"));
    tree.addNode(t("550W量子计算机"), t("全域AI监控网"), false, 200, 150, t("自动侦察所有已知星球。"));
    tree.addNode(t("550W量子计算机"), t("MOSS协议"), false, 300, 200, t("被攻击额外减伤20%。"));
    tree.addNode(t("意识上传"), t("数字方舟"), false, 400, 350, t("触发数字永生胜利。"));
    tree.addNode(t("数字文明"), t("量子通信"), false, 200, 120, t("超光速信息传输。"));
    tree.addNode(t("量子通信"), t("超光速通信"), false, 300, 200, t("与最远星域即时联络。"));

    tree.addNode("", t("面壁者心理学"), false, 150, 80, t("解锁面壁者系统。"));
    tree.addNode("", t("冬眠技术"), false, 120, 60, t("角色可休眠等待未来。"));

    this.trees.set(TecTreeType.INFORMATION, tree);
  }

  private buildInterstellarTree(): void {
    const tree = new TecTree(TecTreeType.INTERSTELLAR);

    tree.addNode("", t("宇宙社会学"), false, 150, 80, t("理解宇宙文明基本规律。"));
    tree.addNode(t("宇宙社会学"), t("猜疑链理论"), false, 200, 120, t("用于外交谈判。"));
    tree.addNode(t("猜疑链理论"), t("技术爆炸预判"), false, 250, 150, t("预判文明科技发展。"));
    tree.addNode(t("技术爆炸预判"), t("宇宙文明图谱"), false, 300, 200, t("自动显示所有文明详细信息。"));
    tree.addNode(t("宇宙社会学"), t("安全声明理论"), false, 300, 200, t("黑域生成前提。"));
    tree.addNode(t("安全声明理论"), t("黑域生成"), false, 500, 500, t("发布宇宙安全声明，达成黑域胜利。"));
    tree.addNode(t("宇宙社会学"), t("宇宙道德学"), false, 250, 150, t("星际外交理论基础。"));
    tree.addNode(t("宇宙道德学"), t("银河共同体"), false, 400, 350, t("达成外交胜利。"));

    tree.addNode("", t("流浪地球计划"), false, 200, 150, t("推动地球流浪的基本方案。"));
    tree.addNode(t("流浪地球计划"), t("新家园选址"), false, 300, 200, t("触发流浪胜利。"));

    tree.addNode("", t("归零者研究"), false, 350, 250, t("研究归零者文明。"));
    tree.addNode(t("归零者研究"), t("宇宙重启理论"), false, 500, 400, t("隐藏结局。"));

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

  /**
   * 为指定科技节点增加研究进度。若节点已完成或前置节点未完成则返回 false。
   * 进度达到总工作量时自动标记为完成。
   */
  public addProgress(treeType: TecTreeType, nodeName: string, amount: number): boolean {
    const tree = this.trees.get(treeType);
    if (!tree) return false;
    const node = tree.nodes.get(nodeName);
    if (!node || node.finished) return false;

    const parentFinished = !node.parentName || tree.isFinished(node.parentName);
    if (!parentFinished) return false;

    if (!node.inResearch) {
      node.inResearch = true;
    }

    node.currentWorkload = Math.min(node.totalWorkload, node.currentWorkload + Math.max(0, amount));
    if (node.currentWorkload >= node.totalWorkload) {
      node.currentWorkload = node.totalWorkload;
      node.finished = true;
      node.inResearch = false;
      return true;
    }
    return false;
  }
}
