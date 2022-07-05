import BuildTask from "creep/tasks/BuildTask";
import FleeFromAttackerTask from "creep/tasks/FleeFromAttackerTask";
import HarvestTask from "creep/tasks/HarvestTask";
import IdleTask from "creep/tasks/IdleTask";
import PickUpResourceTask from "creep/tasks/PickUpResourceTask";
import RepairTask from "creep/tasks/RepairTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import SalvageTask from "creep/tasks/SalvageTask";
import TransferTask from "creep/tasks/TransferTask";
import UpgradeTask from "creep/tasks/UpgradeTask";
import UrgentUpgradeTask from "creep/tasks/UrgentUpgradeTask";
import { isRoomMine } from "utils/StructureUtils";
import Role, { CreepInfo, RoleCountMap } from "./Role";

const WorkerRole: Role = {
  id: "worker" as Id<Role>,
  tasks: [
    [UrgentUpgradeTask, FleeFromAttackerTask, PickUpResourceTask],
    [
      RepairTask(structure => structure.hits < 100 && isRoomMine(structure.room)),
      TransferTask(structure => structure.my),
      BuildTask(site => site.my),
      RepairTask(structure => {
        if (!isRoomMine(structure.room)) return false;
        if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART)
          return structure.hits < 100000;
        else return structure.hits < structure.hitsMax * 0.3;
      }),
      UpgradeTask,
      SalvageTask,
      HarvestTask,
      RetreatToSpawnTask,
      IdleTask
    ]
  ],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [WORK, CARRY, MOVE] combo
    const base = Math.floor(energyCapacity / 200);
    let remainder = energyCapacity % 200;
    // [WORK, MOVE] combo
    // remaining WORK
    const remainingWork = Math.floor(remainder / 150);
    remainder = remainder % 150;

    const bodyParts: BodyPartConstant[] = [];
    for (let i = 0; i < remainingWork; i++) {
      bodyParts.push(WORK);
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
    if (room.controller) return Math.min(8, Math.max(4, room.controller.level * 2 + 2));
    return 0;
  },

  getSpawnPriority(room: Room, roleCount: RoleCountMap): number {
    if (roleCount[WorkerRole.id] >= this.getCreepLimit(room) / 2) return 0;
    return 99;
  }
};

export default WorkerRole;
