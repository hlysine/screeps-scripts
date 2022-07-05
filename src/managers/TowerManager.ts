import Manager from "./Manager";

class TowerManager extends Manager {
  private runTower(structure: StructureTower): void {
    const energy = structure.store[RESOURCE_ENERGY];
    const energyCapacity = structure.store.getCapacity(RESOURCE_ENERGY);
    let done = false;

    if (!done) {
      const closestHostile = structure.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (closestHostile) {
        structure.attack(closestHostile);
        structure.room.visual.text("💢", structure.pos.x + 1, structure.pos.y, { align: "left", opacity: 0.5 });
        done = true;
      }
    }

    if (!done) {
      const closestDamagedCreep = structure.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: creep => creep.hits < creep.hitsMax && creep.hits > 0
      });
      if (closestDamagedCreep) {
        structure.heal(closestDamagedCreep);
        structure.room.visual.text("❤️‍🩹", structure.pos.x + 1, structure.pos.y, { align: "left", opacity: 0.5 });
        done = true;
      }
    }

    if (!done && energy > energyCapacity * 0.5) {
      const target = structure.room
        .find(FIND_MY_STRUCTURES, {
          filter: struct => {
            if (struct.structureType === STRUCTURE_RAMPART) {
              return struct.hits < 100000;
            } else {
              return struct.hits < struct.hitsMax && struct.hits > 0;
            }
          }
        })
        .minBy(struct => struct.hits);
      if (target) {
        structure.repair(target);
        structure.room.visual.text("🛠️✅", structure.pos.x + 1, structure.pos.y, { align: "left", opacity: 0.5 });
        done = true;
      }
    }

    if (!done && energy > energyCapacity * 0.5) {
      const target = structure.room
        .find(FIND_STRUCTURES, {
          filter: struct => {
            if (struct.structureType === STRUCTURE_WALL) {
              return struct.hits < 10000;
            } else if (struct.structureType === STRUCTURE_ROAD) {
              return struct.hits < struct.hitsMax * 0.5;
            }
            return false;
          }
        })
        .minBy(struct => struct.hits);
      if (target) {
        structure.repair(target);
        structure.room.visual.text("🛠️", structure.pos.x + 1, structure.pos.y, { align: "left", opacity: 0.5 });
        done = true;
      }
    }

    if (!done && energy > energyCapacity * 0.8) {
      const target = structure.room
        .find(FIND_STRUCTURES, {
          filter: struct => {
            if (struct.structureType === STRUCTURE_ROAD) {
              return struct.hits < struct.hitsMax * 0.8;
            }
            return false;
          }
        })
        .minBy(struct => struct.hits);
      if (target) {
        structure.repair(target);
        structure.room.visual.text("🛠️", structure.pos.x + 1, structure.pos.y, { align: "left", opacity: 0.5 });
        done = true;
      }
    }
  }

  public loop(): void {
    for (const name in Game.structures) {
      const structure = Game.structures[name];
      if (structure instanceof StructureTower) {
        this.runTower(structure);
      }
    }
  }
}

export default new TowerManager();
