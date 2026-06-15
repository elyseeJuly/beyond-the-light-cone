import { TecTreeManager } from "./TecTreeManager";
import { Fleet } from "./Fleet";
import { FriendshipType } from "../types/enums";

export class Civilization {
  public name: string = "";
  public population: number = 0;
  public culture: number = 0;
  public economy: number = 0;
  public resource: number = 0;
  public army: number = 0;
  public treachery: number = 0;
  public civiLevel: number = 0;
  public idlePopulation: number = 0;

  public starIndices: Set<number> = new Set();
  public barbackIds: Set<string> = new Set();
  public fleets: Fleet[] = [];

  public tecTreeManager: TecTreeManager;

  public friendshipType: FriendshipType = FriendshipType.NORMAL;
  public diplomacyCooldown: number = 0;
  public isBund: boolean = false;

  constructor(name: string) {
    this.name = name;
    this.tecTreeManager = new TecTreeManager();
  }

  public isDieOut(): boolean {
    return this.starIndices.size === 0;
  }

  public getCiviLevelLabel(): string {
    const levels = ["荒蛮文明", "工业文明", "星际文明", "银河文明", "超维文明"];
    return levels[Math.min(this.civiLevel, levels.length - 1)];
  }
}
