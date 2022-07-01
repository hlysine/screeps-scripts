import { TaskType } from "creep/tasks/Task";
import Role, { CreepInfo, RoleCountMap, RoleType } from "./Role";

const HelperRole: Role = {
  type: RoleType.Helper,
  tasks: [
    TaskType.Harvest,
    TaskType.MoveToFlag,
    TaskType.Build,
    TaskType.Transfer,
    TaskType.TransferToCreep,
    TaskType.Idle
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
    if (bodyParts.length > 50) {
      bodyParts.splice(0, bodyParts.length - 50);
    }
    return {
      bodyParts,
      energyCost: energyCapacity - remainder
    };
  },

  getCreepLimit(room: Room): number {
    if (room.controller) {
      if (
        Object.keys(Game.flags).find(f => f.includes("@" + this.type)) !== undefined &&
        room.find(FIND_HOSTILE_CREEPS).length === 0
      )
        return 2;
    }
    return 0;
  },

  getSpawnPriority(_room: Room, _roleCount: RoleCountMap): number {
    return 0;
  }
};

export default HelperRole;
