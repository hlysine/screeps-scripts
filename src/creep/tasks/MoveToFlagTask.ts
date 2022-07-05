import FlagManager from "managers/FlagManager";
import { isMoveSuccess } from "utils/MoveUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskContext, Next, TaskStatus } from "./Task";

export enum MoveToFlagMode {
  /**
   * Keep moving until within a certain range of the flag.
   */
  Range,
  /**
   * Complete the task once in the same room as the flag.
   */
  RoomOnly,
  /**
   * Switch to a background task once in the same room as the flag.
   */
  LowPriorityInRoom
}

export default function MoveToFlagTask(mode: MoveToFlagMode, range: number): Task {
  return {
    id: "move_to_flag" as Id<Task>,
    displayName: "Move to flag",

    steps: [
      (creep: Creep, ctx: TaskContext, next: Next): void => {
        const target = FlagManager.getRelatedFlags(creep.memory.origin).find(f =>
          f.name.toLowerCase().includes("@" + creep.memory.role)
        );
        if (!target) {
          next();
          return;
        }
        if (mode === MoveToFlagMode.Range || mode === MoveToFlagMode.LowPriorityInRoom) {
          if (creep.pos.roomName === target.pos.roomName && creep.pos.inRangeTo(target, range)) {
            next();
            return;
          }
        } else if (mode === MoveToFlagMode.RoomOnly) {
          if (creep.pos.roomName === target.pos.roomName) {
            next();
            return;
          }
        }
        if (isMoveSuccess(creep.moveTo(target.pos, { visualizePathStyle: { stroke: "#ffffff" }, range }))) {
          if (creep.pos.roomName === target.pos.roomName) {
            if (mode === MoveToFlagMode.LowPriorityInRoom) {
              ctx.status = TaskStatus.Background;
            } else if (mode === MoveToFlagMode.RoomOnly) {
              ctx.status = TaskStatus.Complete;
            } else {
              ctx.status = TaskStatus.InProgress;
            }
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
}
