import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { completeTask } from "./SharedSteps";
import Task, { makeTask, TaskStatus } from "./Task";

const ReserveTask = makeTask({
  id: "reserve" as Id<Task>,
  displayName: "Reserve",
  data: () => null,

  steps: [
    (creep, ctx, next) => {
      if (creep.room.controller && !creep.room.controller.owner) {
        const returnCode = creep.reserveController(creep.room.controller);
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
          ctx.status = TaskStatus.InProgress;
          ctx.note = "reserve success";
          return;
        }
      }
      next();
    },
    completeTask
  ]
});

export default ReserveTask;
