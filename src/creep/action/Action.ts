import { Serialized } from "utils/TypeUtils";

export interface Step {
  (next: () => void): void;
}

export enum ActionType {
  AttackFlag = "attack_flag",
  Build = "build",
  Defend = "defend",
  Harvest = "harvest",
  Idle = "idle",
  Transfer = "transfer",
  Upgrade = "upgrade",
  UrgentUpgrade = "urgent_upgrade"
}

export interface ActionMemory {
  action: ActionType;
  target?: Serialized<RoomPosition>;
  creepTarget?: Id<Creep>;
}

/**
 * This function has no parameters. The optional next parameter is to faciliate implicit typing.
 */
export type Complete = (next?: () => void) => void;

export default abstract class Action {
  abstract type: ActionType;

  abstract getSteps(creep: Creep, complete: Complete): Step[];

  public loop(creep: Creep, complete: Complete): void {
    const steps = this.getSteps(creep, complete);
    let index = 0;
    const next = () => {
      if (index < steps.length) {
        steps[index++](next);
      }
    };
    next();
  }
}
