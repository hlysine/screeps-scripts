import ResourceManager from "managers/ResourceManager";
import { completeTask } from "./SharedSteps";
import { positionEquals } from "utils/MoveUtils";
import Task, { makeTask, TaskStatus } from "./Task";
import { isRoomRestricted } from "utils/StructureUtils";
import TaskTargetManager from "managers/TaskTargetManager";
import { isHarvestSuccess, isMoveSuccess } from "utils/ReturnCodeUtils";

export const HarvestDedicatedTaskId = "harvest_dedicated" as Id<Task>;

export default function HarvestDedicatedTask(filter: (resourceType: ResourceConstant) => boolean): Task {
  return makeTask({
    id: HarvestDedicatedTaskId,
    displayName: "Harvest dedicated",
    data: () => ({
      sourceTarget: undefined as Id<Source> | Id<Mineral> | undefined
    }),

    steps: [
      (creep, ctx, next) => {
        if (ctx.data.sourceTarget && creep.memory.target && positionEquals(creep.pos, creep.memory.target)) {
          const container = creep.room
            .lookForAt(LOOK_STRUCTURES, creep)
            .find(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer | undefined;
          if (container) {
            if (container.store.getFreeCapacity() < 50) {
              ctx.status = TaskStatus.InProgress;
              ctx.note = "waiting for container capacity";
              return;
            }
          }
          const memoizedTarget = Game.getObjectById(ctx.data.sourceTarget);
          if (memoizedTarget) {
            if (isHarvestSuccess(creep.harvest(memoizedTarget))) {
              creep.memory.target = creep.pos;
              TaskTargetManager.setTarget(creep, HarvestDedicatedTaskId, memoizedTarget.id);
              ctx.status = TaskStatus.InProgress;
              ctx.note = "harvesting memory target";
              return;
            }
          }
        }
        next();
      },
      (creep, ctx, next) => {
        if (ctx.data.sourceTarget && creep.memory.target) {
          const target = Game.getObjectById(ctx.data.sourceTarget);
          // just to make ts happy
          // target.room should not be undefined because creep gives visibility to the room
          if (!target || !target.room || isRoomRestricted(target.room)) {
            ctx.status = TaskStatus.Complete;
            return;
          } else if (
            !isMoveSuccess(
              creep.travelTo(
                new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName)
              )
            )
          ) {
            ctx.status = TaskStatus.Complete;
            return;
          } else {
            TaskTargetManager.setTarget(creep, HarvestDedicatedTaskId, target.id);
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
        const dedicatedTarget = creep.pos.findClosestByPath(
          ResourceManager.dedicatedSpots.filter(spot => filter(spot.resourceType))
        );
        if (dedicatedTarget) {
          if (isMoveSuccess(creep.travelTo(dedicatedTarget))) {
            ResourceManager.claimDedicatedSpot(dedicatedTarget.resourceType, dedicatedTarget);
            creep.memory.target = dedicatedTarget.pos;
            TaskTargetManager.setTarget(creep, HarvestDedicatedTaskId, dedicatedTarget.resourceId);
            ctx.data.sourceTarget = dedicatedTarget.resourceId;
            ctx.status = TaskStatus.InProgress;
            ctx.note = "moving to dedicated target";
            return;
          }
        }
        next();
      },
      completeTask
    ]
  });
}
