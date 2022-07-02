import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const TransferToCreepTask: Task = {
  id: "transferToCreep" as Id<Task>,
  displayName: "Transfer to creep",

  steps: [
    requireEnergy,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const targets = creep.room.find(FIND_CREEPS, { filter: c => c.store.getFreeCapacity() > 0 });
      for (const target of targets) {
        if (creep.transfer(target, RESOURCE_ENERGY) === OK) {
          creep.memory.target = creep.pos;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.target) {
        if (creep.pos.inRangeTo(creep.memory.target.x, creep.memory.target.y, 1)) {
          creep.memory.target = undefined;
        } else if (
          !isMoveSuccess(
            creep.moveTo(creep.memory.target.x, creep.memory.target.y, {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          creep.memory.target = undefined;
        } else {
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const target = creep.pos.findClosestByPath(FIND_CREEPS, { filter: c => c.store.getFreeCapacity() > 0 });
      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
};

export default TransferToCreepTask;
