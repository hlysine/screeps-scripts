import RetreatToSpawnTask from "./RetreatToSpawnTask";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const RetreatWhenNoFlagTask: Task = {
  id: "retreat_no_flag" as Id<Task>,
  displayName: "Retreat when no flag",

  steps: [
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.room.controller && creep.room.controller.my) {
        ctx.status = TaskStatus.Complete;
        return;
      }

      const target = Object.values(Game.flags).find(
        f => f.name.toLowerCase().includes("@" + creep.memory.role) && f.pos.roomName === creep.pos.roomName
      );

      if (target) {
        ctx.status = TaskStatus.Complete;
        return;
      }

      next();
    },
    ...RetreatToSpawnTask.steps
  ]
};

export default RetreatWhenNoFlagTask;
