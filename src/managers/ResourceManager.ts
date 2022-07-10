import Manager from "./Manager";
import { getWorldPathDistance, isSpotObstructed, positionEquals } from "utils/MoveUtils";
import { isRoomRestricted } from "utils/StructureUtils";
import FlagTags from "utils/FlagTags";
import { HarvestTaskId } from "creep/tasks/HarvestTask";

export interface MiningSpot {
  pos: RoomPosition;
  resourceType: ResourceConstant;
  resourceId?: Id<Mineral> | Id<Source>;
}

type ResourceMap<T> = {
  [key in ResourceConstant]?: T;
};

interface CachedRoom {
  visible: boolean;
  /**
   * A room may be ignored if there are no flags there or if it is restricted due to controller level.
   */
  ignored: boolean;
  availableSpots: ResourceMap<MiningSpot[]>;
}

interface RoomHarvestCache {
  [roomName: string]: CachedRoom;
}

export interface Reservation {
  spot: MiningSpot;
  creep: Creep;
  distance: number;
  get pos(): RoomPosition;
}

interface RoomResourceInfo {
  freeSpots: MiningSpot[];
  reservedSpots: Reservation[];
  /**
   * Spots are dedicated if there is a container at that spot.
   */
  dedicatedSpots: MiningSpot[];
}

class ResourceManager extends Manager {
  private roomCache?: RoomHarvestCache;
  private resourceInfo: ResourceMap<RoomResourceInfo> = {};
  private globalSpotsCache?: RoomResourceInfo;
  public visualization = false;

  /**
   * Check if a room is ignored. This is the case if there are no flags there or if it is restricted due to controller level.
   * @param roomName The room to check.
   * @returns Whether the room should be ignored for harvesting.
   */
  private isRoomIgnored(roomName: string): boolean {
    const room = Game.rooms[roomName];
    if (room) {
      if (room.controller && room.controller.my) return false;
      if (isRoomRestricted(room)) return true;
      if (
        Object.values(Game.flags).find(
          flag => flag.pos.roomName === room.name && flag.name.toLowerCase().includes("#" + FlagTags.Harvest)
        )
      )
        return false;
      return true;
    } else {
      if (
        Object.values(Game.flags).find(
          flag => flag.pos.roomName === roomName && flag.name.toLowerCase().includes("#" + FlagTags.Harvest)
        )
      )
        return false;
      return true;
    }
  }

  /**
   * Get all available mining spots in a visible room, including both sources and minerals.
   * @param room The room to get the spots from.
   * @returns All available mining spots, mapped by resource type.
   */
  private getAvailableSpots(room: Room): ResourceMap<MiningSpot[]> {
    const ret: ResourceMap<MiningSpot[]> = {};
    room.find(FIND_SOURCES).forEach(source => {
      room
        .lookForAtArea(LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true)
        .forEach(tile => {
          if (tile.terrain !== "wall") {
            if (!ret[RESOURCE_ENERGY]) ret[RESOURCE_ENERGY] = [];
            ret[RESOURCE_ENERGY].push({
              pos: new RoomPosition(tile.x, tile.y, room.name),
              resourceType: RESOURCE_ENERGY,
              resourceId: source.id
            });
          }
        });
    });
    room.find(FIND_MINERALS).forEach(mineral => {
      if (!mineral.pos.lookFor(LOOK_STRUCTURES).some(structure => structure.structureType === STRUCTURE_EXTRACTOR))
        return;
      room
        .lookForAtArea(LOOK_TERRAIN, mineral.pos.y - 1, mineral.pos.x - 1, mineral.pos.y + 1, mineral.pos.x + 1, true)
        .forEach(tile => {
          if (tile.terrain !== "wall") {
            if (!ret[mineral.mineralType]) ret[mineral.mineralType] = [];
            (ret[mineral.mineralType] as MiningSpot[]).push({
              pos: new RoomPosition(tile.x, tile.y, room.name),
              resourceType: mineral.mineralType,
              resourceId: mineral.id
            });
          }
        });
    });
    return ret;
  }

