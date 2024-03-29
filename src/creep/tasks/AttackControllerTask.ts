import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

const AttackControllerTask = makeTask({
  id: "attack_controller" as Id<Task>,
  displayName: "Attack controller",
  data: () => null,
  steps: [
    (creep, ctx, next) => {
      if (creep.room.controller && !creep.room.controller.my) {
        const returnCode = creep.attackController(creep.room.controller);
        if (returnCode === ERR_NOT_IN_RANGE) {
          const moveResult = creep.travelTo(creep.room.controller);
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
          // attack is instant, but we need to wait 1 tick to avoid other tasks overriding the attack intent
          ctx.status = TaskStatus.InProgress;
          ctx.note = "attack success";
          return;
        }
      }
      next();
    },
    completeTask
  ]
});

export default AttackControllerTask;
