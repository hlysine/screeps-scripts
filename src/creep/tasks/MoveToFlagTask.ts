import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const MoveToFlagTask: Task = {
  id: "moveToFlag" as Id<Task>,
  displayName: "Move to flag",

  steps: [
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const target = Object.values(Game.flags).find(f => f.name.toLowerCase().includes("@" + creep.memory.role));
      if (!target) {
        next();
        return;
      }
      if (creep.pos.roomName === target.pos.roomName && creep.pos.inRangeTo(target, 1)) {
        next();
        return;
      }
      if (isMoveSuccess(creep.moveTo(target.pos, { visualizePathStyle: { stroke: "#ffffff" }, range: 1 }))) {
        if (creep.pos.roomName === target.pos.roomName) {
          ctx.status = TaskStatus.Background;
          return;
        } else {
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    completeTask
  ]
};

export default MoveToFlagTask;
