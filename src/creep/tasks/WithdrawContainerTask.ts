import TaskTargetManager from "managers/TaskTargetManager";
import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireCapacity } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

const WithdrawContainerTask = makeTask({
  id: "withdraw_container" as Id<Task>,
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
          if (creep.withdraw(memoizedTarget, RESOURCE_ENERGY) === OK) {
            creep.memory.target = creep.pos;
            TaskTargetManager.setTarget(creep, WithdrawContainerTask.id, memoizedTarget.id);
            ctx.status = TaskStatus.Complete;
            return;
          }
        }
      }

      const containers = creep.room.find<FIND_STRUCTURES, StructureContainer>(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      });
      for (const target of containers) {
        if (creep.withdraw(target, RESOURCE_ENERGY) === OK) {
          creep.memory.target = creep.pos;
          TaskTargetManager.setTarget(creep, WithdrawContainerTask.id, target.id);
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
        if (!target || target.store[RESOURCE_ENERGY] === 0) {
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
          TaskTargetManager.setTarget(creep, WithdrawContainerTask.id, target.id);
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
          s.store[RESOURCE_ENERGY] > 0 &&
          !TaskTargetManager.isAlreadyTargeted(WithdrawContainerTask.id, s.id)
      });
      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          TaskTargetManager.setTarget(creep, WithdrawContainerTask.id, target.id);
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

export default WithdrawContainerTask;
