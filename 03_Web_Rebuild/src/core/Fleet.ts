import { WeaponInstance } from "./Weapon";

export interface Fleet {
  id: string;
  name: string;
  belongToCivi: string;
  leaderName: string | null;
  weapons: WeaponInstance[];
  
  sourceStarIndex: number;
  targetStarIndex: number;
  
  totalEta: number; // 总航程时间 (回合)
  eta: number;      // 剩余航程时间 (回合)
}

export function createFleet(
  name: string,
  belongToCivi: string,
  source: number,
  target: number,
  eta: number,
  autoEquip?: boolean
): Fleet {
  const fleet: Fleet = {
    id: `fleet_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    belongToCivi,
    leaderName: null,
    weapons: [],
    sourceStarIndex: source,
    targetStarIndex: target,
    totalEta: eta,
    eta: eta
  };

  if (autoEquip) {
    if (belongToCivi === "地球") {
      fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 20 });
    } else if (belongToCivi === "三体") {
      fleet.weapons.push({ weaponName: "水滴型战舰", currentBuild: 80 });
      fleet.weapons.push({ weaponName: "强互作用探测器", currentBuild: 40 });
    } else {
      fleet.weapons.push({ weaponName: "星际无畏舰", currentBuild: 50 });
    }
  }

  return fleet;
}
