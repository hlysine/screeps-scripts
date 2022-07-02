import { isMoveSuccess, positionEquals } from "utils/MoveUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const AttackStructureTask: Task = {
  id: "attack_structure" as Id<Task>,
  displayName: "Attack structure",

  steps: [
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.structureTarget) {
        const memoizedTarget = Game.getObjectById(creep.memory.structureTarget);
        if (memoizedTarget) {
          if (creep.attack(memoizedTarget) === OK) {
            creep.memory.target = creep.pos;
            next();
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
      if (creep.room.find(FIND_MY_SPAWNS).length === 0) {
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
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.target) {
        if (positionEquals(creep.memory.target, creep.pos)) {
          // something is probably wrong if the creep reaches its position but fails the steps above
          creep.memory.target = undefined;
          creep.memory.structureTarget = undefined;
          ctx.status = TaskStatus.Complete;
          return;
        }
      }
      if (creep.memory.structureTarget) {
        const target = Game.getObjectById(creep.memory.structureTarget);
        if (!target || target.hits === 0) {
          creep.memory.target = undefined;
          creep.memory.structureTarget = undefined;
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
          creep.memory.structureTarget = undefined;
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
      const target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
      if (target) {
        if (
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
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.hits > 0
      });
      if (target) {
        if (
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
};

export default AttackStructureTask;
