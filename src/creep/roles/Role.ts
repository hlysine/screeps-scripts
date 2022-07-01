import { ActionType } from "creep/action/Action";

export enum RoleType {
  Worker = "worker",
  Helper = "helper",
  Attacker = "attacker",
  /**
   * Defenders have the same logic as Attacker, but are controlled with a different flag
   */
  Defender = "defender",
  Claimer = "claimer"
}

export interface RoleMemory {
  role: RoleType;
}

export interface CreepInfo {
  bodyParts: BodyPartConstant[];
  energyCost: number;
}

export type RoleCountMap = {
  [key in RoleType]: number;
};

export default interface Role {
  type: RoleType;
  actions: ActionType[];
  getCreepInfo(energyCapacity: number): CreepInfo;
  getCreepLimit(room: Room): number;
  getSpawnPriority(room: Room, roleCount: RoleCountMap): number;
}
