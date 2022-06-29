import { ActionType } from "creep/action/Action";
import Role, { CreepInfo, RoleType } from "./Role";

const AttackerRole: Role = {
  type: RoleType.Attacker,
  actions: [ActionType.Defend, ActionType.Idle],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [ATTACK, MOVE, RANGED_ATTACK, MOVE] combo
    const base = Math.floor(energyCapacity / 330);
    let remainder = energyCapacity % 330;
    // [ATTACK, MOVE] combo
    const meleeBase = Math.floor(remainder / 130);
    remainder = remainder % 130;
    // remaining MOVE
    const remainingMove = Math.floor(remainder / 50);
    remainder = remainder % 50;
    // remaining TOUGH
    const remainingTough = Math.floor(remainder / 10);
    remainder = remainder % 10;

    const bodyParts: BodyPartConstant[] = [];
    for (let i = 0; i < remainingTough; i++) {
      bodyParts.push(TOUGH);
    }
    for (let i = 0; i < remainingMove; i++) {
      bodyParts.push(MOVE);
    }
    for (let i = 0; i < meleeBase; i++) {
      bodyParts.push(ATTACK);
      bodyParts.push(MOVE);
    }
    for (let i = 0; i < base; i++) {
      bodyParts.push(ATTACK);
      bodyParts.push(MOVE);
      bodyParts.push(RANGED_ATTACK);
      bodyParts.push(MOVE);
    }
    return {
      bodyParts,
      energyCost: energyCapacity - remainder
    };
  },

  getCreepLimit(room: Room): number {
    return room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTENSION }).length;
  }
};

export default AttackerRole;
