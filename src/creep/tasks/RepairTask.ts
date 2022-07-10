import TaskTargetManager from "managers/TaskTargetManager";
import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { makeTask, TaskStatus } from "./Task";

function isStructureValid(structure: AnyStructure | null): structure is AnyStructure {
  if (!structure) return false;
  return structure.hits < structure.hitsMax && structure.hits > 0;
}

const RepairTaskId = "repair" as Id<Task>;

export default function RepairTask(filter: (structure: AnyStructure) => boolean): Task {
  return makeTask({
    id: RepairTaskId,
    displayName: "Repair",
    data: () => ({
      structureTarget: undefined as Id<AnyStructure> | undefined
    }),

    steps: [
      requireEnergy,
      (creep, ctx, next) => {
        if (ctx.data.structureTarget) {
          const memoizedTarget = Game.getObjectById(ctx.data.structureTarget);
          if (memoizedTarget) {
            if (isStructureValid(memoizedTarget) && creep.repair(memoizedTarget) === OK) {
              creep.memory.target = creep.pos;
              TaskTargetManager.setTarget(creep, RepairTaskId, memoizedTarget.id);
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
            TaskTargetManager.setTarget(creep, RepairTaskId, target.id);
            ctx.data.structureTarget = target.id;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
        if (ctx.data.structureTarget) {
          const target = Game.getObjectById(ctx.data.structureTarget);
          if (!isStructureValid(target)) {
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
            TaskTargetManager.setTarget(creep, RepairTaskId, target.id);
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
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
            TaskTargetManager.setTarget(creep, RepairTaskId, target.id);
            ctx.data.structureTarget = target.id;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      completeTask
    ]
  });
}
