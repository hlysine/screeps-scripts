import Manager from "./Manager";
import { getWorldPathDistance, positionEquals } from "utils/MoveUtils";
import { isRoomRestricted } from "utils/StructureUtils";
import FlagTags from "utils/FlagTags";

export interface MiningSpot {
  pos: RoomPosition;
  sourceId?: Id<Source>;
}

interface CachedRoom {
  visible: boolean;
  /**
   * A room may be ignored if there are no flags there or if it is restricted due to controller level.
   */
  ignored: boolean;
  availableSpots: MiningSpot[];
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

class SourceManager extends Manager {
  private roomCache?: RoomHarvestCache;
  public freeSpots: MiningSpot[] = [];
  public reservedSpots: Reservation[] = [];
  public visualization = false;

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

  private getAvailableSpots(room: Room): MiningSpot[] {
    const ret: MiningSpot[] = [];
    room.find(FIND_SOURCES).forEach(source => {
      room
        .lookForAtArea(LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true)
        .forEach(tile => {
          if (tile.terrain !== "wall")
            ret.push({
              pos: new RoomPosition(tile.x, tile.y, room.name),
              sourceId: source.id
            });
        });
    });
    return ret;
  }

  private getAvailableSpotsInvisible(source: RoomPosition): MiningSpot[] {
    const ret: MiningSpot[] = [];
    const terrain = new Room.Terrain(source.roomName);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i !== 0 || j !== 0) {
          const tile = terrain.get(source.x + i, source.y + j);
          if (tile !== TERRAIN_MASK_WALL) {
            ret.push({
              pos: new RoomPosition(source.x + i, source.y + j, source.roomName)
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
          availableSpots: this.getAvailableSpotsInvisible(flag.pos)
        };
      } else if (!cache.visible) {
        cache.availableSpots.push(...this.getAvailableSpotsInvisible(flag.pos));
      }
    });
    // only allow 1 creep to go to invisible rooms
    // to avoid a hoard of creeps going there just to discover that they can't harvest
    for (const roomName in newCache) {
      const cache = newCache[roomName];
      if (!cache.visible) {
        cache.availableSpots.splice(1, cache.availableSpots.length - 1);
      }
    }
    return newCache;
  }

  public isRoomAvailable(roomName: string): boolean {
    if (!this.roomCache) this.roomCache = this.computeCache();
    const cache = this.roomCache[roomName];
    if (!cache) return false;
    return !cache.ignored && cache.availableSpots.length > 0;
  }

  public loop(): void {
    if (!this.roomCache) this.roomCache = this.computeCache();
    const creeps = Object.values(Game.creeps);

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

    this.freeSpots = [];
    const lastReservations = this.reservedSpots;
    this.reservedSpots = [];

    for (const roomName in this.roomCache) {
      const cache = this.roomCache[roomName];
      if (cache.ignored) continue;
      cache.availableSpots.forEach(spot => {
        if (spot.sourceId) {
          const source = Game.getObjectById(spot.sourceId);
          if (source) {
            if (source.energy <= 0) return;
            if (isRoomRestricted(source.room)) return;
          }
        }

        const creep = creeps.find(c => c.memory.target && positionEquals(c.memory.target, spot.pos));
        if (creep === undefined) {
          this.freeSpots.push(spot);
          if (this.visualization) {
            new RoomVisual(spot.pos.roomName).rect(spot.pos.x - 0.5, spot.pos.y - 0.5, 1, 1, {
              fill: "transparent",
              stroke: "green",
              strokeWidth: 0.1
            });
          }
        } else if (!positionEquals(creep.pos, creep.memory.target as RoomPosition)) {
          const lastReservation = lastReservations.find(
            r => r.creep.name === creep.name && positionEquals(r.spot.pos, spot.pos)
          );
          if (lastReservation) {
            this.reservedSpots.push(lastReservation);
          } else {
            this.reservedSpots.push({
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

  public claimFreeSpot(spot: MiningSpot): void {
    this.freeSpots = this.freeSpots.filter(s => !positionEquals(s.pos, spot.pos));
  }

  public claimReservedSpot(spot: MiningSpot): void {
    const reservation = this.reservedSpots.find(r => positionEquals(r.spot.pos, spot.pos));
    if (reservation) {
      this.reservedSpots = this.reservedSpots.filter(r => r !== reservation);
      reservation.creep.memory.target = undefined;
      reservation.creep.memory.sourceTarget = undefined;
    }
  }
}

export default new SourceManager();
