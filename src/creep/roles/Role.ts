import { ActionType } from "creep/action/Action";

export enum RoleType {
  Worker = "worker",
  Attacker = "attacker",
  Claimer = "claimer"
}

export interface RoleMemory {
  role: RoleType;
}

export interface CreepInfo {
  bodyParts: BodyPartConstant[];
  energyCost: number;
}

export default interface Role {
  type: RoleType;
  actions: ActionType[];
  getCreepInfo(energyCapacity: number): CreepInfo;
  getCreepLimit(room: Room): number;
}
