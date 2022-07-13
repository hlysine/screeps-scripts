import Task from "creep/tasks/Task";

export interface RoleMemory {
  role: Id<Role>;
}

export interface CreepInfo {
  bodyParts: BodyPartConstant[];
  energyCost: number;
}

export interface RoleCountMap {
  [key: Id<Role>]: number;
}

export type TaskTiers = Task[][];

export default interface Role {
  id: Id<this>;
  tasks: TaskTiers;
  getCreepInfo(energyCapacity: number): CreepInfo;
  getCreepLimit(room: Room): number;
  getSpawnPriority(room: Room, roleCount: RoleCountMap): number;
  identifyRole(creep: Creep): boolean;
}
