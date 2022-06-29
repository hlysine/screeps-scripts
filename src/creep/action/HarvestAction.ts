import SourceManager from "room/SourceManager";
import { requireEnergyCapacity } from "./SharedSteps";
import { positionEquals } from "utils/MoveUtils";
import Action, { ActionType, Complete, Step } from "./Action";

export default class HarvestAction extends Action {
  public override type: ActionType = ActionType.Harvest;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      requireEnergyCapacity(creep, complete),
      next => {
        const sources = creep.room.find(FIND_SOURCES);
        for (const target of sources) {
          if (creep.harvest(target) === OK) {
            creep.memory.target = creep.pos;
            return;
          }
        }
        next();
      },
      next => {
        if (creep.memory.target) {
          if (positionEquals(creep.memory.target, creep.pos)) {
            creep.memory.target = undefined;
          } else if (
            creep.moveTo(creep.memory.target.x, creep.memory.target.y, {
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
        const freeTarget = creep.pos.findClosestByPath(SourceManager.freeSpots);
        if (freeTarget) {
          if (creep.moveTo(freeTarget, { visualizePathStyle: { stroke: "#ffffff" } }) === OK) {
            SourceManager.claimFreeSpot(freeTarget);
            creep.memory.target = freeTarget;
            return;
          }
        }
        const reservedTarget = creep.pos.findClosestByPath(SourceManager.reservedSpots);
        if (reservedTarget) {
          if (creep.moveTo(reservedTarget) === OK) {
            if (creep.memory._move) {
              const path = Room.deserializePath(creep.memory._move.path);
              if (path.length < reservedTarget.distance) {
                creep.room.visual.poly(
                  path.map(s => [s.x, s.y]),
                  { fill: "transparent", stroke: "#00f", lineStyle: "dashed", strokeWidth: 0.15, opacity: 0.5 }
                );
                SourceManager.claimReservedSpot(reservedTarget.pos);
                creep.memory.target = reservedTarget.pos;
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
