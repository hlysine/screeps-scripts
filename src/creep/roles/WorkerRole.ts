import BuildOwnedTask from "creep/tasks/build/BuildOwnedTask";
import HarvestTask from "creep/tasks/HarvestTask";
import IdleTask from "creep/tasks/IdleTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import TransferOwnedTask from "creep/tasks/transfer/TransferOwnedTask";
import UpgradeTask from "creep/tasks/UpgradeTask";
import UrgentUpgradeTask from "creep/tasks/UrgentUpgradeTask";
import Role, { CreepInfo, RoleCountMap } from "./Role";

const WorkerRole: Role = {
  id: "worker" as Id<Role>,
  tasks: [
    [
      UrgentUpgradeTask.id,
      TransferOwnedTask.id,
      BuildOwnedTask.id,
      UpgradeTask.id,
      HarvestTask.id,
      RetreatToSpawnTask.id,
      IdleTask.id
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
    if (room.controller) return Math.max(2, room.controller.level * 2 - 1);
    return 0;
  },

  getSpawnPriority(room: Room, roleCount: RoleCountMap): number {
    if (roleCount[WorkerRole.id] >= this.getCreepLimit(room) / 2) return 0;
    return 99;
  }
};

export default WorkerRole;
