import BuildTask from "creep/tasks/BuildTask";
import PrependTask from "creep/tasks/PrependTask";
import HarvestTask from "creep/tasks/HarvestTask";
import IdleTask from "creep/tasks/IdleTask";
import MoveToFlagTask, { MoveToFlagMode } from "creep/tasks/MoveToFlagTask";
import RetreatWhenNoFlagTask from "creep/tasks/RetreatWhenNoFlagTask";
import { requireEnergy, requireFlagInRoom } from "creep/tasks/SharedSteps";
import TransferEnergyTask from "creep/tasks/TransferEnergyTask";
import Role, { CreepInfo, RoleCountMap } from "./Role";
import PickUpResourceTask from "creep/tasks/PickUpResourceTask";
import SalvageTask from "creep/tasks/SalvageTask";
import RepairTask from "creep/tasks/RepairTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import FlagTags from "utils/FlagTags";
import UpgradeTask from "creep/tasks/UpgradeTask";
import FleeFromAttackerTask from "creep/tasks/FleeFromAttackerTask";
import FlagManager from "managers/FlagManager";
import WithdrawContainerTask from "creep/tasks/WithdrawContainerTask";

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
      FleeFromAttackerTask
    ],
    [
      PrependTask(MoveToFlagTask(MoveToFlagMode.RoomOnly, 1), requireEnergy),
      PrependTask(
        RepairTask(structure => {
          if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) return false;
          else return structure.hits < structure.hitsMax * 0.5;
        }),
        requireFlagInRoom
      ),
      PrependTask(
        TransferEnergyTask(() => true),
        requireFlagInRoom
      ),
      PrependTask(
        BuildTask(() => true),
        requireFlagInRoom
      ),
      PrependTask(UpgradeTask, requireFlagInRoom),
      PickUpResourceTask(t => t === RESOURCE_ENERGY),
      SalvageTask(t => t === RESOURCE_ENERGY),
      WithdrawContainerTask(t => t === RESOURCE_ENERGY),
      HarvestTask(t => t === RESOURCE_ENERGY),
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
    if (room.controller) {
      const flagCount = FlagManager.getRelatedFlags(room.name).filter(f => f.name.includes("@" + this.id)).length;
      if (flagCount && room.findTrulyHostileCreeps().length === 0) return flagCount;
    }
    return 0;
  },

  getSpawnPriority(_room: Room, _roleCount: RoleCountMap): number {
    return 0;
  },

  identifyRole(creep: Creep): boolean {
    return !!creep.body.find(b => b.type === WORK) && !!creep.body.find(b => b.type === CARRY);
  }
};

export default HelperRole;
