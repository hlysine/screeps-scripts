import SourceManager from "room/SourceManager";
import { requireEnergyCapacity } from "./SharedSteps";
import { positionEquals, getInterRoomDistance, findClosestAcrossRooms } from "utils/MoveUtils";
import Action, { ActionType, Complete, Step } from "./Action";

export default class HarvestAction extends Action {
  public override type: ActionType = ActionType.Harvest;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      requireEnergyCapacity(creep, complete),
      next => {
        const sources = creep.room.find(FIND_SOURCES_ACTIVE);
        for (const target of sources) {
          if (creep.harvest(target) === OK) {
            creep.memory.target = creep.pos;
            creep.memory.sourceTarget = target.id;
            return;
          }
        }
        next();
      },
      next => {
        if (creep.memory.target) {
          if (creep.memory.sourceTarget) {
            const source = Game.getObjectById(creep.memory.sourceTarget);
            if (source && source.energy <= 0) {
              creep.memory.target = undefined;
              creep.memory.sourceTarget = undefined;
              next();
              return;
            }
          }
          if (positionEquals(creep.memory.target, creep.pos)) {
            creep.memory.target = undefined;
          } else if (
            creep.moveTo(new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName), {
              visualizePathStyle: { stroke: "#ffffff" }
            }) === ERR_NO_PATH
          ) {
            creep.memory.target = undefined;
          } else {
            return;
          }
        }
        next();
      },
      next => {
        const freeTarget = findClosestAcrossRooms(creep.pos, SourceManager.freeSpots);
        if (freeTarget) {
          if (creep.moveTo(freeTarget, { visualizePathStyle: { stroke: "#ffffff" } }) === OK) {
            SourceManager.claimFreeSpot(freeTarget);
            creep.memory.target = freeTarget.pos;
            creep.memory.sourceTarget = freeTarget.sourceId;
            return;
          }
        }
        const reservedTarget = findClosestAcrossRooms(creep.pos, SourceManager.reservedSpots);
        if (reservedTarget) {
          if (creep.moveTo(reservedTarget) === OK) {
            if (creep.memory._move) {
              const path = Room.deserializePath(creep.memory._move.path);
              if (path.length + getInterRoomDistance(creep.pos, reservedTarget.spot.pos) < reservedTarget.distance) {
                creep.room.visual.poly(
                  path.map(s => [s.x, s.y]),
                  { fill: "transparent", stroke: "#00f", lineStyle: "dashed", strokeWidth: 0.15, opacity: 0.5 }
                );
                SourceManager.claimReservedSpot(reservedTarget.spot);
                creep.memory.target = reservedTarget.pos;
                creep.memory.sourceTarget = reservedTarget.spot.sourceId;
                return;
              } else {
                creep.cancelOrder("move");
              }
            } else {
              creep.cancelOrder("move");
            }
          }
        }
        next();
      },
      complete
    ];
  }
}
