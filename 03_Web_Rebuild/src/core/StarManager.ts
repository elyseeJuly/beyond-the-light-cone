import { Star, createEmptyStar } from "./Star";
import starsData from "../data/stars.json";
import { generateStars } from "./StarGenerator";
import { StarArea } from "../types/enums";
import { STAR_INDEX } from "../config/starIndices";

export class StarManager {
  public stars: Map<number, Star> = new Map();

  constructor() {
    this.init();
  }

    public init(): void {
    starsData.forEach((data: any) => {
      const star = createEmptyStar(data.Index);
      star.name = data.Name;
      star.isPlanet = data.IsPlanet === 1;
      star.totalResource = data.Resource || 0;
      star.currentResource = star.totalResource;
      if (data.Distance) star.Distance = data.Distance;
      if (data.starType) star.starType = data.starType;
      
      // Random generation bounds mapping logic goes here if needed
      
      this.stars.set(star.index, star);
    });

    // 50光年 18-100
    const lightYear50 = generateStars(5005, 18, 83, [100, 500], [50, 300], "LY50");
    lightYear50.forEach(star => this.stars.set(star.index, star));

    // 1万光年 101-200
    const lightYear1W = generateStars(1001, 101, 100, [100, 1000], [100, 500], "LY");
    lightYear1W.forEach(star => this.stars.set(star.index, star));

    // 银河系 201-1000
    const galaxyStars = generateStars(2002, 201, 800, [50, 2000], [50, 1000], "GLX");
    galaxyStars.forEach(star => this.stars.set(star.index, star));

    // Initialize Earth
    const earth = this.stars.get(STAR_INDEX.EARTH);
    if (earth) {
      earth.belongToCivi = "地球";
      earth.found = true;
      earth.populationLimit = 1000;
      earth.currentPopulation = 100;
    }
  }

  public getStar(index: number): Star | undefined {
    return this.stars.get(index);
  }

  public getAllStars(): Star[] {
    return Array.from(this.stars.values());
  }

  public getStarByName(name: string): Star | undefined {
    return this.getAllStars().find(s => s.name === name);
  }

  public getStarsByArea(area: StarArea): Star[] {
    // 太阳系 0-10
    // 50光年 11-100
    // 1万光年 101-200
    // 银河系 201-1000
    return this.getAllStars().filter(s => {
      if (area === StarArea.SOLARSYSTEM) return s.index <= 10;
      if (area === StarArea.LIGHTYEAR_50) return s.index > 10 && s.index <= 100;
      if (area === StarArea.LIGHTYEAR_1W) return s.index > 100 && s.index <= 200;
      if (area === StarArea.GALAXY) return s.index > 200 && s.index <= 1000;
      return false;
    });
  }
}
