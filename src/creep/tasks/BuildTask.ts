import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { makeTask, TaskStatus } from "./Task";

export default function BuildTask(filter: FilterOptions<FIND_CONSTRUCTION_SITES>["filter"]): Task {
  return makeTask({
    id: "build" as Id<Task>,
    displayName: "Build",
    data: () => ({
      constructionTarget: undefined as Id<ConstructionSite> | undefined
    }),

    steps: [
      requireEnergy,
      (creep, ctx, next) => {
        if (ctx.data.constructionTarget) {
          const memoizedTarget = Game.getObjectById(ctx.data.constructionTarget);
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
            ctx.data.constructionTarget = target.id;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
        if (ctx.data.constructionTarget) {
          const target = Game.getObjectById(ctx.data.constructionTarget);
          if (!target) {
            creep.memory.target = undefined;
            ctx.data.constructionTarget = undefined;
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
            ctx.data.constructionTarget = undefined;
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
      (creep, ctx, next) => {
        const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, { filter });
        if (target) {
          if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
            creep.memory.target = target.pos;
            ctx.data.constructionTarget = target.id;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      completeTask
    ]
  });
}
