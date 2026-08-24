import { Person, createEmptyPerson } from "./Person";
import personsData from "../data/persons.json";
import { t } from "../utils/i18n";

export class PersonManager {
  public persons: Map<string, Person> = new Map();
  /**
   * 本局已经进入叙事资格的人物。它与 availablePersons 不同：
   * availablePersons 只表示当前尚未被部门/舰队等系统占用的自由人，
   * 而人物即使被任命，也仍然应该可以作为剧情事件的发言者。
   */
  public unlockedPersons: Set<string> = new Set();
  public availablePersons: Set<string> = new Set();
  
  constructor() {
    this.init();
  }

  public init(): void {
    personsData.forEach((data: any) => {
      const p = createEmptyPerson(data.name);
      p.faceFile = data.faceFile || "";
      p.treachery = data.treachery ?? 0;
      p.science = data.science ?? 0;
      p.art = data.art ?? 0;
      p.economy = data.economy ?? 0;
      p.army = data.army ?? 0;
      p.leadership = data.leadership ?? 0;
      p.social = data.social ?? 0;
      
      // 开局人物必须覆盖“首个可触发事件”的发言者。
      // 杨冬的危机开场事件和智子的面壁计划宣告分别负责死亡记录与
      // 罗辑等核心人物解锁；若把他们锁在事件资格检查之外，主线会形成
      // “事件解锁人物，但事件又要求人物先解锁”的循环门控。
      const initialWhitelist = [
        t("丁仪"), t("汪淼"), t("常伟思"), t("大史"), t("雷志成"),
        t("杨卫宁"), t("叶文洁"), t("杨冬"), t("智子")
      ];
      this.persons.set(p.name, p);
      if (initialWhitelist.includes(p.name)) {
        this.unlockedPersons.add(p.name);
        this.availablePersons.add(p.name);
      }
    });
  }

  public unlockPerson(name: string): void {
    if (!this.persons.has(name)) return;
    this.unlockedPersons.add(name);
    if (!this.availablePersons.has(name)) this.availablePersons.add(name);
    // Let Game instance add a history log or toast if possible, handled externally
  }

  public isUnlocked(name: string): boolean {
    return this.unlockedPersons.has(name);
  }

  public getPerson(name: string): Person | undefined {
    return this.persons.get(name);
  }

  public getAllPersons(): Person[] {
    return Array.from(this.persons.values());
  }
}
