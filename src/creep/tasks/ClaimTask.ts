import Task, { TaskType, Complete, Step } from "./Task";

export default class ClaimTask extends Task {
  public override type: TaskType = TaskType.Claim;

  protected override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      next => {
        if (creep.room.controller && !creep.room.controller.my && creep.room.controller.upgradeBlocked === 0) {
          const returnCode = creep.attackController(creep.room.controller);
          if (returnCode === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } }) === ERR_NO_PATH) {
              next();
              return;
            }
            creep.memory.target = creep.room.controller.pos;
            return;
          } else if (returnCode === OK) {
            creep.memory.target = creep.pos;
            return;
          }
        }
        next();
      },
      complete
    ];
  }
}
