import StructureBrain from "./StructureBrain";

const TowerBrain: StructureBrain<StructureTower> = {
  run(structure: StructureTower) {
    const energy = structure.store[RESOURCE_ENERGY];
    const energyCapacity = structure.store.getCapacity(RESOURCE_ENERGY);
    let done = false;

    if (!done) {
      const closestHostile = structure.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (closestHostile) {
        structure.attack(closestHostile);
        structure.room.visual.text("💢", structure.pos.x + 1, structure.pos.y);
        done = true;
      }
    }

    if (!done) {
      const closestDamagedCreep = structure.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: creep => creep.hits < creep.hitsMax && creep.hits > 0
      });
      if (closestDamagedCreep) {
        structure.heal(closestDamagedCreep);
        structure.room.visual.text("❤️‍🩹", structure.pos.x + 1, structure.pos.y);
        done = true;
      }
    }

    if (!done && energy > energyCapacity * 0.3) {
      const closestDamagedStructure = structure.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: struct => struct.hits < struct.hitsMax && struct.hits > 0
      });
      if (closestDamagedStructure) {
        structure.repair(closestDamagedStructure);
        structure.room.visual.text("🛠️", structure.pos.x + 1, structure.pos.y);
        done = true;
      }
    }

    if (!done && energy > energyCapacity * 0.3) {
      const closestDamagedStructure = structure.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: struct =>
          struct.hits > 0 &&
          ((struct.structureType !== STRUCTURE_WALL &&
            struct.structureType !== STRUCTURE_RAMPART &&
            struct.hits < structure.hitsMax * 0.5) ||
            struct.hits < 10000)
      });
      if (closestDamagedStructure) {
        structure.repair(closestDamagedStructure);
        structure.room.visual.text("🛠️", structure.pos.x + 1, structure.pos.y);
        done = true;
      }
    }

    if (!done && energy > energyCapacity * 0.6) {
      const closestDamagedStructure = structure.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: struct =>
          struct.hits > 0 &&
          ((struct.structureType !== STRUCTURE_WALL &&
            struct.structureType !== STRUCTURE_RAMPART &&
            struct.hits < structure.hitsMax * 0.8) ||
            struct.hits < 1000000)
      });
      if (closestDamagedStructure) {
        structure.repair(closestDamagedStructure);
        structure.room.visual.text("🔨", structure.pos.x + 1, structure.pos.y);
        done = true;
      }
    }
  }
};

export default TowerBrain;
