import FlagManager from "managers/FlagManager";
import { isMoveSuccess } from "utils/ReturnCodeUtils";
import { completeTask } from "./SharedSteps";
import Task, { TaskStatus, makeTask } from "./Task";

export enum MoveToFlagMode {
  /**
   * Keep moving until within a certain range of the flag.
   */
  Range = "range",
  /**
   * Complete the task once in the same room as the flag.
   */
  RoomOnly = "roomOnly",
  /**
   * Switch to a background task once in the same room as the flag.
   */
  LowPriorityInRoom = "lowPriorityInRoom"
}

export default function MoveToFlagTask(mode: MoveToFlagMode, range: number): Task {
  return makeTask({
    id: "move_to_flag" as Id<Task>,
    displayName: "Move to flag",
    data: () => null,

    steps: [
      (creep, ctx, next) => {
        const target = FlagManager.getRelatedFlags(Game.spawns[creep.memory.origin]?.pos.roomName ?? "").find(f =>
          f.name.toLowerCase().includes("@" + creep.memory.role)
        );
        if (!target) {
          ctx.note = "No target";
          ctx.status = TaskStatus.Complete;
          return;
        }
        if (mode === MoveToFlagMode.Range || mode === MoveToFlagMode.LowPriorityInRoom) {
          if (creep.pos.roomName === target.pos.roomName && creep.pos.inRangeTo(target, range)) {
            ctx.note = mode + " goal reached";
            ctx.status = TaskStatus.Complete;
            return;
          }
        } else if (mode === MoveToFlagMode.RoomOnly) {
          if (creep.pos.roomName === target.pos.roomName) {
            ctx.note = mode + " goal reached";
            ctx.status = TaskStatus.Complete;
            return;
          }
        }
        if (isMoveSuccess(creep.moveTo(target.pos, { visualizePathStyle: { stroke: "#ffffff" }, range }))) {
          if (creep.pos.roomName === target.pos.roomName) {
            if (mode === MoveToFlagMode.LowPriorityInRoom) {
              ctx.note = mode + ": already in room";
              ctx.status = TaskStatus.Background;
            } else if (mode === MoveToFlagMode.RoomOnly) {
              ctx.note = mode + " goal reached while moving";
              ctx.status = TaskStatus.Complete;
            } else {
              ctx.note = mode + ": in progress";
              ctx.status = TaskStatus.InProgress;
            }
            return;
          } else {
            ctx.note = "moving to room";
            ctx.status = TaskStatus.InProgress;
            return;
          }
        }
        next();
      },
      completeTask
    ]
  });
}
