import { Person, createEmptyPerson } from "./Person";
import personsData from "../data/persons.json";

export class PersonManager {
  public persons: Map<string, Person> = new Map();
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
      
      const initialWhitelist = ["丁仪", "汪淼", "常伟思", "大史", "雷志成", "杨卫宁", "叶文洁"];
      this.persons.set(p.name, p);
      if (initialWhitelist.includes(p.name)) {
        this.availablePersons.add(p.name);
      }
    });
  }

  public unlockPerson(name: string): void {
    if (this.persons.has(name) && !this.availablePersons.has(name)) {
      this.availablePersons.add(name);
      // Let Game instance add a history log or toast if possible, handled externally
    }
  }

  public getPerson(name: string): Person | undefined {
    return this.persons.get(name);
  }

  public getAllPersons(): Person[] {
    return Array.from(this.persons.values());
  }
}
