import { Serialized } from "./TypeUtils";
import WorldPosition from "./WorldPosition";

export function deserialize(pos: Serialized<RoomPosition>): RoomPosition {
  return new RoomPosition(pos.x, pos.y, pos.roomName);
}

export function positionEquals(a: Serialized<RoomPosition>, b: Serialized<RoomPosition>): boolean {
  return a.x === b.x && a.y === b.y && a.roomName === b.roomName;
}

export function getPathLength(pathString: string): number {
  return pathString.length - 4; // the first 4 characters denote path origin
}

export function getInterRoomDistance(pos1: RoomPosition, pos2: RoomPosition): number {
  return Game.map.getRoomLinearDistance(pos1.roomName, pos2.roomName) * 50;
}

export function getWorldPathDistance(pos1: RoomPosition, pos2: RoomPosition): number {
  if (pos1.roomName === pos2.roomName) {
    return pos1.findPathTo(pos2).length;
  } else {
    let distance = getInterRoomDistance(pos1, pos2);
    if (Game.rooms[pos1.roomName]) {
      distance += pos1.findPathTo(pos2).length;
    } else {
      distance += 50;
    }
    if (Game.rooms[pos2.roomName]) {
      distance += pos2.findPathTo(pos1).length;
    } else {
      distance += 50;
    }
    return distance;
  }
}

/**
 * This should not exist, but findClosestByPath doesn't work with positions in other rooms.
 * @param pos The starting position.
 * @param targets The target positions. One will be picked from this array.
 */
export function findClosestAcrossRooms<T extends _HasRoomPosition>(pos: RoomPosition, targets: T[]): T | undefined {
  if (targets.length === 0) return undefined;
  const roomTarget = pos.findClosestByPath(targets);
  if (roomTarget) {
    return roomTarget;
  }
  const origin = new WorldPosition(pos);
  let closestTarget = targets[0];
  let closestDistance = origin.estimatePathDistanceTo(targets[0].pos);
  for (const target of targets) {
    const distance = origin.estimatePathDistanceTo(target.pos);
    if (distance < closestDistance) {
      closestTarget = target;
      closestDistance = distance;
    }
  }
  return closestTarget;
}

export function isMoveSuccess(moveResult: number): boolean {
  return moveResult === OK || moveResult === ERR_TIRED;
}

export function isSpotObstructed(pos: RoomPosition): boolean {
  if (Game.rooms[pos.roomName]) {
    const result = pos.look();
    for (const obj of result) {
      if (obj.structure) {
        if (
          obj.structure.structureType !== STRUCTURE_ROAD &&
          obj.structure.structureType !== STRUCTURE_CONTAINER &&
          obj.structure.structureType !== STRUCTURE_RAMPART
        )
          return true;
        else if (obj.structure instanceof StructureRampart) {
          if (!obj.structure.my) return true;
        }
      } else if (obj.terrain) {
        if (obj.terrain === "wall") return true;
      } else if (obj.creep) {
        return true;
      }
    }
    return false;
  } else {
    return false;
  }
}

export function getPathError(path: PathFinderPath, pos: RoomPosition): number {
  const dest = path.path[path.path.length - 1];
  return pos.getRangeTo(dest);
}
