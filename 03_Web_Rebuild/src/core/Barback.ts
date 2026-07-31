import { WeaponInstance } from "./Weapon";
import { t } from "../utils/i18n";

export interface Barback {
  id: string; // 唯一标识符
  planetIndex: number;
  soldierCount: number;
  weapons: WeaponInstance[];
  isFriend: boolean;
  alignmentYear: number;
  
  departmentLeaderName: string | null; // 军营的驻防指挥官
  departmentName: string;
  
  totalBuild: number;
  currentBuild: number;
  buildPerRound: number;
}

export function createBarback(id: string, planetIndex: number): Barback {
  return {
    id,
    planetIndex,
    soldierCount: 0,
    weapons: [],
    isFriend: false,
    alignmentYear: 0,
    departmentLeaderName: null,
    departmentName: t("基地防御部"),
    totalBuild: 100,
    currentBuild: 0,
    buildPerRound: 10,
  };
}

export function isBarbackCompleted(barback: Barback): boolean {
  return barback.currentBuild >= barback.totalBuild;
}

export function runBarbackRound(barback: Barback): void {
  if (!isBarbackCompleted(barback)) {
    barback.currentBuild += barback.buildPerRound;
    if (barback.currentBuild > barback.totalBuild) {
      barback.currentBuild = barback.totalBuild;
    }
  }
}
