import Manager from "./Manager";
import { positionEquals } from "utils/MoveUtils";

interface Reservation {
  pos: RoomPosition;
  creep: Creep;
  distance: number;
}

class SourceManager implements Manager {
  public freeSpots: RoomPosition[] = [];
  public reservedSpots: Reservation[] = [];

  public loop(): void {
    this.freeSpots = [];
    const lastReservations = this.reservedSpots;
    this.reservedSpots = [];
    const creeps = Object.values(Game.creeps);
    Object.values(Game.rooms).forEach(room => {
      room.find(FIND_SOURCES, { filter: source => source.energy > 0 }).forEach(source => {
        const terrain = source.room.getTerrain();
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i !== 0 || j !== 0) {
              const tile = terrain.get(source.pos.x + i, source.pos.y + j);
              if (!(tile & TERRAIN_MASK_LAVA) && !(tile & TERRAIN_MASK_WALL)) {
                const creep = creeps.find(
                  c =>
                    c.memory.target &&
                    positionEquals(
                      c.memory.target,
                      new RoomPosition(source.pos.x + i, source.pos.y + j, source.pos.roomName)
                    )
                );
                const harvestPos = new RoomPosition(source.pos.x + i, source.pos.y + j, source.room.name);
                if (creep === undefined) {
                  this.freeSpots.push(harvestPos);
                } else if (!positionEquals(creep.pos, creep.memory.target as RoomPosition)) {
                  const lastReservation = lastReservations.find(
                    r => r.creep.name === creep.name && positionEquals(r.pos, harvestPos)
                  );
                  if (lastReservation) {
                    this.reservedSpots.push(lastReservation);
                  } else {
                    this.reservedSpots.push({
                      pos: harvestPos,
                      creep,
                      distance: harvestPos.findPathTo(creep.pos).length
                    });
                  }
                }
              }
            }
          }
        }
      });
    });
  }

  public claimFreeSpot(spot: RoomPosition): void {
    this.freeSpots = this.freeSpots.filter(s => !positionEquals(s, spot));
  }

  public claimReservedSpot(spot: RoomPosition): void {
    const reservation = this.reservedSpots.find(r => positionEquals(r.pos, spot));
    if (reservation) {
      this.reservedSpots = this.reservedSpots.filter(r => r !== reservation);
      reservation.creep.memory.target = undefined;
    }
  }
}

export default new SourceManager();
