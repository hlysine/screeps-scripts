import { ActionType } from "creep/Action";
import BuildAction from "creep/BuildAction";
import HarvestAction from "creep/HarvestAction";
import IdleAction from "creep/IdleAction";
import TransferAction from "creep/TransferAction";
import UpgradeAction from "creep/UpgradeAction";
import UrgentUpgradeAction from "creep/UrgentUpgradeAction";

const actionClasses = [HarvestAction, UrgentUpgradeAction, TransferAction, BuildAction, UpgradeAction, IdleAction];

type ActionMap = {
  [key in ActionType]: InstanceType<typeof actionClasses[number]>;
};

class CreepActionManager {
  public actionMap = actionClasses.reduce<ActionMap>((map, action) => {
    const instance = new action();
    map[instance.type] = instance;
    return map;
  }, {} as ActionMap);
  public actions = Object.keys(this.actionMap) as ActionType[];

  private getNextAction(action: ActionType): ActionType | undefined {
    const index = this.actions.indexOf(action);
    if (index === -1) {
      return this.actions[0];
    }
    return this.actions[index + 1];
  }

  public switchAction(creep: Creep, action: ActionType) {
    creep.memory.target = undefined;
    creep.memory.action = action;
    creep.say(action);
    this.actionMap[action].loop(creep, () => {
      const nextAction = this.getNextAction(action);
      if (!nextAction) return;
      this.switchAction(creep, nextAction);
    });
  }

  public loop(): void {
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];

      this.actionMap[creep.memory.action].loop(creep, () => this.switchAction(creep, this.actions[0]));
    }
  }
}

export default new CreepActionManager();
