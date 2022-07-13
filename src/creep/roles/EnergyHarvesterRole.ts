import FleeFromAttackerTask from "creep/tasks/FleeFromAttackerTask";
import HarvestDedicatedTask from "creep/tasks/HarvestDedicated";
import IdleTask from "creep/tasks/IdleTask";

import Role, { CreepInfo, RoleCountMap } from "./Role";

const EnergyHarvesterRole: Role = {
  id: "energy_harvester" as Id<Role>,
  tasks: [[FleeFromAttackerTask], [HarvestDedicatedTask(t => t === RESOURCE_ENERGY), IdleTask]],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [WORK, WORK, MOVE] combo
    const base = Math.min(3, Math.floor(energyCapacity / 250));
    let remainder = energyCapacity - 250 * base;
    // remaining WORK
    const extraBase = Math.min(1, Math.floor(remainder / 100));
    remainder = remainder - 100 * extraBase;

    const bodyParts: BodyPartConstant[] = [];
    for (let i = 0; i < extraBase; i++) {
      bodyParts.push(WORK);
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

    return count;
  },

  getSpawnPriority(_room: Room, _roleCount: RoleCountMap): number {
    return 0;
  },

  identifyRole(creep: Creep): boolean {
    if (!creep.body.find(b => b.type === CARRY)) {
      const work = creep.countBodyParts(WORK);
      if (work > 0 && work <= 7) {
        return true;
      }
    }
    return false;
  }
};

export default EnergyHarvesterRole;
