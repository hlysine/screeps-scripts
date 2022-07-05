import BuildTask from "creep/tasks/BuildTask";
import PrependTask from "creep/tasks/PrependTask";
import HarvestTask from "creep/tasks/HarvestTask";
import IdleTask from "creep/tasks/IdleTask";
import MoveToFlagTask, { MoveToFlagMode } from "creep/tasks/MoveToFlagTask";
import RetreatWhenNoFlagTask from "creep/tasks/RetreatWhenNoFlagTask";
import { requireEnergy, requireFlagInRoom } from "creep/tasks/SharedSteps";
import TransferTask from "creep/tasks/TransferTask";
import Role, { CreepInfo, RoleCountMap } from "./Role";
import PickUpResourceTask from "creep/tasks/PickUpResourceTask";
import SalvageTask from "creep/tasks/SalvageTask";
import RepairTask from "creep/tasks/RepairTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import FlagTags from "utils/FlagTags";
import UpgradeTask from "creep/tasks/UpgradeTask";
import FleeFromAttackerTask from "creep/tasks/FleeFromAttackerTask";
import FlagManager from "managers/FlagManager";

const HelperRole: Role = {
  id: "helper" as Id<Role>,
  tasks: [
    [
      RetreatWhenNoFlagTask((flag, creep) => {
        const name = flag.name.toLowerCase();
        if (name.includes("@" + creep.memory.role)) return true;
        if (name.includes("#" + FlagTags.Harvest)) return true; // this is to allow helpers to harvest in other rooms
        return false;
      }),
      FleeFromAttackerTask,
      PickUpResourceTask
    ],
    [
      PrependTask(MoveToFlagTask(MoveToFlagMode.RoomOnly, 1), requireEnergy),
      PrependTask(
        RepairTask(structure => {
          if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART)
            return structure.hits < 100000;
          else return structure.hits < structure.hitsMax * 0.5;
        }),
        requireFlagInRoom
      ),
      PrependTask(
        BuildTask(() => true),
        requireFlagInRoom
      ),
      PrependTask(
        TransferTask(() => true),
        requireFlagInRoom
      ),
      PrependTask(UpgradeTask, requireFlagInRoom),
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
      const flagCount = FlagManager.getRelatedFlags(room.name).filter(f => f.name.includes("@" + this.id)).length;
      if (flagCount && room.findTrulyHostileCreeps().length === 0) return flagCount;
    }
    return 0;
  },

  getSpawnPriority(_room: Room, _roleCount: RoleCountMap): number {
    return 0;
  }
};

export default HelperRole;
