import StructureBrain from "./StructureBrain";

export default {
  run(structure: StructureTower) {
    const closestDamagedStructure = structure.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: struct => struct.hits < struct.hitsMax
    });
    if (closestDamagedStructure) {
      structure.repair(closestDamagedStructure);
    }

    const closestHostile = structure.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (closestHostile) {
      structure.attack(closestHostile);
    }
  }
} as StructureBrain<StructureTower>;
