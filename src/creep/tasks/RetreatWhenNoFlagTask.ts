import RetreatToSpawnTask from "./RetreatToSpawnTask";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

export default function RetreatWhenNoFlagTask(
  filter: (flag: Flag, creep: Creep) => boolean = (flag, creep) =>
    flag.name.toLowerCase().includes("@" + creep.memory.role)
): Task {
  return {
    id: "retreat_no_flag" as Id<Task>,
    displayName: "Retreat when no flag",

    steps: [
      (creep: Creep, ctx: TaskContext, next: Next): void => {
        if (creep.room.controller && creep.room.controller.my) {
          ctx.status = TaskStatus.Complete;
          return;
        }

        const target = Object.values(Game.flags).find(f => f.pos.roomName === creep.pos.roomName && filter(f, creep));

        if (target) {
          ctx.status = TaskStatus.Complete;
          return;
        }

        next();
      },
      ...RetreatToSpawnTask.steps
    ]
  };
}
