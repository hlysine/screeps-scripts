import { functionChain, requireEnergy } from "utils/ActionUtils";
import { positionEquals } from "utils/MathUtils";
import Action, { ActionType } from "./Action";

class BuildAction implements Action {
  public type: ActionType = ActionType.Build;

  public loop(creep: Creep, complete: () => void): void {
    functionChain(
      requireEnergy(creep, complete),
      next => {
        const sources = creep.room.find(FIND_CONSTRUCTION_SITES);
        for (const target of sources) {
          if (creep.build(target) === OK) {
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
        const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (target) {
          if (creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }) === OK) {
            creep.memory.target = target.pos;
            return;
          }
        }
        next();
      },
      complete
    );
  }
}

export default new BuildAction();
