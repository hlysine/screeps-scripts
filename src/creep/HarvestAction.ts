import SourceManager from "room/SourceManager";
import { requireEnergyCapacity } from "creep/SharedSteps";
import { positionEquals } from "utils/MathUtils";
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
          } else {
            creep.moveTo(creep.memory.target.x, creep.memory.target.y, { visualizePathStyle: { stroke: "#ffffff" } });
            return;
          }
        }
        next();
      },
      next => {
        const target = creep.pos.findClosestByPath(SourceManager.harvestSpots);
        if (target) {
          if (creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }) === OK) {
            SourceManager.claimSpot(target);
            creep.memory.target = target;
            return;
          }
        }
        next();
      },
      complete
    ];
  }
}
