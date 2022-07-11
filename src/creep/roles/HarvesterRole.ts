import FleeFromAttackerTask from "creep/tasks/FleeFromAttackerTask";
import HarvestDedicatedTask from "creep/tasks/HarvestDedicated";
import IdleTask from "creep/tasks/IdleTask";

import Role, { CreepInfo, RoleCountMap } from "./Role";

const HarvesterRole: Role = {
  id: "harvester" as Id<Role>,
  tasks: [[FleeFromAttackerTask], [HarvestDedicatedTask, IdleTask]],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [WORK, WORK, MOVE] combo
    const base = Math.min(3, Math.floor(energyCapacity / 250));
    let remainder = energyCapacity - 250 * base;
    // [WORK, MOVE] combo
    const extraBase = Math.min(1, Math.floor(remainder / 150));
    remainder = remainder - 150 * extraBase;

    const bodyParts: BodyPartConstant[] = [];
    for (let i = 0; i < extraBase; i++) {
      bodyParts.push(WORK);
      bodyParts.push(MOVE);
    }
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
    let count = 0;

    const containers = room.find(FIND_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_CONTAINER
    });

    const sources = room.find(FIND_SOURCES);
    count += containers.reduce((acc, container) => {
      const source = sources.find(s => s.pos.isNearTo(container));
      return source ? acc + 1 : acc;
    }, 0);
    const minerals = room.find(FIND_MINERALS);
    count += containers.reduce((acc, container) => {
      const mineral = minerals.find(s => s.pos.isNearTo(container));
      return mineral ? acc + 1 : acc;
    }, 0);

    return count;
  },

  getSpawnPriority(_room: Room, _roleCount: RoleCountMap): number {
    return 0;
  }
};

export default HarvesterRole;
