import BuildTask from "creep/tasks/BuildTask";
import FleeFromAttackerTask from "creep/tasks/FleeFromAttackerTask";
import HarvestTask from "creep/tasks/HarvestTask";
import IdleTask from "creep/tasks/IdleTask";
import PickUpResourceTask from "creep/tasks/PickUpResourceTask";
import PrependTask from "creep/tasks/PrependTask";
import RepairTask from "creep/tasks/RepairTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import SalvageTask from "creep/tasks/SalvageTask";
import { inHomeRoom } from "creep/tasks/SharedSteps";
import TransferEnergyTask from "creep/tasks/TransferEnergyTask";
import UpgradeTask from "creep/tasks/UpgradeTask";
import UrgentUpgradeTask from "creep/tasks/UrgentUpgradeTask";
import WithdrawContainerTask from "creep/tasks/WithdrawContainerTask";
import { isRoomMine } from "utils/StructureUtils";
import Role, { CreepInfo, RoleCountMap } from "./Role";

const WorkerRole: Role = {
  id: "worker" as Id<Role>,
  tasks: [
    [UrgentUpgradeTask, FleeFromAttackerTask],
    [
      PrependTask(
        RepairTask(structure => structure.hits < 100 && isRoomMine(structure.room)),
        inHomeRoom
      ),
      PrependTask(
        TransferEnergyTask(
          structure =>
            structure.my &&
            (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION)
        ),
        inHomeRoom
      ),
      PrependTask(
        TransferEnergyTask(structure => structure.my),
        inHomeRoom
      ),
      PrependTask(
        BuildTask(site => site.my),
        inHomeRoom
      ),
      PrependTask(
        RepairTask(structure => {
          if (!isRoomMine(structure.room)) return false;
          if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
            if (structure.room.controller?.level ?? 0 < 8) {
              return (
                structure.hits < Math.min(structure.hitsMax, Math.pow(10, (structure.room.controller?.level ?? 5) - 2))
              );
            } else {
              return structure.hits < structure.hitsMax;
            }
          } else return structure.hits < structure.hitsMax * 0.3;
        }),
        inHomeRoom
      ),
      PrependTask(UpgradeTask, inHomeRoom),
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
      const containerCount = room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      }).length;
      return Math.max(4, Math.min(8 - containerCount, room.controller.level * 2 + 2 - containerCount));
    }
    return 0;
  },

  getSpawnPriority(room: Room, roleCount: RoleCountMap): number {
    if (roleCount[WorkerRole.id] >= this.getCreepLimit(room) / 2) return 0;
    return 99;
  },

  identifyRole(creep: Creep): boolean {
    return !!creep.body.find(b => b.type === WORK) && !!creep.body.find(b => b.type === CARRY);
  }
};

export default WorkerRole;
