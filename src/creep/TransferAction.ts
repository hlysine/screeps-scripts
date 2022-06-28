import { requireEnergy } from "creep/SharedSteps";
import Action, { ActionType, Complete, Step } from "./Action";

export default class TransferAction extends Action {
  public override type: ActionType = ActionType.Transfer;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      requireEnergy(creep, complete),
      next => {
        const targets = creep.room.find(FIND_STRUCTURES, {
          filter: structure =>
            (structure.structureType === STRUCTURE_EXTENSION ||
              structure.structureType === STRUCTURE_SPAWN ||
              structure.structureType === STRUCTURE_TOWER) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
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
          } else {
            creep.moveTo(creep.memory.target.x, creep.memory.target.y, { visualizePathStyle: { stroke: "#ffffff" } });
            return;
          }
        }
        next();
      },
      next => {
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: structure =>
            (structure.structureType === STRUCTURE_EXTENSION ||
              structure.structureType === STRUCTURE_SPAWN ||
              structure.structureType === STRUCTURE_TOWER) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
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
