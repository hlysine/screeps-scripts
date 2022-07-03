import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

const MoveToFlagRoomTask: Task = {
  id: "move_to_flag_room" as Id<Task>,
  displayName: "Move to flag room",

  steps: [
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const target = Object.values(Game.flags).find(f => f.name.toLowerCase().includes("@" + creep.memory.role));
      if (!target) {
        next();
        return;
      }
      if (creep.pos.roomName === target.pos.roomName) {
        next();
        return;
      }
      if (isMoveSuccess(creep.moveTo(target.pos, { visualizePathStyle: { stroke: "#ffffff" }, range: 1 }))) {
        ctx.status = TaskStatus.InProgress;
        return;
      }
      next();
    },
    completeTask
  ]
};

export default MoveToFlagRoomTask;
