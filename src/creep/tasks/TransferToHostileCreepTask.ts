import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const TransferToHostileCreepTask: Task = {
  id: "transfer_hostile_creep" as Id<Task>,
  displayName: "Transfer to hostile creep",

  steps: [
    requireEnergy,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.creepTarget) {
        const memoizedTarget = Game.getObjectById(creep.memory.creepTarget);
        if (memoizedTarget) {
          if (creep.transfer(memoizedTarget, RESOURCE_ENERGY) === OK) {
            creep.memory.target = creep.pos;
            next();
            return;
          }
        }
      }

      const targets = creep.room.find(FIND_HOSTILE_CREEPS, { filter: c => c.store.getFreeCapacity() > 0 });
      for (const target of targets) {
        if (creep.transfer(target, RESOURCE_ENERGY) === OK) {
          creep.memory.target = creep.pos;
          creep.memory.creepTarget = target.id;
          // don't complete the task here, since we may need to chase the target creep
          break;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.creepTarget) {
        const target = Game.getObjectById(creep.memory.creepTarget);
        if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
          creep.memory.target = undefined;
          creep.memory.creepTarget = undefined;
          ctx.status = TaskStatus.Complete;
          return;
        } else if (
          !isMoveSuccess(
            creep.moveTo(target.pos, {
              visualizePathStyle: { stroke: "#ffffff" },
              ignoreDestructibleStructures: true
            })
          )
        ) {
          creep.memory.target = undefined;
          creep.memory.creepTarget = undefined;
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
      const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, { filter: c => c.store.getFreeCapacity() > 0 });
      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          creep.memory.creepTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
};

export default TransferToHostileCreepTask;
