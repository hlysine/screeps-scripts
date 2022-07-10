import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { completeTask } from "./SharedSteps";
import Task, { makeTask, TaskStatus } from "./Task";

const ClaimTask = makeTask({
  id: "claim" as Id<Task>,
  displayName: "Claim",
  data: () => null,

  steps: [
    (creep, ctx, next) => {
      if (creep.room.controller && !creep.room.controller.owner) {
        const returnCode = creep.claimController(creep.room.controller);
        if (returnCode === ERR_NOT_IN_RANGE) {
          const moveResult = creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
          if (!isMoveSuccess(moveResult)) {
            ctx.note = `could not move to controller, reason: ${moveResult}`;
            next();
            return;
          } else {
            creep.memory.target = creep.room.controller.pos;
            ctx.status = TaskStatus.InProgress;
            ctx.note = "moving to controller";
            return;
          }
        } else if (returnCode === OK) {
          creep.memory.target = creep.pos;
          // claim is instant, but we need to wait 1 tick to avoid other tasks overriding the claim intent
          ctx.status = TaskStatus.InProgress;
          ctx.note = "claim success";
          return;
        }
      }
      next();
    },
    completeTask
  ]
});

export default ClaimTask;
