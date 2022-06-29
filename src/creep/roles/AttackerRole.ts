import { ActionType } from "creep/action/Action";
import Role, { CreepInfo, RoleType } from "./Role";

const AttackerRole: Role = {
  type: RoleType.Attacker,
  actions: [ActionType.Defend, ActionType.Idle],

  getCreepInfo(energyCapacity: number): CreepInfo {
    // [ATTACK, MOVE] combo
    const base = Math.floor(energyCapacity / 130);
    let remainder = energyCapacity % 130;
    // [TOUGH, MOVE] combo
    const defenseBase = Math.floor(remainder / 60);
    remainder = remainder % 60;
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
    for (let i = 0; i < defenseBase; i++) {
      bodyParts.push(TOUGH);
      bodyParts.push(MOVE);
    }
    for (let i = 0; i < base; i++) {
      bodyParts.push(ATTACK);
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
