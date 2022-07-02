import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask, requireEnergy } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const UpgradeTask: Task = {
  id: "upgrade" as Id<Task>,
  displayName: "Upgrade",

  steps: [
    requireEnergy,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.room.controller && creep.room.controller.my) {
        const returnCode = creep.upgradeController(creep.room.controller);
        if (returnCode === ERR_NOT_IN_RANGE) {
          if (!isMoveSuccess(creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } }))) {
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
};

export default UpgradeTask;
