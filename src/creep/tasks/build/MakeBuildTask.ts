import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireEnergy } from "../SharedSteps";
import { TaskContext, Next, TaskStatus, Step } from "../Task";

export default function makeBuildTask(filter: FilterOptions<FIND_CONSTRUCTION_SITES>["filter"]): Step[] {
  return [
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

      const sources = creep.room.find(FIND_CONSTRUCTION_SITES, { filter });
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
      const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, { filter });
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
  ];
}
