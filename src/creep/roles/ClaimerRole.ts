import { TaskType } from "creep/tasks/Task";
import Role, { CreepInfo, RoleCountMap, RoleType } from "./Role";

const ClaimerRole: Role = {
  type: RoleType.Claimer,
  tasks: [TaskType.Claim, TaskType.MoveToFlag, TaskType.RetreatToSpawn, TaskType.Idle],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [CLAIM, MOVE] combo
    const base = Math.floor(energyCapacity / 650);
    let remainder = energyCapacity % 650;
    // [TOUGH, MOVE] combo
    const defense = Math.floor(remainder / 60);
    remainder = remainder % 60;

    const bodyParts: BodyPartConstant[] = [];
    for (let i = 0; i < defense; i++) {
      bodyParts.push(TOUGH);
      bodyParts.push(MOVE);
    }
    for (let i = 0; i < base; i++) {
      bodyParts.push(CLAIM);
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
      if (Object.keys(Game.flags).find(f => f.includes("@" + this.type)) !== undefined) return 2;
    }
    return 0;
  },

  getSpawnPriority(_room: Room, _roleCount: RoleCountMap): number {
    return 0;
  }
};

export default ClaimerRole;
