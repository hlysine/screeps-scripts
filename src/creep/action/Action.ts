import { Serialized } from "utils/TypeUtils";

export interface Step {
  (next: () => void): void;
}

export enum ActionType {
  MoveToFlag = "move_to_flag",
  Build = "build",
  AttackCreep = "attack_creep",
  AttackStructure = "attack_structure",
  Harvest = "harvest",
  Idle = "idle",
  Transfer = "transfer",
  Upgrade = "upgrade",
  UrgentUpgrade = "urgent_upgrade",
  Claim = "claim",
  RetreatToBase = "retreat_to_base"
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
