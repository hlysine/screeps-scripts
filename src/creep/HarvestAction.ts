import SourceManager from "room/SourceManager";
import { functionChain, requireEnergyCapacity } from "utils/ActionUtils";
import { positionEquals } from "utils/MathUtils";
import Action, { ActionType } from "./Action";

class HarvestAction implements Action {
  public type: ActionType = ActionType.Harvest;

  public loop(creep: Creep, complete: () => void): void {
    functionChain(
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
    );
  }
}

export default new HarvestAction();
