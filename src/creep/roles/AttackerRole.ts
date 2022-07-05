import AttackCreepTask from "creep/tasks/AttackCreepTask";
import AttackStructureTask from "creep/tasks/AttackStructureTask";
import IdleTask from "creep/tasks/IdleTask";
import MoveToFlagTask, { MoveToFlagMode } from "creep/tasks/MoveToFlagTask";
import RangedAttackAutoTask from "creep/tasks/RangedAttackAutoTask";
import RetreatToSpawnTask from "creep/tasks/RetreatToSpawnTask";
import RetreatWhenNoFlagTask from "creep/tasks/RetreatWhenNoFlagTask";
import FlagManager from "managers/FlagManager";
import Role, { CreepInfo, RoleCountMap } from "./Role";

const AttackerRole: Role = {
  id: "attacker" as Id<Role>,
  tasks: [
    [RangedAttackAutoTask, RetreatWhenNoFlagTask()],
    [
      AttackCreepTask,
      AttackStructureTask,
      MoveToFlagTask(MoveToFlagMode.LowPriorityInRoom, 1),
      RetreatToSpawnTask,
      IdleTask
    ]
  ],

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
      const flagCount = FlagManager.getRelatedFlags(room.name).filter(f => f.name.includes("@" + this.id)).length;
      if (flagCount || room.find(FIND_HOSTILE_CREEPS).length > 0) return flagCount;
    }
    return 0;
  },

  getSpawnPriority(room: Room, _roleCount: RoleCountMap): number {
    if (room.find(FIND_HOSTILE_CREEPS).length > 0) return 50;
    return 0;
  }
};

export default AttackerRole;
