import { functionChain, requireEnergy } from "utils/ActionUtils";
import { positionEquals } from "utils/MathUtils";
import Action, { ActionType } from "./Action";

class TransferAction implements Action {
  public type: ActionType = ActionType.Transfer;

  public loop(creep: Creep, complete: () => void): void {
    functionChain(
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
          if (positionEquals(creep.memory.target, creep.pos)) {
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
    );
  }
}

export default new TransferAction();