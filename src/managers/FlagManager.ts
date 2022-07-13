import WorldPosition from "utils/WorldPosition";
import Manager from "./Manager";

interface FlagRoomMap {
  [roomName: string]: Flag[];
}

class FlagManager extends Manager {
  private flags: Flag[] = [];
  private flagMap: FlagRoomMap = {};
  public visualization = true;

  public getAllFlags(): Flag[] {
    return this.flags;
  }

  public getRelatedFlags(roomName: string): Flag[] {
    return this.flagMap[roomName] ?? [];
  }

  public loop(): void {
    this.flags = Object.values(Game.flags);
    const roomCoords = Object.values(Game.rooms)
      .filter(room => room.controller?.my && room.controller.level > 2 && room.find(FIND_MY_SPAWNS).length > 0)
      .map(room => ({
        name: room.name,
        pos: new WorldPosition(new RoomPosition(24, 24, room.name))
      }));
    const map: FlagRoomMap = {};
    this.flags.forEach(flag => {
      const room = roomCoords.minBy(r => r.pos.estimatePathDistanceTo(flag.pos));
      if (room) {
        if (!map[room.name]) map[room.name] = [];
        map[room.name].push(flag);
        if (this.visualization) {
          new RoomVisual(flag.pos.roomName).text(`▶️${room.name}`, flag.pos.x + 1, flag.pos.y, {
            align: "left"
          });
        }
      }
    });
    this.flagMap = map;
  }
}

export default new FlagManager();
