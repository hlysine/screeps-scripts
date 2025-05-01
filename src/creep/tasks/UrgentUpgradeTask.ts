import Task, { TaskStatus, makeTask } from "./Task";
import UpgradeTask from "./UpgradeTask";

/**
 * Upgrade controller when ticks to downgrade is less than this value.
 */
const UrgentUpgradeThreshold = 500;

const UrgentUpgradeTask = makeTask({
  id: "urgent_upgrade" as Id<Task>,
  displayName: "Urgent upgrade",
  data: creep => UpgradeTask.data(creep),

  steps: [
    (creep, ctx, next) => {
      if (creep.room.controller && creep.room.controller.my) {
        if (creep.room.controller.ticksToDowngrade < UrgentUpgradeThreshold) {
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
