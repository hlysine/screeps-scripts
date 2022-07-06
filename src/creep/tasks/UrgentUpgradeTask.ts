import Task, { TaskStatus, makeTask } from "./Task";
import UpgradeTask from "./UpgradeTask";

const UrgentUpgradeTask = makeTask({
  id: "urgent_upgrade" as Id<Task>,
  displayName: "Urgent upgrade",
  data: creep => UpgradeTask.data(creep),

  steps: [
    (creep, ctx, next) => {
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
});

export default UrgentUpgradeTask;
