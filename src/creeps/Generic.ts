import CreepBrain from "./CreepBrain";

export default {
  run(creep: Creep) {
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      creep.say("🔄 harvest");
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      creep.say("⚡ work");
    }

    if (creep.memory.working) {
      const constructionTargets = creep.room.find(FIND_CONSTRUCTION_SITES);
      if (constructionTargets.length) {
        if (creep.build(constructionTargets[0]) === ERR_NOT_IN_RANGE) {
          creep.moveTo(constructionTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
        }
      } else {
        const structureTargets = creep.room.find(FIND_STRUCTURES, {
          filter: structure => {
            return (
              (structure.structureType === STRUCTURE_EXTENSION ||
                structure.structureType === STRUCTURE_SPAWN ||
                structure.structureType === STRUCTURE_TOWER) &&
              structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
          }
        });
        if (structureTargets.length > 0) {
          if (creep.transfer(structureTargets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(structureTargets[0], { visualizePathStyle: { stroke: "#ffffff" } });
          }
        } else {
          if (creep.room.controller) {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
              creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
            }
          }
        }
      }
    } else {
      const sources = creep.room.find(FIND_SOURCES);
      if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0], { visualizePathStyle: { stroke: "#ffaa00" } });
      }
    }
  }
} as CreepBrain;
