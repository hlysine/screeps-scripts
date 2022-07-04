import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireCapacity } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const PickUpResourceTask: Task = {
  id: "pick_up_resource" as Id<Task>,
  displayName: "Pick up resource",

  steps: [
    requireCapacity,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.resourceTarget) {
        const memoizedTarget = Game.getObjectById(creep.memory.resourceTarget);
        if (memoizedTarget) {
          if (creep.pickup(memoizedTarget) === OK) {
            creep.memory.target = creep.pos;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
      }

      const sources = creep.room.find(FIND_DROPPED_RESOURCES);
      for (const target of sources) {
        if (creep.pickup(target) === OK) {
          creep.memory.target = creep.pos;
          creep.memory.resourceTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.resourceTarget) {
        const target = Game.getObjectById(creep.memory.resourceTarget);
        if (!target || target.amount === 0) {
          creep.memory.target = undefined;
          creep.memory.resourceTarget = undefined;
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
          creep.memory.resourceTarget = undefined;
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
      const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: r => r.amount > r.pos.getRangeTo(creep.pos) * 1.5
      });
      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          creep.memory.resourceTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
};

export default PickUpResourceTask;
