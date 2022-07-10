import ResourceManager from "managers/ResourceManager";
import { completeTask } from "./SharedSteps";
import { positionEquals } from "utils/MoveUtils";
import Task, { makeTask, TaskStatus } from "./Task";
import { isRoomRestricted } from "utils/StructureUtils";
import TaskTargetManager from "managers/TaskTargetManager";
import { isHarvestSuccess, isMoveSuccess } from "utils/ReturnCodeUtils";

const HarvestDedicatedTask = makeTask({
  id: "harvest_dedicated" as Id<Task>,
  displayName: "Harvest dedicated",
  data: () => ({
    sourceTarget: undefined as Id<Source> | Id<Mineral> | undefined
  }),

  steps: [
    (creep, ctx, next) => {
      if (ctx.data.sourceTarget && creep.memory.target && positionEquals(creep.pos, creep.memory.target)) {
        const memoizedTarget = Game.getObjectById(ctx.data.sourceTarget);
        if (memoizedTarget) {
          if (isHarvestSuccess(creep.harvest(memoizedTarget))) {
            creep.memory.target = creep.pos;
            TaskTargetManager.setTarget(creep, HarvestDedicatedTask.id, memoizedTarget.id);
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
            creep.moveTo(new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName), {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          ctx.status = TaskStatus.Complete;
          return;
        } else {
          TaskTargetManager.setTarget(creep, HarvestDedicatedTask.id, target.id);
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep, ctx, next) => {
      const dedicatedTarget = creep.pos.findClosestByPath(ResourceManager.dedicatedSpots);
      if (dedicatedTarget) {
        if (isMoveSuccess(creep.moveTo(dedicatedTarget, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          ResourceManager.claimDedicatedSpot(dedicatedTarget.resourceType, dedicatedTarget);
          creep.memory.target = dedicatedTarget.pos;
          TaskTargetManager.setTarget(creep, HarvestDedicatedTask.id, dedicatedTarget.resourceId);
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

export default HarvestDedicatedTask;
