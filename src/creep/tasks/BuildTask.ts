import { requireEnergy } from "./SharedSteps";
import Task, { TaskType, Complete, Step } from "./Task";

export default class BuildTask extends Task {
  public override type: TaskType = TaskType.Build;

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
