import { functionChain, requireEnergy } from "utils/ActionUtils";
import Action, { ActionType } from "./Action";

class UpgradeAction implements Action {
  public type: ActionType = ActionType.Upgrade;

  public loop(creep: Creep, complete: () => void): void {
    functionChain(
      requireEnergy(creep, complete),
      next => {
        if (creep.room.controller) {
          if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
            creep.memory.target = creep.room.controller.pos;
            return;
          }
        }
        next();
      },
      complete
    );
  }
}

export default new UpgradeAction();
