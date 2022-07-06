import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { makeTask, TaskStatus } from "./Task";

function isStructureValid(
  structure: AnyStructure | null
): structure is StructureExtension | StructureSpawn | StructureTower {
  if (!structure) return false;
  if (
    structure.structureType === STRUCTURE_EXTENSION ||
    structure.structureType === STRUCTURE_SPAWN ||
    structure.structureType === STRUCTURE_TOWER
  ) {
    if (structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      return true;
    }
  }
  return false;
}

export default function TransferTask(
  filter: (structure: StructureExtension | StructureSpawn | StructureTower) => boolean
): Task {
  return makeTask({
    id: "transfer" as Id<Task>,
    displayName: "Transfer",
    data: () => ({
      structureTarget: undefined as Id<AnyStructure> | undefined
    }),

    steps: [
      requireEnergy,
      (creep, ctx, next) => {
        if (ctx.data.structureTarget) {
          const memoizedTarget = Game.getObjectById(ctx.data.structureTarget);
          if (memoizedTarget) {
            if (creep.transfer(memoizedTarget, RESOURCE_ENERGY) === OK) {
              creep.memory.target = creep.pos;
              ctx.status = TaskStatus.InProgress;
              return;
            }
          }
        }

        const targets = creep.room.find(FIND_STRUCTURES, {
          filter: structure => isStructureValid(structure) && filter(structure)
        });
        for (const target of targets) {
          if (creep.transfer(target, RESOURCE_ENERGY) === OK) {
            creep.memory.target = creep.pos;
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
            creep.memory.target = undefined;
            ctx.data.structureTarget = undefined;
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
      (creep, ctx, next) => {
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: structure => isStructureValid(structure) && filter(structure)
        });
        if (target) {
          // // prevent more than 1 creep doing the same thing
          // const creeps = creep.room.find(FIND_MY_CREEPS, { filter: c => c.memory.structureTarget === target.id });
          // if (creeps.length > 0) {
          //   const range = target.pos.getRangeTo(creep);
          //   if (creeps.find(c => target.pos.getRangeTo(c.pos) < range) === undefined) {
          //     creeps.forEach(c => {
          //       c.memory.target = undefined;
          //       c.memory.structureTarget = undefined;
          //     });
          //   } else {
          //     ctx.data.structureTarget = undefined;
          //     ctx.status = TaskStatus.Complete;
          //     return;
          //   }
          // }
          if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
            creep.memory.target = target.pos;
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
