import TaskTargetManager from "managers/TaskTargetManager";
import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { completeTask } from "./SharedSteps";
import Task, { makeTask, TaskStatus } from "./Task";

const AttackCreepTask = makeTask({
  id: "attack_creep" as Id<Task>,
  displayName: "Attack creep",
  data: () => ({
    creepTarget: undefined as Id<Creep> | undefined
  }),
  steps: [
    (creep, ctx, next) => {
      // Only destroy walls if this room is not mine
      if (creep.room.find(FIND_MY_SPAWNS).length === 0) {
        const targets = creep.room
          .lookForAtArea(LOOK_STRUCTURES, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true)
          .filter(r => r.structure.structureType === STRUCTURE_WALL);

        for (const target of targets) {
          if (creep.attack(target.structure) === OK) {
            creep.memory.target = creep.pos;
            TaskTargetManager.setTarget(creep, AttackCreepTask.id, target.structure.id);
            break;
          }
        }
      }
      next();
    },
    (creep, ctx, next) => {
      if (ctx.data.creepTarget) {
        const memoizedTarget = Game.getObjectById(ctx.data.creepTarget);
        if (memoizedTarget) {
          if (creep.attack(memoizedTarget) === OK) {
            creep.memory.target = creep.pos;
            TaskTargetManager.setTarget(creep, AttackCreepTask.id, memoizedTarget.id);
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
          TaskTargetManager.setTarget(creep, AttackCreepTask.id, target.creep.id);
          ctx.data.creepTarget = target.creep.id;
          // don't complete the task here, since we may need to chase the target creep
          break;
        }
      }
      next();
    },
    (creep, ctx, next) => {
      if (ctx.data.creepTarget) {
        const target = Game.getObjectById(ctx.data.creepTarget);
        if (!target || target.hits === 0) {
          ctx.status = TaskStatus.Complete;
          return;
        } else if (!isMoveSuccess(creep.travelTo(target.pos))) {
          if (
            !isMoveSuccess(
              creep.travelTo(target.pos, {
                ignoreStructures: true,
                movingTarget: true
              })
            )
          ) {
            ctx.status = TaskStatus.Complete;
            return;
          } else {
            creep.memory.target = target.pos;
            TaskTargetManager.setTarget(creep, AttackCreepTask.id, target.id);
            ctx.status = TaskStatus.InProgress;
            return;
          }
        } else {
          creep.memory.target = target.pos;
          TaskTargetManager.setTarget(creep, AttackCreepTask.id, target.id);
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep, ctx, next) => {
      const target = creep.pos.findClosestHostileByPath();
      if (target) {
        if (isMoveSuccess(creep.travelTo(target, { movingTarget: true }))) {
          creep.memory.target = target.pos;
          TaskTargetManager.setTarget(creep, AttackCreepTask.id, target.id);
          ctx.data.creepTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        } else if (
          isMoveSuccess(
            creep.travelTo(target, {
              ignoreStructures: true,
              movingTarget: true
            })
          )
        ) {
          creep.memory.target = target.pos;
          TaskTargetManager.setTarget(creep, AttackCreepTask.id, target.id);
          ctx.data.creepTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
});

export default AttackCreepTask;
