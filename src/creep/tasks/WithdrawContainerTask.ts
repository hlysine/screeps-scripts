import TaskTargetManager from "managers/TaskTargetManager";
import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { getStoreContentTypes, isFilteredStoreEmpty } from "utils/StructureUtils";
import { completeTask, requireCapacity } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

export const WithdrawContainerTaskId = "withdraw_container" as Id<Task>;

export default function WithdrawContainerTask(filter: (resourceType: ResourceConstant) => boolean): Task {
  return makeTask({
    id: WithdrawContainerTaskId,
    displayName: "Withdraw from container",
    data: () => ({
      containerTarget: undefined as Id<StructureContainer> | undefined
    }),

    steps: [
      requireCapacity,
      (creep, ctx, next) => {
        if (ctx.data.containerTarget) {
          const memoizedTarget = Game.getObjectById(ctx.data.containerTarget);
          if (memoizedTarget) {
            const resources = getStoreContentTypes(memoizedTarget.store).filter(filter);
            if (resources.length > 0 && creep.withdraw(memoizedTarget, resources[0]) === OK) {
              creep.memory.target = creep.pos;
              TaskTargetManager.setTarget(creep, WithdrawContainerTaskId, memoizedTarget.id);
              ctx.status = TaskStatus.Complete;
              return;
            }
          }
        }

        const containers = creep.room.find<FIND_STRUCTURES, StructureContainer>(FIND_STRUCTURES, {
          filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        for (const target of containers) {
          const resources = getStoreContentTypes(target.store).filter(filter);
          if (resources.length > 0 && creep.withdraw(target, resources[0]) === OK) {
            creep.memory.target = creep.pos;
            TaskTargetManager.setTarget(creep, WithdrawContainerTaskId, target.id);
            ctx.data.containerTarget = target.id;
            ctx.status = TaskStatus.Complete;
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
        if (ctx.data.containerTarget) {
          const target = Game.getObjectById(ctx.data.containerTarget);
          if (!target || isFilteredStoreEmpty(target.store, filter)) {
            ctx.status = TaskStatus.Complete;
            return;
          } else if (!isMoveSuccess(creep.travelTo(target.pos))) {
            ctx.status = TaskStatus.Complete;
            return;
          } else {
            creep.memory.target = target.pos;
            TaskTargetManager.setTarget(creep, WithdrawContainerTaskId, target.id);
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
        const target = creep.pos.findClosestByRange<FIND_STRUCTURES, StructureContainer>(FIND_STRUCTURES, {
          filter: s =>
            s.structureType === STRUCTURE_CONTAINER &&
            !isFilteredStoreEmpty(s.store, filter) &&
            !TaskTargetManager.isAlreadyTargeted(WithdrawContainerTaskId, s.id)
        });
        if (target) {
          if (isMoveSuccess(creep.travelTo(target))) {
            creep.memory.target = target.pos;
            TaskTargetManager.setTarget(creep, WithdrawContainerTaskId, target.id);
            ctx.data.containerTarget = target.id;
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
