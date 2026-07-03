/**
 * 游戏版本号统一来源
 *
 * 从 package.json 读取版本号，避免在多处硬编码。
 * 所有需要展示版本号的 UI 组件和脚本均应引用此模块。
 */
import pkg from '../../package.json';

export const GAME_VERSION: string = pkg.version || '0.0.0';
