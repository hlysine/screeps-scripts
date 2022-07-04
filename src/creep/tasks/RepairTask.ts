import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

function isStructureValid(structure: AnyStructure | null): structure is AnyStructure {
  if (!structure) return false;
  return structure.hits < structure.hitsMax && structure.hits > 0;
}

export default function RepairTask(filter: (structure: AnyStructure) => boolean): Task {
  return {
    id: "repair" as Id<Task>,
    displayName: "Repair",

    steps: [
      requireEnergy,
      (creep: Creep, ctx: TaskContext, next: Next): void => {
        if (creep.memory.structureTarget) {
          const memoizedTarget = Game.getObjectById(creep.memory.structureTarget);
          if (memoizedTarget) {
            if (isStructureValid(memoizedTarget) && creep.repair(memoizedTarget) === OK) {
              creep.memory.target = creep.pos;
              ctx.status = TaskStatus.InProgress;
              return;
            }
          }
        }

        const targets = creep.room.find(FIND_STRUCTURES, {
          filter: structure => isStructureValid(structure) && filter(structure)
        });
        targets.sort((a, b) => a.hits - b.hits);
        for (const target of targets) {
          if (creep.repair(target) === OK) {
            creep.memory.target = creep.pos;
            creep.memory.structureTarget = target.id;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      (creep: Creep, ctx: TaskContext, next: Next): void => {
        if (creep.memory.structureTarget) {
          const target = Game.getObjectById(creep.memory.structureTarget);
          if (!isStructureValid(target)) {
            creep.memory.target = undefined;
            creep.memory.structureTarget = undefined;
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
        const targets = creep.room.find(FIND_STRUCTURES, {
          filter: structure => isStructureValid(structure) && filter(structure)
        });

        if (targets.length === 0) {
          next();
          return;
        }

        let target = targets[0];
        let minHits = target.hits;
        for (const t of targets) {
          if (t.hits < minHits) {
            target = t;
            minHits = t.hits;
          }
        }

        if (target) {
          if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
            creep.memory.target = target.pos;
            creep.memory.structureTarget = target.id;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      completeTask
    ]
  };
}
