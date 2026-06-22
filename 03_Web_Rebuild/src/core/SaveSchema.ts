import { z } from 'zod';


/**
 * SaveSchema - 使用 Zod 定义存档相关数据契约
 *
 * 负责：
 * - 对 SavePackage / SaveMeta / SaveIndexEntry 等结构进行运行时校验
 * - 为存档迁移提供版本化的最小状态契约参考
 */

export const savePackageSchema = z.object({
  version: z.number().int().min(1).max(1000),
  timestamp: z.number().int(),
  signature: z.number(),
  data: z.string(),
});

export const saveMetaSchema = z.object({
  year: z.number().default(0),
  epoch: z.number().default(0),
  population: z.number().default(0),
  economy: z.number().default(0),
  culture: z.number().default(0),
  timestamp: z.number(),
  slotId: z.string().optional(),
});

export const saveIndexEntrySchema = z.object({
  slotId: z.string(),
  timestamp: z.number(),
  version: z.number(),
});

export const saveIndexSchema = z.record(z.string(), saveIndexEntrySchema);

export const endingRecordSchema = z.object({
  victoryType: z.number().nullable().default(null),
  defeatType: z.number().nullable().default(null),
  label: z.string(),
  year: z.number(),
  epoch: z.number(),
  keyFlags: z.array(z.string()),
  timestamp: z.number(),
});

export const ruinRecordSchema = z.object({
  year: z.number(),
  culture: z.number(),
  techCount: z.number(),
  timestamp: z.number(),
});

export type ValidatedSavePackage = z.infer<typeof savePackageSchema>;
export type ValidatedSaveMeta = z.infer<typeof saveMetaSchema>;
export type ValidatedSaveIndex = z.infer<typeof saveIndexSchema>;
export type ValidatedEndingRecord = z.infer<typeof endingRecordSchema>;
export type ValidatedRuinRecord = z.infer<typeof ruinRecordSchema>;

/**
 * 校验 SavePackage 结构。
 * 返回校验后的对象；失败时抛出 SaveDataCorruptedError 风格的错误信息。
 */
export function validateSavePackage(value: unknown): ValidatedSavePackage {
  const result = savePackageSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`SavePackage 校验失败: ${result.error.message}`);
  }
  return result.data;
}

/**
 * 校验 SaveMeta 结构，提供宽松默认值。
 */
export function validateSaveMeta(value: unknown): ValidatedSaveMeta {
  const result = saveMetaSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`SaveMeta 校验失败: ${result.error.message}`);
  }
  return result.data;
}

/**
 * 校验 save_index 结构。
 */
export function validateSaveIndex(value: unknown): ValidatedSaveIndex {
  const result = saveIndexSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`SaveIndex 校验失败: ${result.error.message}`);
  }
  return result.data;
}

/**
 * 将枚举值安全转换为数字，用于结局记录等场景。
 */
export function enumToNumber<T extends Record<string, string | number>>(
  value: string | number | null | undefined,
  enumObj: T
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const num = Number(value);
  if (!Number.isNaN(num)) return num;
  const key = Object.keys(enumObj).find(k => enumObj[k] === value);
  return key ? Number(enumObj[key]) : null;
}
