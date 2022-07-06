import Logger from "utils/Logger";
import Manager from "./Manager";

const logger = new Logger("RoadConstructionManager");

export interface RoadMemory {
  /**
   * Serialized cost matrix recording the number of times a creep gets fatigued at a certain spot.
   */
  cost: number[] | undefined;
  /**
   * The number of ticks until the next round of construction start.
   */
  surveyTicks: number;
  /**
   * How long to wait for before the next survey-construct cycle.
   */
  idleTicks: number;
  /**
   * Whether the seed roads have been constructed.
   */
  seeded: boolean;
}

interface RoadInfo {
  roadCount: number;
  spaceCount: number;
  maxRoads: number;
}

interface Spot {
  x: number;
  y: number;
  cost: number;
}

const MaxSurveyTicks = 1000;

class RoadConstructionManager extends Manager {
  private countRoads(room: Room): number {
    return room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_ROAD }).length;
  }

  private countOpenSpace(room: Room): number {
    let wallCount = 0;
    const terrain = room.getTerrain();
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
          wallCount++;
        }
      }
    }
    return 50 * 50 - wallCount;
  }

  private getRoadInfo(room: Room): RoadInfo {
    const roadCount = this.countRoads(room);
    const spaceCount = this.countOpenSpace(room);
    const maxRoads = Math.ceil(spaceCount / 10);
    return { roadCount, spaceCount, maxRoads };
  }

  private survey(room: Room, cost: CostMatrix) {
    for (const creepName in Game.creeps) {
      const creep = Game.creeps[creepName];
      if (creep.pos.roomName !== room.name) continue;
      if (creep.fatigue === 0) continue;
      if (room.lookForAt(LOOK_STRUCTURES, creep.pos).length > 0) continue;
      cost.set(creep.pos.x, creep.pos.y, cost.get(creep.pos.x, creep.pos.y) + 1);
    }
  }

  private constructSeed(room: Room, info: RoadInfo) {
    if (info.roadCount >= info.maxRoads) return;
    let remainingQuota = Math.min(75, info.maxRoads - info.roadCount);

    const paths: RoomPosition[] = [];
    const spawns = room.find(FIND_MY_SPAWNS);
    if (spawns.length === 0) {
      logger.error(`Road construction failed. No spawns found in ${room.name}`);
      return;
    }
    const pathFinderOpts = {
      plainCost: 2,
      swampCost: 10,

      roomCallback(roomName: string) {
        const r = Game.rooms[roomName];
        const costs = new PathFinder.CostMatrix();
        if (!r) return costs;

        r.find(FIND_STRUCTURES).forEach(struct => {
          if (struct.structureType === STRUCTURE_ROAD) {
            // Favor roads over plain tiles
            costs.set(struct.pos.x, struct.pos.y, 1);
          } else if (
            struct.structureType !== STRUCTURE_CONTAINER &&
            (struct.structureType !== STRUCTURE_RAMPART || !struct.my)
          ) {
            // Can't walk through non-walkable buildings
            costs.set(struct.pos.x, struct.pos.y, 0xff);
          }
        });

        return costs;
      }
    };
    const spawn = spawns[0];
    if (room.controller) paths.push(...PathFinder.search(spawn.pos, room.controller.pos, pathFinderOpts).path);
    const sources = room.find(FIND_SOURCES);
    for (const source of sources) {
      paths.push(...PathFinder.search(spawn.pos, source.pos, pathFinderOpts).path);
    }

    for (const path of paths) {
      const structures = room.lookForAt(LOOK_STRUCTURES, path);
      if (structures.length === 0) {
        const road = room.createConstructionSite(path, STRUCTURE_ROAD);
        if (road === OK) {
          info.roadCount++;
          remainingQuota--;
          if (remainingQuota === 0) break;
        }
      }
    }
    room.memory.seeded = true;
  }

  private construct(room: Room, cost: CostMatrix, info: RoadInfo) {
    if (info.roadCount >= info.maxRoads) return;
    if (!room.memory.seeded) {
      logger.log(`Constructing seed for ${room.name}`);
      this.constructSeed(room, info);
      return;
    }
    const remainingQuota = Math.min(75, info.maxRoads - info.roadCount);
    const spots: Spot[] = [];
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        spots.push({ x, y, cost: cost.get(x, y) });
      }
    }
    spots.filter(s => s.cost > 0).sort((a, b) => b.cost - a.cost);
    const averageCost = spots.reduce((sum, s) => sum + s.cost, 0) / spots.length;
    const spotsToBuild = spots.filter(s => s.cost > averageCost * 0.7);
    if (spotsToBuild.length > remainingQuota) {
      spotsToBuild.splice(remainingQuota, spotsToBuild.length - remainingQuota);
    }
    for (const spot of spotsToBuild) {
      const road = room.createConstructionSite(spot.x, spot.y, STRUCTURE_ROAD);
      if (road === OK) {
        info.roadCount++;
      }
    }
  }

  public loop(): void {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (!room.controller) continue;
      if (!room.controller.my) continue;

      if (room.memory.seeded === undefined) {
        room.memory.seeded = false;
      }

      if (room.memory.idleTicks === undefined) {
        room.memory.idleTicks = 0;
      }

      if (room.memory.idleTicks > 0) {
        room.memory.idleTicks--;
        continue;
      }

      let constructingRoad = false;
      for (const siteName in Game.constructionSites) {
        const site = Game.constructionSites[siteName];
        if (site.pos.roomName === roomName && site.structureType === STRUCTURE_ROAD) {
          constructingRoad = true;
          break;
        }
      }
      if (constructingRoad) {
        room.memory.idleTicks = 10;
        continue;
      }

      if (room.memory.surveyTicks === undefined) {
        room.memory.surveyTicks = MaxSurveyTicks;
      }

      if (room.memory.cost === undefined) {
        room.memory.cost = new PathFinder.CostMatrix().serialize();
      }
      const cost = PathFinder.CostMatrix.deserialize(room.memory.cost);

      if (room.memory.surveyTicks > 0 && room.memory.seeded) {
        logger.log(`Surveying ${room.name}, ${room.memory.surveyTicks} ticks left`);
        this.survey(room, cost);
        room.memory.cost = cost.serialize();
        room.memory.surveyTicks--;
      } else {
        const info = this.getRoadInfo(room);
        logger.log(`Constructing roads for ${room.name}, ${info.roadCount}/${info.maxRoads}`);
        this.construct(room, cost, info);
        room.memory.cost = undefined;
        room.memory.surveyTicks = MaxSurveyTicks;
        if (info.roadCount >= info.maxRoads) {
          room.memory.idleTicks = 20000;
        } else {
          room.memory.idleTicks = 200;
        }
        logger.log(
          `Construction for ${room.name} complete, ${info.roadCount}/${info.maxRoads} idling for ${room.memory.idleTicks} ticks`
        );
      }
    }
  }
}

export default new RoadConstructionManager();
