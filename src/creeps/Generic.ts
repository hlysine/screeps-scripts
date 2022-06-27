import CreepBrain from "./CreepBrain";
import { findFreeSpots } from "utils/SourceUtils";

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
      creep.memory.target = creep.pos;
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
      creep.memory.target = creep.pos;
      const sources = creep.room.find(FIND_SOURCES);
      let done = false;
      for (const target of sources) {
        if (creep.harvest(target) === OK) {
          done = true;
        }
      }
      if (!done) {
        for (const target of sources) {
          if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
            const freeSpots = findFreeSpots(target);
            if (freeSpots.length) {
              creep.moveTo(freeSpots[0], { visualizePathStyle: { stroke: "#ffaa00" } });
              creep.memory.target = freeSpots[0];
              break;
            }
          }
        }
      }
    }
  }
} as CreepBrain;
