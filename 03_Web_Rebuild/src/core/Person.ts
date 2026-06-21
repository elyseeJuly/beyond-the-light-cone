export interface Person {
  name: string;
  faceFile: string;
  treachery: number;
  science: number;
  art: number;
  economy: number;
  army: number;
  leadership: number;
  social: number;

  isAlive: boolean;
  birthYear: number;
  deathYear: number;

  // 扁平化数据：不再持有 CDepartment 指针，而是记录部门类型和归属的星球 ID/名称
  // 如果此人为自由人，则 department 为 null
  departmentId: string | null;
}

export function createEmptyPerson(name: string): Person {
  return {
    name,
    faceFile: "",
    treachery: 0,
    science: 0,
    art: 0,
    economy: 0,
    army: 0,
    leadership: 0,
    social: 0,
    isAlive: true,
    birthYear: 0,
    deathYear: 0,
    departmentId: null,
  };
}
