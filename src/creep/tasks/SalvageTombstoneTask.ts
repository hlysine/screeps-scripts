import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireCapacity } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const SalvageTombstoneTask: Task = {
  id: "salvage_tombstone" as Id<Task>,
  displayName: "Salvage tombstone",

  steps: [
    requireCapacity,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.tombstoneTarget) {
        const memoizedTarget = Game.getObjectById(creep.memory.tombstoneTarget);
        if (memoizedTarget) {
          if (creep.withdraw(memoizedTarget, RESOURCE_ENERGY) === OK) {
            creep.memory.target = creep.pos;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
      }

      const sources = creep.room.find(FIND_TOMBSTONES, { filter: tombstone => tombstone.store[RESOURCE_ENERGY] > 0 });
      for (const target of sources) {
        if (creep.withdraw(target, RESOURCE_ENERGY) === OK) {
          creep.memory.target = creep.pos;
          creep.memory.tombstoneTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.tombstoneTarget) {
        const target = Game.getObjectById(creep.memory.tombstoneTarget);
        if (!target || target.store[RESOURCE_ENERGY] === 0) {
          creep.memory.target = undefined;
          creep.memory.tombstoneTarget = undefined;
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
          creep.memory.tombstoneTarget = undefined;
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
      const target = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
        filter: tombstone => tombstone.store[RESOURCE_ENERGY] > 0
      });
      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          creep.memory.tombstoneTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
};

export default SalvageTombstoneTask;
