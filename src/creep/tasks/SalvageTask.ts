import TaskTargetManager from "managers/TaskTargetManager";
import { isMoveSuccess } from "utils/MoveUtils";
import { isRoomMine, isRoomRestricted } from "utils/StructureUtils";
import { completeTask, requireCapacity } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

function isStructureValid(
  structure: AnyStructure | Tombstone | Ruin | null
): structure is StructureContainer | StructureStorage | Tombstone | Ruin {
  if (!structure) return false;
  if (structure instanceof Tombstone || structure instanceof Ruin) {
    return structure.store[RESOURCE_ENERGY] > 0;
  }
  return (
    (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) &&
    structure.store[RESOURCE_ENERGY] > 0 &&
    !isRoomRestricted(structure.room) &&
    !isRoomMine(structure.room)
  );
}

const SalvageTask = makeTask({
  id: "salvage" as Id<Task>,
  displayName: "Salvage",
  data(_creep: Creep) {
    return {
      salvageTarget: undefined as Id<Tombstone> | Id<Ruin> | Id<AnyStructure> | undefined
    };
  },

  steps: [
    requireCapacity,
    (creep, ctx, next) => {
      if (ctx.data.salvageTarget) {
        const memoizedTarget = Game.getObjectById(ctx.data.salvageTarget);
        if (memoizedTarget) {
          if (creep.withdraw(memoizedTarget, RESOURCE_ENERGY) === OK) {
            creep.memory.target = creep.pos;
            TaskTargetManager.setTarget(creep, SalvageTask.id, memoizedTarget.id);
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
      }

      const sources = [
        ...creep.room.find(FIND_TOMBSTONES, { filter: isStructureValid }),
        ...creep.room.find(FIND_RUINS, { filter: isStructureValid }),
        ...creep.room.find(FIND_STRUCTURES, { filter: isStructureValid })
      ];
      for (const target of sources) {
        if (creep.withdraw(target, RESOURCE_ENERGY) === OK) {
          creep.memory.target = creep.pos;
          TaskTargetManager.setTarget(creep, SalvageTask.id, target.id);
          ctx.data.salvageTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep, ctx, next) => {
      if (ctx.data.salvageTarget) {
        const target = Game.getObjectById(ctx.data.salvageTarget);
        if (!target || !isStructureValid(target)) {
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
          TaskTargetManager.setTarget(creep, SalvageTask.id, target.id);
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep, ctx, next) => {
      const targets = [
        creep.pos.findClosestByPath(FIND_TOMBSTONES, { filter: isStructureValid }),
        creep.pos.findClosestByPath(FIND_RUINS, { filter: isStructureValid }),
        creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: isStructureValid })
      ].filter(t => !!t) as (AnyStructure | Tombstone | Ruin)[];
      let target: Tombstone | Ruin | AnyStructure | null;
      if (targets.length === 0) target = null;
      else if (targets.length === 1) target = targets[0];
      else target = creep.pos.findClosestByPath(targets);

      if (target) {
        if (isMoveSuccess(creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          creep.memory.target = target.pos;
          TaskTargetManager.setTarget(creep, SalvageTask.id, target.id);
          ctx.data.salvageTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
});

export default SalvageTask;
