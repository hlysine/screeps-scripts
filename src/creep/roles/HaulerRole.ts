import FleeFromAttackerTask from "creep/tasks/FleeFromAttackerTask";
import IdleTask from "creep/tasks/IdleTask";
import PickUpResourceTask from "creep/tasks/PickUpResourceTask";
import PrependTask from "creep/tasks/PrependTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import SalvageTask from "creep/tasks/SalvageTask";
import { inHomeRoom } from "creep/tasks/SharedSteps";
import StoreResourceTask from "creep/tasks/StoreResourceTask";
import WithdrawContainerTask from "creep/tasks/WithdrawContainerTask";
import Role, { CreepInfo, RoleCountMap } from "./Role";

const HaulerRole: Role = {
  id: "hauler" as Id<Role>,
  tasks: [
    [FleeFromAttackerTask],
    [
      PrependTask(
        StoreResourceTask(t => t !== RESOURCE_ENERGY),
        inHomeRoom
      ),
      PickUpResourceTask(t => t !== RESOURCE_ENERGY),
      SalvageTask(t => t !== RESOURCE_ENERGY),
      WithdrawContainerTask(t => t !== RESOURCE_ENERGY),
      RetreatToSpawnTask,
      IdleTask
    ]
  ],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [CARRY, MOVE] combo
    const base = Math.min(5, Math.floor(energyCapacity / 100));
    const remainder = energyCapacity - base * 100;

    const bodyParts: BodyPartConstant[] = [];
    for (let i = 0; i < base; i++) {
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
      return room.controller.level >= 6 ? 2 : 0;
    }
    return 0;
  },

  getSpawnPriority(_room: Room, _roleCount: RoleCountMap): number {
    return 0;
  }
};

export default HaulerRole;
