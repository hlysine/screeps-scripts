import TaskTargetManager from "managers/TaskTargetManager";
import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { getStoreContentTypes } from "utils/StructureUtils";
import { completeTask, requireResource } from "./SharedSteps";
import Task, { makeTask, TaskStatus } from "./Task";

export const StoreResourceTaskId = "store_resource" as Id<Task>;

export default function StoreResourceTask(filter: (resourceType: ResourceConstant) => boolean): Task {
  return makeTask({
    id: StoreResourceTaskId,
    displayName: "Store Resource",
    data: () => ({
      storageTarget: undefined as Id<StructureStorage> | undefined
    }),

    steps: [
      requireResource(filter),
      (creep, ctx, next) => {
        if (ctx.data.storageTarget) {
          const memoizedTarget = Game.getObjectById(ctx.data.storageTarget);
          if (memoizedTarget) {
            const resources = getStoreContentTypes(creep.store).filter(filter);
            if (resources.length > 0 && creep.transfer(memoizedTarget, resources[0]) === OK) {
              creep.memory.target = creep.pos;
              TaskTargetManager.setTarget(creep, StoreResourceTaskId, memoizedTarget.id);
              ctx.status = TaskStatus.InProgress;
              return;
            }
          }
        }
        next();
      },
      (creep, ctx, next) => {
        if (ctx.data.storageTarget) {
          const target = Game.getObjectById(ctx.data.storageTarget);
          if (!target || target.structureType !== STRUCTURE_STORAGE || target.store.getFreeCapacity() <= 0) {
            ctx.status = TaskStatus.Complete;
            return;
          } else if (!isMoveSuccess(creep.travelTo(target.pos))) {
            ctx.status = TaskStatus.Complete;
            return;
          } else {
            creep.memory.target = target.pos;
            TaskTargetManager.setTarget(creep, StoreResourceTaskId, target.id);
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: structure =>
            structure.structureType === STRUCTURE_STORAGE &&
            structure.store.getFreeCapacity() > 0 &&
            !TaskTargetManager.isAlreadyTargeted(StoreResourceTaskId, structure.id)
        });
        if (target) {
          if (isMoveSuccess(creep.travelTo(target))) {
            creep.memory.target = target.pos;
            TaskTargetManager.setTarget(creep, StoreResourceTaskId, target.id);
            ctx.data.storageTarget = target.id as Id<StructureStorage>;
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
