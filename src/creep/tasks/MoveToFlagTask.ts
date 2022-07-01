import Task, { TaskType, Complete, Step } from "./Task";

export default class MoveToFlagTask extends Task {
  public override type: TaskType = TaskType.MoveToFlag;

  protected override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      next => {
        const target = Object.values(Game.flags).find(f => f.name.toLowerCase().includes("@" + creep.memory.role));
        if (!target) {
          complete();
          return;
        }
        if (creep.pos.roomName === target.pos.roomName && creep.pos.inRangeTo(target, 1)) {
          complete();
          return;
        }
        creep.moveTo(target.pos, { visualizePathStyle: { stroke: "#ffffff" }, range: 1 });
        if (creep.pos.roomName === target.pos.roomName) {
          complete();
          return;
        }
        next();
      }
    ];
  }
}
