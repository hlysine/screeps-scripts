import { TaskType, Complete, Step } from "./Task";
import UpgradeTask from "./UpgradeTask";

export default class UrgentUpgradeTask extends UpgradeTask {
  public override type: TaskType = TaskType.UrgentUpgrade;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      next => {
        if (creep.room.controller) {
          if (creep.room.controller.ticksToDowngrade < 1000) {
            next();
            return;
          }
        }
        complete();
      },
      ...super.getSteps(creep, complete)
    ];
  }
}
