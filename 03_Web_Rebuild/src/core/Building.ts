export enum BuildingType {
  STOPE = 'stope',
  FACTORY = 'factory',
  CITY = 'city',
}

export interface Building {
  type: BuildingType;
  totalBuild: number;
  currentBuild: number;
  buildPerRound: number;
}

export function createBuilding(type: BuildingType): Building {
  let totalBuild = 100;
  const buildPerRound = 10;
  
  if (type === BuildingType.FACTORY) {
    totalBuild = 200;
  }
  
  return {
    type,
    totalBuild,
    currentBuild: 0,
    buildPerRound,
  };
}

export function isBuildingCompleted(building: Building): boolean {
  return building.currentBuild >= building.totalBuild;
}

export function runBuildingRound(building: Building): void {
  if (!isBuildingCompleted(building)) {
    building.currentBuild += building.buildPerRound;
    if (building.currentBuild > building.totalBuild) {
      building.currentBuild = building.totalBuild;
    }
  }
}
