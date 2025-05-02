import Logger from "utils/Logger";
import { getPathError } from "utils/MoveUtils";
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
   * The level of the room when the seed is last constructed.
   */
  roomLevel: number;
  /**
   * The maximum number of roads allowed.
   */
  maxRoads: number;
}

interface Spot {
  x: number;
  y: number;
  cost: number;
}
/**
 * The minimum level of the room to start constructing roads.
 */
const RoomLevelThreshold = 3;
/**
 * Number of ticks to wait if there are more roads to build.
 */
const BuildIdleTicks = 400;
/**
 * Number of ticks to wait if there are no more roads to build.
 */
const LongIdleTicks = 20000;
/**
 * How long each survey lasts for.
 */
const MaxSurveyTicks = 2500;
/**
 * A tile should have a fatigue of at least this percentage of maximum to be considered for construction.
 */
const BuildThreshold = 0.85;
/**
 * The maximum number of roads to build for the seeding phase.
 */
const SeedQuota = 50;
/**
 * The maximum number of roads to build per cycle of surveying.
 */
const ConstructQuota = 15;
/**
 * The maximum number of roads allowed for a room is equal to the combined path length times this number.
 */
const MaxRoadsMultiplier = 1.75;

const pathFinderOpts = {
  plainCost: 2,
  swampCost: 10,

  roomCallback(roomName: string) {
    const r = Game.rooms[roomName];
    const costs = new PathFinder.CostMatrix();
    const terrain = Game.map.getRoomTerrain(roomName);
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        if (x === 0 || y === 0 || x === 49 || y === 49) costs.set(x, y, 0xff);
        else costs.set(x, y, terrain.get(x, y) === TERRAIN_MASK_WALL ? 0xff : 1);
      }
    }
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

