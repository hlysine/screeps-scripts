import { ActionType } from "creep/action/Action";
import { ActionMap } from "creep/action/ActionStore";
import { RoleType } from "creep/roles/Role";
import { RoleMap } from "creep/roles/RoleStore";

class CreepActionManager {
  private getNextAction(role: RoleType, action: ActionType): ActionType | undefined {
    const roleActions = RoleMap[role].actions;
    const index = roleActions.indexOf(action);
    if (index === -1) {
      return roleActions[0];
    }
    return roleActions[index + 1];
  }

  private determineRole(creep: Creep): RoleType {
    if (creep.body.find(b => b.type === CLAIM)) {
      return RoleType.Claimer;
    }
    if (creep.body.find(b => b.type === ATTACK || b.type === RANGED_ATTACK)) {
      return RoleType.Attacker;
    }
    return RoleType.Worker;
  }

  public switchAction(creep: Creep, action: ActionType) {
    creep.memory.target = undefined;
    creep.memory.action = action;
    creep.say(action);
    ActionMap[action].loop(creep, () => {
      const nextAction = this.getNextAction(creep.memory.role, action);
      if (!nextAction) return;
      this.switchAction(creep, nextAction);
    });
  }

  public loop(): void {
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      if (!creep.memory.role) creep.memory.role = this.determineRole(creep);
      const role = creep.memory.role;
      if (!creep.memory.action) creep.memory.action = RoleMap[role].actions[0];
      const action = creep.memory.action;

      ActionMap[action].loop(creep, () => this.switchAction(creep, RoleMap[role].actions[0]));
    }
  }
}

export default new CreepActionManager();
