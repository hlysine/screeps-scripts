import BuildTask from "creep/tasks/BuildTask";
import PrependTask from "creep/tasks/PrependTask";
import HarvestTask from "creep/tasks/HarvestTask";
import IdleTask from "creep/tasks/IdleTask";
import MoveToFlagTask, { MoveToFlagMode } from "creep/tasks/MoveToFlagTask";
import RetreatWhenNoFlagTask from "creep/tasks/RetreatWhenNoFlagTask";
import { requireEnergy, requireFlag } from "creep/tasks/SharedSteps";
import TransferTask from "creep/tasks/TransferTask";
import TransferToCreepTask from "creep/tasks/TransferToHostileCreepTask";
import Role, { CreepInfo, RoleCountMap } from "./Role";
import PickUpResourceTask from "creep/tasks/PickUpResourceTask";
import SalvageTask from "creep/tasks/SalvageTask";
import RepairTask from "creep/tasks/RepairTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import FlagTags from "utils/FlagTags";

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
      PickUpResourceTask
    ],
    [
      PrependTask(MoveToFlagTask(MoveToFlagMode.RoomOnly, 1), requireEnergy),
      PrependTask(
        RepairTask(
          structure =>
            (structure.structureType !== STRUCTURE_WALL &&
              structure.structureType !== STRUCTURE_RAMPART &&
              structure.hits < structure.hitsMax * 0.5) ||
            structure.hits < 1000000
        ),
        requireFlag
      ),
      PrependTask(
        BuildTask(() => true),
        requireFlag
      ),
      PrependTask(
        TransferTask(() => true),
        requireFlag
      ),
      PrependTask(TransferToCreepTask, requireFlag),
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
      if (
        Object.keys(Game.flags).find(f => f.includes("@" + this.id)) !== undefined &&
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
