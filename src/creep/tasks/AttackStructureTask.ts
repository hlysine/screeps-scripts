import { isMoveSuccess } from "utils/MoveUtils";
import { isRoomMine } from "utils/StructureUtils";
import { completeTask } from "./SharedSteps";
import Task, { makeTask, TaskStatus } from "./Task";

const AttackStructureTask = makeTask({
  id: "attack_structure" as Id<Task>,
  displayName: "Attack structure",
  data: () => ({
    structureTarget: undefined as Id<AnyStructure> | undefined
  }),

  steps: [
    (creep, ctx, next) => {
      if (ctx.data.structureTarget) {
        const memoizedTarget = Game.getObjectById(ctx.data.structureTarget);
        if (memoizedTarget) {
          if (creep.attack(memoizedTarget) === OK) {
            creep.memory.target = creep.pos;
            ctx.status = TaskStatus.Background;
            return;
          }
        }
      }

      const targets: AnyStructure[] = [
        ...creep.room.find(FIND_HOSTILE_SPAWNS),
        ...creep.room.find(FIND_HOSTILE_STRUCTURES, {
          filter: structure => structure.hits > 0
        })
      ];
      // Only destroy walls if this room is not mine
      if (!isRoomMine(creep.room)) {
        targets.push(
          ...creep.room.find(FIND_STRUCTURES, { filter: structure => structure.structureType === STRUCTURE_WALL })
        );
      }

      if (targets.length === 0) {
        next();
        return;
      }

      let target = targets[0];
      let lowestHits = target.hits;
      for (const t of targets) {
        if (!creep.pos.inRangeTo(t, 1)) continue;
        if (t.hits < lowestHits) {
          target = t;
          lowestHits = t.hits;
        }
      }
      if (creep.attack(target) === OK) {
        creep.memory.target = creep.pos;
        ctx.data.structureTarget = target.id;
        ctx.status = TaskStatus.Background;
        return;
      }
      next();
    },
    (creep, ctx, next) => {
      if (ctx.data.structureTarget) {
        const target = Game.getObjectById(ctx.data.structureTarget);
        if (!target || target.hits === 0) {
          creep.memory.target = undefined;
          ctx.data.structureTarget = undefined;
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
            ctx.data.structureTarget = undefined;
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
    (creep, ctx, next) => {
      const target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
      if (target) {
        if (
          isMoveSuccess(
            creep.moveTo(target, {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          creep.memory.target = target.pos;
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
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep, ctx, next) => {
      const target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.hits > 0
      });
      if (target) {
        if (
          isMoveSuccess(
            creep.moveTo(target, {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          creep.memory.target = target.pos;
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
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
});

export default AttackStructureTask;
