import { requireEnergy } from "./SharedSteps";
import Action, { ActionType, Complete, Step } from "./Action";

export default class TransferToCreepAction extends Action {
  public override type: ActionType = ActionType.TransferToCreep;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      requireEnergy(creep, complete),
      next => {
        const targets = creep.room.find(FIND_CREEPS, { filter: c => c.store.getFreeCapacity() > 0 });
        for (const target of targets) {
          if (creep.transfer(target, RESOURCE_ENERGY) === OK) {
            creep.memory.target = creep.pos;
            return;
          }
        }
        next();
      },
      next => {
        if (creep.memory.target) {
          if (creep.pos.inRangeTo(creep.memory.target.x, creep.memory.target.y, 1)) {
            creep.memory.target = undefined;
          } else if (
            creep.moveTo(creep.memory.target.x, creep.memory.target.y, {
              visualizePathStyle: { stroke: "#ffffff" }
            }) === ERR_NO_PATH
          ) {
            creep.memory.target = undefined;
          } else {
            return;
          }
        }
        next();
      },
      next => {
        const target = creep.pos.findClosestByPath(FIND_CREEPS, { filter: c => c.store.getFreeCapacity() > 0 });
        if (target) {
          if (creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } }) === OK) {
            creep.memory.target = target.pos;
            return;
          }
        }
        next();
      },
      complete
    ];
  }
}
