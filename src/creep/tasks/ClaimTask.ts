import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const ClaimTask: Task = {
  id: "claim" as Id<Task>,
  displayName: "Claim",

  steps: [
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.room.controller && !creep.room.controller.my) {
        const returnCode = creep.attackController(creep.room.controller);
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
};

export default ClaimTask;
