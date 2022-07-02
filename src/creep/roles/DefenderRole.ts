import AttackCreepTask from "creep/tasks/AttackCreepTask";
import AttackStructureTask from "creep/tasks/AttackStructureTask";
import IdleTask from "creep/tasks/IdleTask";
import MoveToFlagTask from "creep/tasks/MoveToFlagTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import Role, { CreepInfo, RoleCountMap } from "./Role";

const DefenderRole: Role = {
  id: "defender" as Id<Role>,
  tasks: [[AttackCreepTask.id, AttackStructureTask.id, MoveToFlagTask.id, RetreatToSpawnTask.id, IdleTask.id]],

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
    if (bodyParts.length > 50) {
      bodyParts.splice(0, bodyParts.length - 50);
    }
    return {
      bodyParts,
      energyCost: energyCapacity - remainder
    };
  },

  getCreepLimit(room: Room): number {
    if (room.controller) {
      if (
        Object.keys(Game.flags).find(f => f.includes("@" + this.id)) !== undefined ||
        room.find(FIND_HOSTILE_CREEPS).length > 0
      )
        return room.controller.level - 1;
    }
    return 1;
  },

  getSpawnPriority(room: Room, _roleCount: RoleCountMap): number {
    if (room.find(FIND_HOSTILE_CREEPS).length > 0) return 50;
    return 0;
  }
};

export default DefenderRole;
