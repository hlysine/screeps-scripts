import TaskTargetManager from "managers/TaskTargetManager";
import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { completeTask, requireCapacity } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

export const PickUpResourceTaskId = "pick_up_resource" as Id<Task>;

export default function PickUpResourceTask(filter: (resourceType: ResourceConstant) => boolean): Task {
  return makeTask({
    id: PickUpResourceTaskId,
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
            if (filter(memoizedTarget.resourceType) && creep.pickup(memoizedTarget) === OK) {
              creep.memory.target = creep.pos;
              TaskTargetManager.setTarget(creep, PickUpResourceTaskId, memoizedTarget.id);
              ctx.status = TaskStatus.Complete;
              return;
            }
          }
        }

        const sources = creep.room.find(FIND_DROPPED_RESOURCES);
        for (const target of sources) {
          if (filter(target.resourceType) && creep.pickup(target) === OK) {
            creep.memory.target = creep.pos;
            TaskTargetManager.setTarget(creep, PickUpResourceTaskId, target.id);
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
          if (!target || target.amount === 0 || !filter(target.resourceType)) {
            ctx.status = TaskStatus.Complete;
            return;
          } else if (!isMoveSuccess(creep.travelTo(target.pos))) {
            ctx.status = TaskStatus.Complete;
            return;
          } else {
            creep.memory.target = target.pos;
            TaskTargetManager.setTarget(creep, PickUpResourceTaskId, target.id);
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
        const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
          filter: r =>
            filter(r.resourceType) &&
            r.amount > r.pos.getRangeTo(creep.pos) * 1.5 &&
            !TaskTargetManager.isAlreadyTargeted(PickUpResourceTaskId, r.id)
        });
        if (target) {
          if (isMoveSuccess(creep.travelTo(target))) {
            creep.memory.target = target.pos;
            TaskTargetManager.setTarget(creep, PickUpResourceTaskId, target.id);
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
}
