import FleeFromAttackerTask from "creep/tasks/FleeFromAttackerTask";
import HarvestDedicatedTask from "creep/tasks/HarvestDedicated";
import IdleTask from "creep/tasks/IdleTask";

import Role, { CreepInfo, RoleCountMap } from "./Role";

const HarvesterRole: Role = {
  id: "harvester" as Id<Role>,
  tasks: [[FleeFromAttackerTask], [HarvestDedicatedTask, IdleTask]],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [WORK, WORK, MOVE] combo
    const base = Math.min(4, Math.floor(energyCapacity / 250));
    const remainder = energyCapacity - 250 * base;

    const bodyParts: BodyPartConstant[] = [];
    for (let i = 0; i < base; i++) {
      bodyParts.push(WORK);
      bodyParts.push(WORK);
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
    const containers = room.find(FIND_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_CONTAINER
    });
    const sources = room.find(FIND_SOURCES);
    return containers.reduce((acc, container) => {
      const source = sources.find(s => s.pos.isNearTo(container));
      return source ? acc + 1 : acc;
    }, 0);
  },

  getSpawnPriority(_room: Room, _roleCount: RoleCountMap): number {
    return 0;
  }
};

export default HarvesterRole;
