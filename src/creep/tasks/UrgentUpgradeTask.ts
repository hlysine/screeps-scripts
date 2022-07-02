import Task, { TaskContext, Next, TaskStatus } from "./Task";
import UpgradeTask from "./UpgradeTask";

const UrgentUpgradeTask: Task = {
  id: "urgent_upgrade" as Id<Task>,
  displayName: "Urgent Upgrade",

  steps: [
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.room.controller && creep.room.controller.my) {
        if (creep.room.controller.ticksToDowngrade < 1000) {
          next();
          return;
        }
      }
      ctx.status = TaskStatus.Complete;
    },
    ...UpgradeTask.steps
  ]
};

export default UrgentUpgradeTask;
