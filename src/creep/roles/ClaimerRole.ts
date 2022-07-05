import AttackControllerTask from "creep/tasks/AttackControllerTask";
import ClaimTask from "creep/tasks/ClaimTask";
import IdleTask from "creep/tasks/IdleTask";
import MoveToFlagTask, { MoveToFlagMode } from "creep/tasks/MoveToFlagTask";
import ReserveTask from "creep/tasks/ReserveTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import RetreatWhenNoFlagTask from "creep/tasks/RetreatWhenNoFlagTask";
import FlagManager from "managers/FlagManager";
import Role, { CreepInfo, RoleCountMap } from "./Role";

const ClaimerRole: Role = {
  id: "claimer" as Id<Role>,
  tasks: [
    [RetreatWhenNoFlagTask()],
    [
      ClaimTask,
      ReserveTask,
      AttackControllerTask,
      MoveToFlagTask(MoveToFlagMode.LowPriorityInRoom, 1),
      RetreatToSpawnTask,
      IdleTask
    ]
  ],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [CLAIM, MOVE] combo
    const base = Math.floor(energyCapacity / 650);
    const remainder = energyCapacity % 650;

    const bodyParts: BodyPartConstant[] = [];
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
      return FlagManager.getRelatedFlags(room.name).filter(f => f.name.includes("@" + this.id)).length;
    }
    return 0;
  },

  getSpawnPriority(_room: Room, _roleCount: RoleCountMap): number {
    return 0;
  }
};

export default ClaimerRole;
