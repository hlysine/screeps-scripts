import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const AttackCreepTask: Task = {
  id: "attack_creep" as Id<Task>,
  displayName: "Attack creep",
  steps: [
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      // Only destroy walls if this room is not mine
      if (creep.room.find(FIND_MY_SPAWNS).length === 0) {
        const targets = creep.room
          .lookForAtArea(LOOK_STRUCTURES, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true)
          .filter(r => r.structure.structureType === STRUCTURE_WALL);

        for (const target of targets) {
          if (creep.attack(target.structure) === OK) {
            creep.memory.target = creep.pos;
            break;
          }
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.creepTarget) {
        const memoizedTarget = Game.getObjectById(creep.memory.creepTarget);
        if (memoizedTarget) {
          if (creep.attack(memoizedTarget) === OK) {
            creep.memory.target = creep.pos;
            next();
            return;
          }
        }
      }

      const targets = creep.room
        .lookForAtArea(LOOK_CREEPS, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true)
        .filter(r => !r.creep.my);

      for (const target of targets) {
        if (creep.attack(target.creep) === OK) {
          creep.memory.target = creep.pos;
          creep.memory.creepTarget = target.creep.id;
          // don't complete the task here, since we may need to chase the target creep
          break;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.creepTarget) {
        const target = Game.getObjectById(creep.memory.creepTarget);
        if (!target || target.hits === 0) {
          creep.memory.target = undefined;
          creep.memory.creepTarget = undefined;
          ctx.status = TaskStatus.Complete;
          return;
        } else if (
          !isMoveSuccess(
            creep.moveTo(target.pos, {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          if (
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
        } else {
          creep.memory.target = target.pos;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
      if (target) {
        if (
          isMoveSuccess(
            creep.moveTo(target, {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          creep.memory.target = target.pos;
          creep.memory.creepTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        } else if (
          isMoveSuccess(
            creep.moveTo(target, {
              visualizePathStyle: { stroke: "#ffffff" },
              ignoreDestructibleStructures: true
            })
          )
        ) {
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

export default AttackCreepTask;
