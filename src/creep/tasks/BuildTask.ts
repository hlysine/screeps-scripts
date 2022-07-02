import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const BuildTask: Task = {
  id: "build" as Id<Task>,
  displayName: "Build",

  steps: [
    requireEnergy,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const sources = creep.room.find(FIND_CONSTRUCTION_SITES);
      for (const target of sources) {
        if (creep.build(target) === OK) {
          creep.memory.target = creep.pos;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.target) {
        if (creep.pos.inRangeTo(creep.memory.target.x, creep.memory.target.y, 3)) {
          creep.memory.target = undefined;
        } else if (
          !isMoveSuccess(
            creep.moveTo(creep.memory.target.x, creep.memory.target.y, {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          creep.memory.target = undefined;
        } else {
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
};

export default BuildTask;