  /**
   * Checks the terrain of an invisible room to find nearby available spots.
   * @param source The position of the source.
   * @returns Spots around this spot that can be used for harvesting.
   */
  private getAvailableSpotsInvisible(source: RoomPosition): MiningSpot[] {
    const ret: MiningSpot[] = [];
    const terrain = new Room.Terrain(source.roomName);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i !== 0 || j !== 0) {
          const tile = terrain.get(source.x + i, source.y + j);
          if (tile !== TERRAIN_MASK_WALL) {
            ret.push({
              pos: new RoomPosition(source.x + i, source.y + j, source.roomName),
              // todo: this is just an assumption because we have no way of knowing the resource type
              resourceType: RESOURCE_ENERGY
            });
          }
        }
      }
    }
    return ret;
  }

  private computeCache(): RoomHarvestCache {
    const newCache: RoomHarvestCache = {};
    Object.values(Game.rooms).forEach(room => {
      newCache[room.name] = {
        visible: true,
        ignored: this.isRoomIgnored(room.name),
        availableSpots: this.getAvailableSpots(room)
      };
    });
    Object.values(Game.flags).forEach(flag => {
      if (!flag.name.toLowerCase().includes("#" + FlagTags.Harvest)) return;

      const cache = newCache[flag.pos.roomName];
      if (!cache) {
        newCache[flag.pos.roomName] = {
          visible: false,
          ignored: this.isRoomIgnored(flag.pos.roomName),
          // assuming that the flag is placed on a source because we have no way of knowing
          // the resource type without room visibility.
          availableSpots: { [RESOURCE_ENERGY]: this.getAvailableSpotsInvisible(flag.pos) }
        };
      } else if (!cache.visible) {
        if (!cache.availableSpots[RESOURCE_ENERGY]) cache.availableSpots[RESOURCE_ENERGY] = [];
        cache.availableSpots[RESOURCE_ENERGY].push(...this.getAvailableSpotsInvisible(flag.pos));
      }
    });
    // only allow 1 creep to go to invisible rooms
    // to avoid a hoard of creeps going there just to discover that they can't harvest
    for (const roomName in newCache) {
      const cache = newCache[roomName];
      if (!cache.visible) {
        if (!cache.availableSpots[RESOURCE_ENERGY]) cache.availableSpots[RESOURCE_ENERGY] = [];
        else cache.availableSpots[RESOURCE_ENERGY].splice(1, cache.availableSpots[RESOURCE_ENERGY].length - 1);
      }
    }
    return newCache;
  }

  private computeGlobalSpots(): RoomResourceInfo {
    const freeSpots: MiningSpot[] = [];
    for (const resource in this.resourceInfo) {
      freeSpots.push(...this.getResourceInfo(resource as ResourceConstant).freeSpots);
    }

    const reservedSpots: Reservation[] = [];
    for (const resource in this.resourceInfo) {
      reservedSpots.push(...this.getResourceInfo(resource as ResourceConstant).reservedSpots);
    }

    const dedicatedSpots: MiningSpot[] = [];
    for (const resource in this.resourceInfo) {
      dedicatedSpots.push(...this.getResourceInfo(resource as ResourceConstant).dedicatedSpots);
    }

    return { freeSpots, reservedSpots, dedicatedSpots };
  }

  public isRoomAvailable(roomName: string): boolean {
    if (!this.roomCache) this.roomCache = this.computeCache();
    const cache = this.roomCache[roomName];
    if (!cache) return false;
    return !cache.ignored;
  }

  public getResourceInfo(resource: ResourceConstant): RoomResourceInfo {
    return (
      this.resourceInfo[resource] ??
      (this.resourceInfo[resource] = {
        freeSpots: [],
        reservedSpots: [],
        dedicatedSpots: []
      })
    );
  }

  public invalidateCache(): void {
    this.roomCache = undefined;
  }

  public get freeSpots(): MiningSpot[] {
    if (!this.globalSpotsCache) this.globalSpotsCache = this.computeGlobalSpots();
    return this.globalSpotsCache.freeSpots;
  }

  public get reservedSpots(): Reservation[] {
    if (!this.globalSpotsCache) this.globalSpotsCache = this.computeGlobalSpots();
    return this.globalSpotsCache.reservedSpots;
  }

  public get dedicatedSpots(): MiningSpot[] {
    if (!this.globalSpotsCache) this.globalSpotsCache = this.computeGlobalSpots();
    return this.globalSpotsCache.dedicatedSpots;
  }

  public claimFreeSpot(resourceType: ResourceConstant, spot: MiningSpot): void {
    const info = this.getResourceInfo(resourceType);
    info.freeSpots = info.freeSpots.filter(s => !positionEquals(s.pos, spot.pos));
  }

  public claimDedicatedSpot(resourceType: ResourceConstant, spot: MiningSpot): void {
    const info = this.getResourceInfo(resourceType);
    info.dedicatedSpots = info.dedicatedSpots.filter(s => !positionEquals(s.pos, spot.pos));
  }

  public claimReservedSpot(resourceType: ResourceConstant, spot: MiningSpot): void {
    const info = this.getResourceInfo(resourceType);
    const reservation = info.reservedSpots.find(r => positionEquals(r.spot.pos, spot.pos));
    if (reservation) {
      info.reservedSpots = info.reservedSpots.filter(r => r !== reservation);
      reservation.creep.terminateTask(HarvestTaskId);
    }
  }

  public loop(): void {
    // compute room cache if it's not already computed
    if (!this.roomCache) this.roomCache = this.computeCache();
    const creeps = Object.values(Game.creeps);

    // update room cache when visibility and flags change
    for (const roomName in Game.rooms) {
      const cache = this.roomCache[roomName];
      const room = Game.rooms[roomName];
      if (!cache || !cache.visible) {
        this.roomCache[roomName] = {
          visible: true,
          ignored: this.isRoomIgnored(roomName),
          availableSpots: this.getAvailableSpots(room)
        };
      }
    }
    for (const roomName in this.roomCache) {
      this.roomCache[roomName].ignored = this.isRoomIgnored(roomName);
    }

    const lastReservations: ResourceMap<Reservation[]> = {};
    // remove mining spot data from last tick, caching reserved spots
    for (const resource in this.resourceInfo) {
      const info = this.getResourceInfo(resource as ResourceConstant);
      info.freeSpots = [];
      lastReservations[resource as ResourceConstant] = info.reservedSpots;
      info.reservedSpots = [];
      info.dedicatedSpots = [];
    }
    this.globalSpotsCache = undefined;

    for (const roomName in this.roomCache) {
      const cache = this.roomCache[roomName];
      if (cache.ignored) continue;
      for (const resourceName in cache.availableSpots) {
        const resourceType = resourceName as ResourceConstant;
        const spots = cache.availableSpots[resourceType];
        if (spots === undefined) continue;
        spots.forEach(spot => {
          if (spot.resourceId) {
            const resource = Game.getObjectById(spot.resourceId);
            if (resource) {
              if (resource instanceof Mineral && resource.mineralAmount <= 0) return;
              if (resource instanceof Source && resource.energy <= 0) return;
              if (resource.room && isRoomRestricted(resource.room)) return;
            }
          }

          if (isSpotObstructed(spot.pos)) return;
          const creep = creeps.find(c => c.memory.target && positionEquals(c.memory.target, spot.pos));
          if (creep === undefined) {
            let container: StructureContainer | undefined;
            if (Game.rooms[spot.pos.roomName]) {
              container = Game.rooms[spot.pos.roomName]
                .lookForAt(LOOK_STRUCTURES, spot.pos)
                .find(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer | undefined;
            }
            if (container) this.getResourceInfo(resourceType).dedicatedSpots.push(spot);
            else this.getResourceInfo(resourceType).freeSpots.push(spot);
            if (this.visualization) {
              new RoomVisual(spot.pos.roomName).rect(spot.pos.x - 0.5, spot.pos.y - 0.5, 1, 1, {
                fill: "transparent",
                stroke: container ? "red" : "green",
                strokeWidth: 0.1
              });
            }
          } else if (!positionEquals(creep.pos, creep.memory.target as RoomPosition)) {
            const lastReservation = lastReservations[resourceType]?.find(
              r => r.creep.name === creep.name && positionEquals(r.spot.pos, spot.pos)
            );
            if (lastReservation) {
              this.getResourceInfo(resourceType).reservedSpots.push(lastReservation);
            } else {
              this.getResourceInfo(resourceType).reservedSpots.push({
                spot,
                creep,
                distance: getWorldPathDistance(creep.pos, spot.pos),
                get pos(): RoomPosition {
                  return spot.pos;
                }
              });
            }
            if (this.visualization) {
              new RoomVisual(spot.pos.roomName).rect(spot.pos.x - 0.5, spot.pos.y - 0.5, 1, 1, {
                fill: "transparent",
                stroke: "blue",
                strokeWidth: 0.1
              });
            }
          }
        });
      }
    }
  }
}

export default new ResourceManager();
