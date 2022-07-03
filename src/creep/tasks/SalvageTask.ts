import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireCapacity } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const SalvageTask: Task = {
  id: "salvage" as Id<Task>,
  displayName: "Salvage",

  steps: [
    requireCapacity,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.salvageTarget) {
        const memoizedTarget = Game.getObjectById(creep.memory.salvageTarget);
        if (memoizedTarget) {
          if (creep.withdraw(memoizedTarget, RESOURCE_ENERGY) === OK) {
            creep.memory.target = creep.pos;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
      }

      const sources = [
        ...creep.room.find(FIND_TOMBSTONES, { filter: tombstone => tombstone.store[RESOURCE_ENERGY] > 0 }),
        ...creep.room.find(FIND_RUINS, { filter: ruin => ruin.store[RESOURCE_ENERGY] > 0 })
      ];
      for (const target of sources) {
        if (creep.withdraw(target, RESOURCE_ENERGY) === OK) {
          creep.memory.target = creep.pos;
          creep.memory.salvageTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.salvageTarget) {
        const target = Game.getObjectById(creep.memory.salvageTarget);
        if (!target || target.store[RESOURCE_ENERGY] === 0) {
          creep.memory.target = undefined;
          creep.memory.salvageTarget = undefined;
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
          creep.memory.salvageTarget = undefined;
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
      const tombstoneTarget = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
        filter: tombstone => tombstone.store[RESOURCE_ENERGY] > 0
      });
      const ruinTarget = creep.pos.findClosestByPath(FIND_RUINS, {
        filter: ruin => ruin.store[RESOURCE_ENERGY] > 0
      });

      let target: Tombstone | Ruin | null = tombstoneTarget;
      if (!tombstoneTarget && ruinTarget) target = ruinTarget;
      else if (tombstoneTarget && ruinTarget) target = creep.pos.findClosestByPath([tombstoneTarget, ruinTarget]);

      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          creep.memory.salvageTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
};

export default SalvageTask;
