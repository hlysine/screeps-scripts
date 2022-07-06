import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireCapacity } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

const PickUpResourceTask = makeTask({
  id: "pick_up_resource" as Id<Task>,
  displayName: "Pick up resource",
  data: () => ({
    resourceTarget: undefined as Id<Resource> | undefined
  }),

  steps: [
    requireCapacity,
    (creep, ctx, next) => {
      if (ctx.data.resourceTarget) {
        const memoizedTarget = Game.getObjectById(ctx.data.resourceTarget);
        if (memoizedTarget) {
          if (creep.pickup(memoizedTarget) === OK) {
            creep.memory.target = creep.pos;
            ctx.status = TaskStatus.Complete;
            return;
          }
        }
      }

      const sources = creep.room.find(FIND_DROPPED_RESOURCES);
      for (const target of sources) {
        if (creep.pickup(target) === OK) {
          creep.memory.target = creep.pos;
          ctx.data.resourceTarget = target.id;
          ctx.status = TaskStatus.Complete;
          return;
        }
      }
      next();
    },
    (creep, ctx, next) => {
      if (ctx.data.resourceTarget) {
        const target = Game.getObjectById(ctx.data.resourceTarget);
        if (!target || target.amount === 0) {
          creep.memory.target = undefined;
          ctx.data.resourceTarget = undefined;
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
          ctx.data.resourceTarget = undefined;
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
      const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: r => r.amount > r.pos.getRangeTo(creep.pos) * 1.5
      });
      if (target) {
        // // prevent more than 1 creep doing the same thing
        // const creeps = creep.room.find(FIND_MY_CREEPS, { filter: c => c.memory.data.resourceTarget === target.id });
        // if (creeps.length > 0) {
        //   const range = target.pos.getRangeTo(creep);
        //   if (creeps.find(c => target.pos.getRangeTo(c.pos) < range) === undefined) {
        //     creeps.forEach(c => {
        //       c.memory.target = undefined;
        //       c.memory.data.resourceTarget = undefined;
        //     });
        //   } else {
        //     ctx.data.resourceTarget = undefined;
        //     ctx.status = TaskStatus.Complete;
        //     return;
        //   }
        // }
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          ctx.data.resourceTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
});

export default PickUpResourceTask;