class RoadConstructionManager extends Manager {
  private countRoads(room: Room): number {
    return (
      room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_ROAD }).length +
      room.find(FIND_CONSTRUCTION_SITES, { filter: site => site.structureType === STRUCTURE_ROAD }).length
    );
  }

  private getMaxRoads(room: Room): number {
    const spawns = room.find(FIND_MY_SPAWNS);
    if (spawns.length === 0) {
      return 0;
    }
    const spawn = spawns[0];
    const sources: (Source | Mineral)[] = room.find(FIND_SOURCES);
    if (room.controller) {
      if (room.controller.level >= 6) {
        sources.push(...room.find(FIND_MINERALS));
      }
    }
    let totalLength = 0;
    for (const source of sources) {
      totalLength += PathFinder.search(spawn.pos, { pos: source.pos, range: 1 }, pathFinderOpts).path.length;
    }
    if (room.controller) {
      totalLength += PathFinder.search(spawn.pos, { pos: room.controller.pos, range: 1 }, pathFinderOpts).path.length;
    }
    return totalLength * MaxRoadsMultiplier;
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

  private constructSeed(room: Room, roadCount: number): number {
    if (roadCount >= room.memory.roads.maxRoads) return 0;
    let remainingQuota = Math.min(SeedQuota, room.memory.roads.maxRoads - roadCount);

    const paths: RoomPosition[] = [];
    const spawns = room.find(FIND_MY_SPAWNS);
    if (spawns.length === 0) {
      logger.log(`Road construction failed. No spawns found in ${room.name}`);
      return 0;
    }
    const spawn = spawns[0];
    if (room.controller) {
      const result = PathFinder.search(spawn.pos, { pos: room.controller.pos, range: 1 }, pathFinderOpts);
      if (getPathError(result, room.controller.pos)) paths.push(...result.path);
    }
    const sources: (Source | Mineral)[] = room.find(FIND_SOURCES);
    if ((room.controller?.level ?? 0) >= 6) {
      sources.push(...room.find(FIND_MINERALS));
    }
    for (const source of sources) {
      const result = PathFinder.search(spawn.pos, { pos: source.pos, range: 1 }, pathFinderOpts);
      if (getPathError(result, source.pos)) paths.push(...result.path);
    }

    let buildCount = 0;
    for (const path of paths) {
      const structures = room.lookForAt(LOOK_STRUCTURES, path);
      if (structures.length === 0) {
        const road = room.createConstructionSite(path, STRUCTURE_ROAD);
        if (road === OK) {
          buildCount++;
          remainingQuota--;
          if (remainingQuota === 0) break;
        }
      }
    }
    room.memory.roads.roomLevel = room.controller?.level ?? 0;
    return buildCount;
  }

  private construct(room: Room, cost: CostMatrix, roadCount: number): number {
    if (roadCount >= room.memory.roads.maxRoads) return 0;
    if (room.memory.roads.roomLevel < (room.controller?.level ?? 0)) {
      logger.log(`Constructing seed for ${room.name}`);
      return this.constructSeed(room, roadCount);
    }
    const remainingQuota = Math.min(ConstructQuota, room.memory.roads.maxRoads - roadCount);
    const spots: Spot[] = [];
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        spots.push({ x, y, cost: cost.get(x, y) });
      }
    }
    spots.filter(s => s.cost > 0).sort((a, b) => b.cost - a.cost);
    const averageCost = spots.reduce((sum, s) => sum + s.cost, 0) / spots.length;
    const spotsToBuild = spots.filter(s => s.cost > averageCost * BuildThreshold);
    if (spotsToBuild.length > remainingQuota) {
      spotsToBuild.splice(remainingQuota, spotsToBuild.length - remainingQuota);
    }
    let buildCount = 0;
    for (const spot of spotsToBuild) {
      const road = room.createConstructionSite(spot.x, spot.y, STRUCTURE_ROAD);
      if (road === OK) {
        buildCount++;
      }
    }
    return buildCount;
  }

  protected override loop(): void {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (!room.controller) continue;
      if (!room.controller.my) continue;

      if (room.controller.level < RoomLevelThreshold) continue;

      if (room.memory.roads === undefined) {
        room.memory.roads = {
          cost: new PathFinder.CostMatrix().serialize(),
          surveyTicks: MaxSurveyTicks,
          idleTicks: BuildIdleTicks,
          roomLevel: 0,
          maxRoads: this.getMaxRoads(room)
        };
      }

      if (room.memory.roads.roomLevel === undefined) {
        room.memory.roads.roomLevel = 0;
      }

      if (room.memory.roads.idleTicks === undefined) {
        room.memory.roads.idleTicks = BuildIdleTicks;
      }

      if (room.memory.roads.idleTicks > 0) {
        room.memory.roads.idleTicks--;
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
        room.memory.roads.idleTicks = 10;
        continue;
      }

      if (room.memory.roads.surveyTicks === undefined) {
        room.memory.roads.surveyTicks = MaxSurveyTicks;
      }

      if (room.memory.roads.cost === undefined) {
        room.memory.roads.cost = new PathFinder.CostMatrix().serialize();
      }
      const cost = PathFinder.CostMatrix.deserialize(room.memory.roads.cost);

      if (room.memory.roads.surveyTicks > 0 && room.memory.roads.roomLevel >= (room.controller?.level ?? 0)) {
        logger.log(`Surveying ${room.name}, ${room.memory.roads.surveyTicks} ticks left`);
        this.survey(room, cost);
        room.memory.roads.cost = cost.serialize();
        room.memory.roads.surveyTicks--;
      } else {
        room.memory.roads.maxRoads = this.getMaxRoads(room);
        const roadCount = this.countRoads(room);
        logger.log(`Constructing roads for ${room.name}, ${roadCount}/${room.memory.roads.maxRoads}`);
        const buildCount = this.construct(room, cost, roadCount);
        room.memory.roads.cost = undefined;
        room.memory.roads.surveyTicks = MaxSurveyTicks;
        if (roadCount + buildCount >= room.memory.roads.maxRoads) {
          room.memory.roads.idleTicks = LongIdleTicks;
        } else {
          room.memory.roads.idleTicks = BuildIdleTicks;
        }
        logger.log(
          `Construction for ${room.name} complete, ${roadCount}+${buildCount}/${room.memory.roads.maxRoads}, idling for ${room.memory.roads.idleTicks} ticks`
        );
      }
    }
  }
}

export default new RoadConstructionManager();
