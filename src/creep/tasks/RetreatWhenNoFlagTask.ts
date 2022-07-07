import RetreatToSpawnTask from "./RetreatToSpawnTask";
import Task, { makeTask, TaskStatus } from "./Task";

export default function RetreatWhenNoFlagTask(
  filter: (flag: Flag, creep: Creep) => boolean = (flag, creep) =>
    flag.name.toLowerCase().includes("@" + creep.memory.role)
): Task {
  return makeTask({
    id: "retreat_no_flag" as Id<Task>,
    displayName: "Retreat when no flag",
    data: RetreatToSpawnTask.data,

    steps: [
      (creep, ctx, next) => {
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
  });
}
