import Logger from "utils/Logger";
import { getExtensionQuota } from "utils/StructureUtils";
import { Serialized } from "utils/TypeUtils";
import Manager from "./Manager";

const logger = new Logger("ExtensionConstructionManager");

export interface ExtensionMemory {
  /**
   * How long to wait for before the next check.
   */
  idleTicks: number;
  /**
   * The next extension cluster will be built here.
   */
  nextCluster?: Serialized<RoomPosition>;
}

/**
 * How long to idle for when the extension count reaches the quota.
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
          let done = false;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (i !== 0 || j !== 0) {
                const tile = terrain.get(x + i, y + j);
                if (tile === TERRAIN_MASK_WALL) {
                  costs.set(x, y, 0xff);
                  done = true;
                }
              }
              if (done) break;
            }
            if (done) break;
          }
        } else {
          costs.set(x, y, 0xff);
        }
      }
    }

    if (!r) return costs;

    const origins = r.find(FIND_MY_SPAWNS);
    for (const origin of origins) {
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          costs.set(origin.pos.x + x, origin.pos.y + y, 0);
        }
      }
    }

    return costs;
  }
};

class ExtensionConstructionManager extends Manager {
  private countExtensions(room: Room): number {
    return (
      room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTENSION }).length +
      room.find(FIND_MY_CONSTRUCTION_SITES, { filter: site => site.structureType === STRUCTURE_EXTENSION }).length
    );
  }

  private build(room: Room): number {
    let targetPos: RoomPosition;
    if (!room.memory.extensions.nextCluster) {
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
        avoid.map(s => ({ pos: s.pos, range: s instanceof Source ? 3 : 2 })),
        pathFinderOpts
      ).path;

      if (path.length === 0) {
        logger.log(`No path found to build extension in ${room.name}`);
        return 0;
      }

      targetPos = path[path.length - 1];
    } else {
      targetPos = new RoomPosition(
        room.memory.extensions.nextCluster.x,
        room.memory.extensions.nextCluster.y,
        room.name
      );
    }

    if (
      room
        .lookForAtArea(LOOK_STRUCTURES, targetPos.y - 2, targetPos.x - 2, targetPos.y + 2, targetPos.x + 2, true)
        .find(
          s =>
            s.structure.structureType === STRUCTURE_SPAWN &&
            Math.abs(s.structure.pos.x - targetPos.x) !== Math.abs(s.structure.pos.y - targetPos.y) // allow diagonal placement
        )
    ) {
      logger.log(`Cannot build extension at ${targetPos.toString()} because it is too close to a spawn`);
      return 0;
    }

    const offsets = [
      [0, 0],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ];

    let count = 0;

    for (const offset of offsets) {
      const pos = new RoomPosition(targetPos.x + offset[0], targetPos.y + offset[1], room.name);
      const items = [...room.lookForAt(LOOK_CONSTRUCTION_SITES, pos), ...room.lookForAt(LOOK_STRUCTURES, pos)];
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
    }
    if (count > 0) {
      logger.log(`Removing roads to make room for extension in ${room.name}`);
      room.memory.extensions.nextCluster = targetPos;
      return 0;
    }
    count = 0;

    for (const offset of offsets) {
      const result = room.createConstructionSite(
        new RoomPosition(targetPos.x + offset[0], targetPos.y + offset[1], targetPos.roomName),
        STRUCTURE_EXTENSION
      );
      if (result !== OK) {
        logger.log(`Failed to build extension at ${targetPos.x},${targetPos.y} in ${room.name} with error ${result}`);
      } else {
        count++;
      }
    }
    room.memory.extensions.nextCluster = undefined;
    return count;
  }

  protected override loop(): void {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (!room.controller) continue;
      if (!room.controller.my) continue;

      if (room.memory.extensions === undefined) {
        room.memory.extensions = {
          idleTicks: LongIdleTicks
        };
      }

      if (room.memory.extensions.idleTicks === undefined) {
        room.memory.extensions.idleTicks = LongIdleTicks;
      }

      if (room.memory.extensions.idleTicks > 0) {
        room.memory.extensions.idleTicks--;
        continue;
      }

      const extensionCount = this.countExtensions(room);
      const extensionQuota = getExtensionQuota(room);

      if (extensionCount >= extensionQuota) {
        room.memory.extensions.idleTicks = LongIdleTicks;
        continue;
      }
      const count = this.build(room);
      if (count) {
        room.memory.extensions.idleTicks = 0;
        logger.log(`Built extension in ${room.name}, ${extensionCount}+${count}/${extensionQuota}`);
      } else {
        room.memory.extensions.idleTicks = 10;
      }
    }
  }
}

export default new ExtensionConstructionManager();
