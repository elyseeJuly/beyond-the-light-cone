export enum DepartmentType {
  ECONOMY = 0,
  ARMY = 1,
  CULTURE = 2,
  HUMANRES = 3,
  ASTROSOCIOLOGY = 4,
  NUCLEAR = 5,
  SPACEFIGHT = 6,
  PROTON = 7,
  ASTROPHYSICS = 8,
  CULTURETEC = 9,
  ECONOMYTEC = 10,
  COUNT = 11
}

export enum StarArea {
  SOLARSYSTEM = 0,
  LIGHTYEAR_50 = 1,
  LIGHTYEAR_1W = 2,
  GALAXY = 3,
  COUNT = 4
}

export enum TecTreeType {
  PHYSICS = 0,
  AEROSPACE = 1,
  MILITARY = 2,
  INFORMATION = 3,
  INTERSTELLAR = 4,
  COUNT = 5
}

export enum EpochType {
  GOLDEN = 0,
  CRISIS = 1,
  DETERRENCE = 2,
  BROADCAST = 3,
  BUNKER = 4,
  GALAXY = 5,
  STARDUST = 6,
  COUNT = 7
}

export enum AiPersonality {
  HUNTER = 0,
  CLEANER = 1,
  DEFENSIVE = 2,
  EXPANSIONIST = 3,
  OPPORTUNIST = 4,
  COUNT = 5
}

export enum DiplomacyState {
  EXTINCTION_WAR = 0,
  SUSPICION = 1,
  ARMED_PEACE = 2,
  COOPERATION = 3,
  ALLIANCE = 4,
  COMMUNITY = 5,
  COUNT = 6
}

export enum VictoryType {
  CONQUEST = 0,
  DETERRENCE = 1,
  DARK_DOMAIN = 2,
  WANDERING = 3,
  DIGITAL = 4,
  HIDDEN = 5,
  COUNT = 6
}

export enum DefeatType {
  TREACHERY = 0,
  EXTINCTION = 1,
  HELIUM_FLASH = 2,
  DIMENSION_STRIKE = 3,
}

export enum NeutralType {
  ETERNAL_EXILE = 0,
  COSMIC_SILENCE = 1,
  COUNT = 2
}

export enum WeaponType {
  UNIT = 0,
  EXPENDABLE = 1,
  SPY = 2,
  SUPERBOMB = 3
}

export enum BattleType {
  ATTACK = 0,
  DEFEND = 1
}

export enum FriendshipType {
  VERYANGRY = 0,
  ANGRY = 1,
  NORMAL = 2,
  FRIEND = 3,
  VERYFRIEND = 4
}

export enum EventType {
  INYEAR = 0,
  STRINGINDEX = 1,
  RANDOM = 2
}

export enum EventEffect {
  NONE = 0,
  ADDECONEMY = 1,
  ADDCULTURE = 2,
  ADDPOP = 3,
  REDUCE_TREACHERY = 4,
  WAR = 5,
  MOON_CRISIS = 6,
  WANDERING_EARTH = 7
}

export type EventLane = 'milestone' | 'major' | 'ambient' | 'crisis' | 'character';

export type LoreDomain = 'three_body_canon' | 'liu_cixin_crossover' | 'original_expansion';

export type LoreMode = 'strict_three_body' | 'liu_cixin_mixed' | 'sandbox';
