import { requireEnergy } from "./SharedSteps";
import Action, { ActionType, Complete, Step } from "./Action";

export default class UpgradeAction extends Action {
  public override type: ActionType = ActionType.Upgrade;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      requireEnergy(creep, complete),
      next => {
        if (creep.room.controller) {
          const returnCode = creep.upgradeController(creep.room.controller);
          if (returnCode === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
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
