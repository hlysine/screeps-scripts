import { ActionType } from "creep/action/Action";
import Role, { CreepInfo, RoleCountMap, RoleType } from "./Role";

const WorkerRole: Role = {
  type: RoleType.Worker,
  actions: [
    ActionType.Harvest,
    ActionType.UrgentUpgrade,
    ActionType.Transfer,
    ActionType.Build,
    ActionType.Upgrade,
    ActionType.Idle
  ],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [WORK, CARRY, MOVE] combo
    const base = Math.floor(energyCapacity / 200);
    let remainder = energyCapacity % 200;
    // remaining WORK
    const remainingWork = Math.floor(remainder / 100);
    remainder = remainder % 100;
    // remaining MOVE
    const remainingMove = Math.floor(remainder / 50);
    remainder = remainder % 50;

    const bodyParts: BodyPartConstant[] = [];
    for (let i = 0; i < remainingWork; i++) {
      bodyParts.push(WORK);
    }
    for (let i = 0; i < remainingMove; i++) {
      bodyParts.push(MOVE);
    }
    for (let i = 0; i < base; i++) {
      bodyParts.push(WORK);
      bodyParts.push(CARRY);
      bodyParts.push(MOVE);
    }
    return {
      bodyParts,
      energyCost: energyCapacity - remainder
    };
  },

  getCreepLimit(room: Room): number {
    if (room.controller) return room.controller.level * 2 - 1;
    return 0;
  },

  getSpawnPriority(room: Room, roleCount: RoleCountMap): number {
    if (roleCount[RoleType.Worker] >= this.getCreepLimit(room) / 2) return 0;
    return 99;
  }
};

export default WorkerRole;
