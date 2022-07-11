import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { makeTask, TaskStatus } from "./Task";

const UpgradeTask = makeTask({
  id: "upgrade" as Id<Task>,
  displayName: "Upgrade",
  data: () => null,

  steps: [
    requireEnergy,
    (creep, ctx, next) => {
      if (creep.room.controller && creep.room.controller.my) {
        const returnCode = creep.upgradeController(creep.room.controller);
        if (returnCode === ERR_NOT_IN_RANGE) {
          if (!isMoveSuccess(creep.travelTo(creep.room.controller))) {
            next();
            return;
          } else {
            creep.memory.target = creep.room.controller.pos;
            ctx.status = TaskStatus.InProgress;
            return;
          }
        } else if (returnCode === OK) {
          creep.memory.target = creep.pos;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
});

export default UpgradeTask;
