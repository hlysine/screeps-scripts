import { Serialized } from "./TypeUtils";

export function positionEquals(a: Serialized<RoomPosition>, b: Serialized<RoomPosition>): boolean {
  return a.x === b.x && a.y === b.y && a.roomName === b.roomName;
}
