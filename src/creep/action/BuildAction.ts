import { requireEnergy } from "./SharedSteps";
import Action, { ActionType, Complete, Step } from "./Action";

export default class BuildAction extends Action {
  public override type: ActionType = ActionType.Build;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
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
          if (creep.pos.inRangeTo(creep.memory.target.x, creep.memory.target.y, 3)) {
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
    ];
  }
}
