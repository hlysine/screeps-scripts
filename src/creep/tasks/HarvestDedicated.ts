import SourceManager from "managers/SourceManager";
import { completeTask } from "./SharedSteps";
import { isMoveSuccess } from "utils/MoveUtils";
import Task, { makeTask, TaskStatus } from "./Task";
import { isRoomRestricted } from "utils/StructureUtils";
import TaskTargetManager from "managers/TaskTargetManager";

const HarvestDedicatedTask = makeTask({
  id: "harvest_dedicated" as Id<Task>,
  displayName: "Harvest dedicated",
  data: () => ({
    sourceTarget: undefined as Id<Source> | undefined
  }),

  steps: [
    (creep, ctx, next) => {
      if (ctx.data.sourceTarget) {
        const memoizedTarget = Game.getObjectById(ctx.data.sourceTarget);
        if (memoizedTarget) {
          if (creep.harvest(memoizedTarget) === OK) {
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
      if (ctx.data.sourceTarget) {
        const target = Game.getObjectById(ctx.data.sourceTarget);
        if (!target || isRoomRestricted(target.room)) {
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
          TaskTargetManager.setTarget(creep, HarvestDedicatedTask.id, target.id);
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep, ctx, next) => {
      const dedicatedTarget = creep.pos.findClosestByPath(SourceManager.dedicatedSpots);
      if (dedicatedTarget) {
        if (isMoveSuccess(creep.moveTo(dedicatedTarget, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          SourceManager.claimDedicatedSpot(dedicatedTarget);
          creep.memory.target = dedicatedTarget.pos;
          TaskTargetManager.setTarget(creep, HarvestDedicatedTask.id, dedicatedTarget.sourceId);
          ctx.data.sourceTarget = dedicatedTarget.sourceId;
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
