import Logger from "utils/Logger";
import Manager from "./Manager";

const logger = new Logger("ContainerConstructionManager");

export interface ContainerMemory {
  /**
   * How long to wait for before the next check.
   */
  idleTicks: number;
}

/**
 * How long to idle for after a construction phase.
 */
const IdleTicks = 200;

class ContainerConstructionManager extends Manager {
  private countContainers(room: Room): number {
    return (
      room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER }).length +
      room.find(FIND_CONSTRUCTION_SITES, { filter: site => site.structureType === STRUCTURE_CONTAINER }).length
    );
  }

  private build(room: Room): number {
    let count = 0;

    const sources = room.find(FIND_SOURCES);
    if (sources.length > 0) {
      for (const source of sources) {
        const items = room.lookAtArea(source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
        if (items.find(x => x.structure && x.structure.structureType === STRUCTURE_CONTAINER)) continue;
        const spots = items.filter(x => x.terrain && x.terrain !== "wall");
        const spot = spots.filter(
          x =>
            !items.some(y => y.x === x.x && y.y === x.y && y.structure && y.structure.structureType !== STRUCTURE_ROAD)
        )[0];
        if (room.createConstructionSite(new RoomPosition(spot.x, spot.y, room.name), STRUCTURE_CONTAINER) === OK) {
          count++;
        }
      }
    }

    const minerals = room.find(FIND_MINERALS);
    if (minerals.length > 0) {
      for (const mineral of minerals) {
        const items = room.lookAtArea(mineral.pos.y - 1, mineral.pos.x - 1, mineral.pos.y + 1, mineral.pos.x + 1, true);
        if (items.find(x => x.structure && x.structure.structureType === STRUCTURE_CONTAINER)) continue;
        const spots = items.filter(x => x.terrain && x.terrain !== "wall");
        const spot = spots.filter(
          x =>
            !items.some(y => y.x === x.x && y.y === x.y && y.structure && y.structure.structureType !== STRUCTURE_ROAD)
        )[0];
        if (room.createConstructionSite(new RoomPosition(spot.x, spot.y, room.name), STRUCTURE_CONTAINER) === OK) {
          count++;
        }
      }
    }

    return count;
  }

  public loop(): void {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (!room.controller) continue;
      if (!room.controller.my) continue;

      if (room.memory.containers === undefined) {
        room.memory.containers = {
          idleTicks: IdleTicks
        };
      }

      if (room.memory.containers.idleTicks === undefined) {
        room.memory.containers.idleTicks = IdleTicks;
      }

      if (room.memory.containers.idleTicks > 0) {
        room.memory.containers.idleTicks--;
        continue;
      }

      if (room.controller.level < 2) {
        room.memory.containers.idleTicks = IdleTicks;
        continue;
      }

      const containerCount = this.countContainers(room);

      if (containerCount >= 5) {
        room.memory.containers.idleTicks = IdleTicks;
        continue;
      }

      const count = this.build(room);
      if (count) {
        logger.log(`Built container in ${room.name}, ${containerCount}+${count}/5`);
      }
      room.memory.containers.idleTicks = IdleTicks;
    }
  }
}

export default new ContainerConstructionManager();
