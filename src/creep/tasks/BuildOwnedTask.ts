import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const BuildOwnedTask: Task = {
  id: "build_owned" as Id<Task>,
  displayName: "Build owned",

  steps: [
    requireEnergy,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.constructionTarget) {
        const memoizedTarget = Game.getObjectById(creep.memory.constructionTarget);
        if (memoizedTarget) {
          if (creep.build(memoizedTarget) === OK) {
            creep.memory.target = creep.pos;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
      }

      const sources = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
      for (const target of sources) {
        if (creep.build(target) === OK) {
          creep.memory.target = creep.pos;
          creep.memory.constructionTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.constructionTarget) {
        const target = Game.getObjectById(creep.memory.constructionTarget);
        if (!target) {
          creep.memory.target = undefined;
          creep.memory.constructionTarget = undefined;
          ctx.status = TaskStatus.Complete;
          return;
        } else if (
          !isMoveSuccess(
            creep.moveTo(target.pos, {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          creep.memory.target = undefined;
          creep.memory.constructionTarget = undefined;
          ctx.status = TaskStatus.Complete;
          return;
        } else {
          creep.memory.target = target.pos;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          creep.memory.constructionTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
};

export default BuildOwnedTask;
