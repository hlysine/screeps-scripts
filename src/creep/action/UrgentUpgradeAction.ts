import { ActionType, Complete, Step } from "./Action";
import UpgradeAction from "./UpgradeAction";

export default class UrgentUpgradeAction extends UpgradeAction {
  public override type: ActionType = ActionType.UrgentUpgrade;

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
