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

/**
 * This should not exist, but findClosestByPath doesn't work with positions in other rooms.
 * @param pos The starting position.
 * @param targets The target positions. One will be picked from this array.
 */
export function findClosestAcrossRooms<T extends _HasRoomPosition>(pos: RoomPosition, targets: T[]): T | undefined {
  const roomTarget = pos.findClosestByPath(targets);
  if (roomTarget) {
    return roomTarget;
  }
  let closestTarget = targets[0];
  let closestDistance = getInterRoomDistance(pos, closestTarget.pos);
  for (const target of targets) {
    const distance = getInterRoomDistance(pos, target.pos);
    if (distance < closestDistance) {
      closestTarget = target;
      closestDistance = distance;
    }
  }
  return closestTarget;
}
