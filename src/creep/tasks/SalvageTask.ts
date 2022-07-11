import TaskTargetManager from "managers/TaskTargetManager";
import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { getStoreContentTypes, isFilteredStoreEmpty, isRoomMine, isRoomRestricted } from "utils/StructureUtils";
import { completeTask, requireCapacity } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

function isStructureValid(
  structure: AnyStructure | Tombstone | Ruin | null,
  filter: (resourceType: ResourceConstant) => boolean
): structure is StructureContainer | StructureStorage | Tombstone | Ruin {
  if (!structure) return false;
  if (structure instanceof Tombstone || structure instanceof Ruin) {
    return !isFilteredStoreEmpty(structure.store, filter);
  }
  return (
    (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) &&
    !isFilteredStoreEmpty(structure.store, filter) &&
    !isRoomRestricted(structure.room) &&
    !isRoomMine(structure.room)
  );
}

export const SalvageTaskId = "salvage" as Id<Task>;

export default function SalvageTask(filter: (resourceType: ResourceConstant) => boolean): Task {
  return makeTask({
    id: SalvageTaskId,
    displayName: "Salvage",
    data(_creep: Creep) {
      return {
        salvageTarget: undefined as Id<Tombstone> | Id<Ruin> | Id<StructureContainer> | Id<StructureStorage> | undefined
      };
    },

    steps: [
      requireCapacity,
      (creep, ctx, next) => {
        if (ctx.data.salvageTarget) {
          const memoizedTarget = Game.getObjectById(ctx.data.salvageTarget);
          if (memoizedTarget) {
            const resources = getStoreContentTypes(memoizedTarget.store).filter(filter);
            if (resources.length > 0 && creep.withdraw(memoizedTarget, resources[0]) === OK) {
              creep.memory.target = creep.pos;
              TaskTargetManager.setTarget(creep, SalvageTaskId, memoizedTarget.id);
              ctx.status = TaskStatus.InProgress;
              return;
            }
          }
        }

        const sources = [
          ...creep.room.find(FIND_TOMBSTONES, { filter: s => isStructureValid(s, filter) }),
          ...creep.room.find(FIND_RUINS, { filter: s => isStructureValid(s, filter) }),
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          ...(creep.room.find(FIND_STRUCTURES, { filter: s => isStructureValid(s, filter) }) as (
            | StructureContainer
            | StructureStorage
          )[])
        ];
        for (const target of sources) {
          const resources = getStoreContentTypes(target.store).filter(filter);
          if (resources.length > 0 && creep.withdraw(target, resources[0]) === OK) {
            creep.memory.target = creep.pos;
            TaskTargetManager.setTarget(creep, SalvageTaskId, target.id);
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
          if (!target || !isStructureValid(target, filter)) {
            ctx.status = TaskStatus.Complete;
            return;
          } else if (!isMoveSuccess(creep.travelTo(target.pos))) {
            ctx.status = TaskStatus.Complete;
            return;
          } else {
            creep.memory.target = target.pos;
            TaskTargetManager.setTarget(creep, SalvageTaskId, target.id);
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
        const targets = [
          creep.pos.findClosestByPath(FIND_TOMBSTONES, {
            filter: s => isStructureValid(s, filter) && !TaskTargetManager.isAlreadyTargeted(SalvageTaskId, s.id)
          }),
          creep.pos.findClosestByPath(FIND_RUINS, {
            filter: s => isStructureValid(s, filter) && !TaskTargetManager.isAlreadyTargeted(SalvageTaskId, s.id)
          }),
          creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => isStructureValid(s, filter) && !TaskTargetManager.isAlreadyTargeted(SalvageTaskId, s.id)
          })
        ].filter(t => !!t) as (StructureContainer | StructureStorage | Tombstone | Ruin)[];
        let target: Tombstone | Ruin | StructureContainer | StructureStorage | null;
        if (targets.length === 0) target = null;
        else if (targets.length === 1) target = targets[0];
        else target = creep.pos.findClosestByPath(targets);

        if (target) {
          if (isMoveSuccess(creep.travelTo(target))) {
            creep.memory.target = target.pos;
            TaskTargetManager.setTarget(creep, SalvageTaskId, target.id);
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
}
