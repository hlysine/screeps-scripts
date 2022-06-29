import { ActionType } from "creep/action/Action";

export enum RoleType {
  Worker = "worker",
  Attacker = "attacker",
  Claimer = "claimer"
}

export interface RoleMemory {
  role: RoleType;
}

export default interface Role {
  type: RoleType;
  actions: ActionType[];
  getBodyParts(energyCapacity: number): BodyPartConstant[];
  getCreepLimit(room: Room): number;
}
