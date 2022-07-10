import Logger from "utils/Logger";
import { getTowerQuota } from "utils/StructureUtils";
import { Serialized } from "utils/TypeUtils";
import Manager from "./Manager";

const logger = new Logger("ExtensionConstructionManager");

export interface TowerMemory {
  /**
   * How long to wait for before the next check.
   */
  idleTicks: number;
  /**
   * The next tower will be built here.
   */
  nextTower?: Serialized<RoomPosition>;
}

/**
 * How long to idle for when the tower count reaches the quota.
 */
const LongIdleTicks = 200;

const pathFinderOpts: PathFinderOpts = {
  flee: true,
  roomCallback(roomName: string) {
    const r = Game.rooms[roomName];
    const costs = new PathFinder.CostMatrix();
    const terrain = r.getTerrain();
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        if (x === 0 || y === 0 || x === 49 || y === 49) {
          costs.set(x, y, 0xff);
        } else if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
          costs.set(x, y, 1);
        } else {
          costs.set(x, y, 0xff);
        }
      }
    }

    return costs;
  }
};

class TowerConstructionManager extends Manager {
  private countTowers(room: Room): number {
    return (
      room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER }).length +
      room.find(FIND_MY_CONSTRUCTION_SITES, { filter: site => site.structureType === STRUCTURE_TOWER }).length
    );
  }

  private build(room: Room): number {
    let targetPos: RoomPosition;
    if (!room.memory.towers.nextTower) {
      const origins = [...room.find(FIND_MY_SPAWNS)];
      if (origins.length === 0) {
        logger.log(`No spawns or sources found in ${room.name}`);
        return 0;
      }
      const origin = origins[Math.floor(Math.random() * origins.length)];

      const avoid = [
        ...room.find(FIND_SOURCES),
        ...room.find(FIND_STRUCTURES, { filter: s => s.structureType !== STRUCTURE_ROAD }),
        ...room.find(FIND_CONSTRUCTION_SITES, { filter: s => s.structureType !== STRUCTURE_ROAD })
      ];
      if (room.controller) avoid.push(room.controller);

      const path = PathFinder.search(
        origin.pos,
        avoid.map(s => ({ pos: s.pos, range: 2 })),
        pathFinderOpts
      ).path;

      if (path.length === 0) {
        logger.log(`No path found to build tower in ${room.name}`);
        return 0;
      }

      targetPos = path[path.length - 1];
    } else {
      targetPos = new RoomPosition(room.memory.towers.nextTower.x, room.memory.towers.nextTower.y, room.name);
    }

    let count = 0;

    const items = [
      ...room.lookForAt(LOOK_CONSTRUCTION_SITES, targetPos),
      ...room.lookForAt(LOOK_STRUCTURES, targetPos)
    ];
    for (const item of items) {
      if (item instanceof StructureRoad) {
        item.destroy();
        count++;
      } else if (item instanceof ConstructionSite) {
        if (item.structureType === STRUCTURE_ROAD) {
          item.remove();
          count++;
        }
      }
    }

    if (count > 0) {
      logger.log(`Removing roads to make room for tower in ${room.name}`);
      room.memory.towers.nextTower = targetPos;
      return 0;
    }

    count = 0;

    const result = room.createConstructionSite(
      new RoomPosition(targetPos.x, targetPos.y, targetPos.roomName),
      STRUCTURE_TOWER
    );
    if (result !== OK) {
      logger.log(`Failed to build tower at ${targetPos.x},${targetPos.y} in ${room.name} with error ${result}`);
    } else {
      count++;
    }
    room.memory.towers.nextTower = undefined;
    return count;
  }

  public loop(): void {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (!room.controller) continue;
      if (!room.controller.my) continue;

      if (room.memory.towers === undefined) {
        room.memory.towers = {
          idleTicks: LongIdleTicks
        };
      }

      if (room.memory.towers.idleTicks === undefined) {
        room.memory.towers.idleTicks = LongIdleTicks;
      }

      if (room.memory.towers.idleTicks > 0) {
        room.memory.towers.idleTicks--;
        continue;
      }

      const towerCount = this.countTowers(room);
      const towerQuota = getTowerQuota(room);

      if (towerCount >= towerQuota) {
        room.memory.towers.idleTicks = LongIdleTicks;
        continue;
      }
      const count = this.build(room);
      if (count) {
        room.memory.towers.idleTicks = 0;
        logger.log(`Built extension in ${room.name}, ${towerCount}+${count}/${towerQuota}`);
      } else {
        room.memory.towers.idleTicks = 10;
      }
    }
  }
}

export default new TowerConstructionManager();
