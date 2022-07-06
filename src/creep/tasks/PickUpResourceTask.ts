import TaskTargetManager from "managers/TaskTargetManager";
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
            creep.memory.targetId = memoizedTarget.id;
            ctx.status = TaskStatus.Complete;
            return;
          }
        }
      }

      const sources = creep.room.find(FIND_DROPPED_RESOURCES);
      for (const target of sources) {
        if (creep.pickup(target) === OK) {
          creep.memory.target = creep.pos;
          creep.memory.targetId = target.id;
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
          ctx.status = TaskStatus.Complete;
          return;
        } else if (
          !isMoveSuccess(
            creep.moveTo(target.pos, {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          ctx.status = TaskStatus.Complete;
          return;
        } else {
          creep.memory.target = target.pos;
          creep.memory.targetId = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep, ctx, next) => {
      const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: r =>
          r.amount > r.pos.getRangeTo(creep.pos) * 1.5 &&
          !TaskTargetManager.isAlreadyTargeted(PickUpResourceTask.id, r.id)
      });
      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          creep.memory.targetId = target.id;
          ctx.data.resourceTarget = target.id;
          TaskTargetManager.setTarget(creep, PickUpResourceTask.id, target.id);
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
