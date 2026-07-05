/**
 * GameFlags — 所有游戏状态标记的类型化定义
 *
 * 消除魔法字符串：所有 flag 名称收进此 const 对象，
 * 类型系统会确保 addFlag/hasFlag/removeFlag 只接受已知的 flag 名称。
 * typo 直接变编译错误，不再有"黑域"写成"黑域"导致的静默 bug。
 */

export const FLAG = {
  // === 纪元推进关键标记 ===
  DETERRENCE_ESTABLISHED: 'deterrence_established',
  COORDINATES_BROADCASTED: 'coordinates_broadcasted',
  BUNKER_WORLD_COMPLETED: 'bunker_world_completed',
  GALAXY_EXODUS_SEEN: 'galaxy_exodus_seen',
  DIMENSIONAL_STRIKE: 'dimensional_strike',
  STARDUST_ERA_DECLARED: 'stardust_era_declared',
  STARDUST_ERA_SEEN: 'stardust_era_seen',
  STARDUST_ERA_ACTIVE: 'stardust_era_active',
  EPOCH_STALLED: 'epoch_stalled',

  // === 外星文明接触标记 ===
  SINGER_CONTACT: 'singer_contact',
  RING_CONTACT: 'ring_contact',
  FRINGE_CONTACT: 'fringe_contact',
  ZEROERS_CONTACT: 'zeroers_contact',
  ZERO_HOMER_CONTACTED: 'zero_homer_contacted',

  // === 胜利结局相关标记 ===
  WANDERING_COMPLETED: 'wandering_completed',
  WANDERING_CHOSEN: 'wandering_chosen',
  WANDERING_EARTH_STARTED: 'wandering_earth_started',
  DIGITAL_ARK_UPGRADE: 'digital_ark_upgrade',
  DIGITAL_SINGULARITY_REACHED: 'digital_singularity_reached',
  DARK_DOMAIN_DECISION: 'dark_domain_decision',
  BLACK_DOMAIN_DECISION: 'black_domain_decision',
  BLACK_DOMAIN_COMPLETED: 'black_domain_completed',
  CONQUEST_DECLARED: 'conquest_declared',
  SWORDHOLDER_APPOINTED: 'swordholder_appointed',
  MINI_UNIVERSE_BUILT: 'mini_universe_built',
  ALIEN_ALLIANCE: 'alien_alliance',
  SAFETY_DECLARATION: 'safety_declaration',

  // === 防御/逃逸标记 ===
  DIMENSIONAL_DEFENSE: 'dimensional_defense',
  DIMENSIONAL_DEFENSE_COMPLETED: 'dimensional_defense_completed',

  // === 剧情标记 ===
  WALLFACER_PROJECT: 'wallfacer_project',
  DARK_FOREST_DETERRENCE: 'dark_forest_deterrence',
  DETERRENCE_BROKEN: 'deterrence_broken',
  FIRST_CONTACT_MADE: 'first_contact_made',
  DIPLOMACY_OPENED: 'diplomacy_opened',
  ALLIANCE_FORMED: 'alliance_formed',
  EXILE_FLEET_READY: 'exile_fleet_ready',

  // === 系统标记 ===
  RUINS_CHECKED: 'ruins_checked',
  NEW_GAME_PLUS: 'new_game_plus',
  UNLOCKED_ZEROER_PERSPECTIVE: 'unlocked_zeroer_perspective',
  GAME_OVER: 'game_over',
} as const;

/** 所有合法 flag 名称的联合类型 */
export type GameFlag = (typeof FLAG)[keyof typeof FLAG];

/**
 * 动态 flag 名称（如 "${alienName}_alliance_formed"、"${alienName}_broadcast_sent"）。
 * 这些 flag 无法在编译期穷举，但通过此类型标记，至少让调用方意识到它是动态的。
 */
export type DynamicGameFlag = `${string}_alliance_formed` | `${string}_broadcast_sent`;