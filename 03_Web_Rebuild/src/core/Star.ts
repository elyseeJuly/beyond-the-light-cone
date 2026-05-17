export interface Star {
  index: number;
  name: string;
  isPlanet: boolean;
  migrationLevel: number;
  totalResource: number;
  currentResource: number;
  exist: boolean;
  belongToCivi: string;
  populationLimit: number;
  currentPopulation: number;
  found: boolean;

  hasStope: boolean;
  hasFactory: boolean;
  hasCity: boolean;
  barbackId: string | null;

  buildingProgress: Record<string, { currentBuild: number; totalBuild: number; buildPerRound: number }> | null;

  departmentName: string | null;
}

export function createEmptyStar(index: number): Star {
  return {
    index,
    name: `Star ${index}`,
    isPlanet: true,
    migrationLevel: 0,
    totalResource: 0,
    currentResource: 0,
    exist: true,
    belongToCivi: "",
    populationLimit: 0,
    currentPopulation: 0,
    found: false,
    hasStope: false,
    hasFactory: false,
    hasCity: false,
    barbackId: null,
    buildingProgress: null,
    departmentName: null,
  };
}
