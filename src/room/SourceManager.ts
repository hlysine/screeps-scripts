import Manager from "./Manager";
import { positionEquals } from "utils/MathUtils";

function findFreeSpots(source: Source): RoomPosition[] {
  const ret: RoomPosition[] = [];
  const terrain = source.room.getTerrain();
  const creeps = Object.values(Game.creeps);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i !== 0 || j !== 0) {
        const tile = terrain.get(source.pos.x + i, source.pos.y + j);
        if (!(tile & TERRAIN_MASK_LAVA) && !(tile & TERRAIN_MASK_WALL)) {
          if (
            creeps.find(
              c =>
                c.memory.target &&
                positionEquals(
                  c.memory.target,
                  new RoomPosition(source.pos.x + i, source.pos.y + j, source.pos.roomName)
                )
            ) === undefined
          ) {
            ret.push(new RoomPosition(source.pos.x + i, source.pos.y + j, source.room.name));
          }
        }
      }
    }
  }
  return ret;
}

class SourceManager implements Manager {
  public harvestSpots: RoomPosition[] = [];

  public constructor() {
    console.log("SourceManager init");
  }

  public loop(): void {
    this.harvestSpots = [];
    Object.values(Game.rooms).forEach(room => {
      room.find(FIND_SOURCES).forEach(source => {
        this.harvestSpots.push(...findFreeSpots(source));
      });
    });
  }

  public claimSpot(spot: RoomPosition): void {
    this.harvestSpots = this.harvestSpots.filter(s => !positionEquals(s, spot));
  }
}

export default new SourceManager();
