import { ActionType } from "creep/action/Action";
import Role, { RoleType } from "./Role";

const WorkerRole: Role = {
  type: RoleType.Worker,
  actions: [
    ActionType.Harvest,
    ActionType.UrgentUpgrade,
    ActionType.Transfer,
    ActionType.Build,
    ActionType.Upgrade,
    ActionType.Idle
  ],

  getBodyParts(energyCapacity: number): BodyPartConstant[] {
    const base = Math.floor(energyCapacity / 200);
    let remainder = energyCapacity % 200;
    const bodyParts: BodyPartConstant[] = [];
    if (remainder >= 100) {
      bodyParts.push(WORK);
      remainder -= 100;
    }
    if (remainder >= 50) {
      bodyParts.push(MOVE);
    }
    for (let i = 0; i < base; i++) {
      bodyParts.push(WORK);
      bodyParts.push(CARRY);
      bodyParts.push(MOVE);
    }
    return bodyParts;
  },

  getCreepLimit(room: Room): number {
    let limit = 1;
    if (room.controller) {
      limit += room.controller.level;
    }
    limit += Object.values(Game.structures).filter(s => s.pos.roomName === room.name).length;
    return limit;
  }
};

export default WorkerRole;
