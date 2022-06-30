import { Serialized } from "./TypeUtils";

export function positionEquals(a: Serialized<RoomPosition>, b: Serialized<RoomPosition>): boolean {
  return a.x === b.x && a.y === b.y && a.roomName === b.roomName;
}

export function getPathLength(pathString: string): number {
  return pathString.length - 4; // the first 4 characters denote path origin
}

export function getInterRoomDistance(pos1: RoomPosition, pos2: RoomPosition): number {
  return Game.map.getRoomLinearDistance(pos1.roomName, pos2.roomName) * 50;
}
