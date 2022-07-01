import { Serialized } from "utils/TypeUtils";

export interface Step {
  (next: () => void): void;
}

export enum TaskType {
  MoveToFlag = "move_to_flag",
  Build = "build",
  AttackCreep = "attack_creep",
  AttackStructure = "attack_structure",
  Harvest = "harvest",
  Idle = "idle",
  Transfer = "transfer",
  TransferToCreep = "transfer_to_creep",
  Upgrade = "upgrade",
  UrgentUpgrade = "urgent_upgrade",
  Claim = "claim",
  RetreatToSpawn = "retreat_to_spawn"
}

export interface TaskMemory {
  task: TaskType;
  target?: Serialized<RoomPosition>;
  creepTarget?: Id<Creep>;
  sourceTarget?: Id<Source>;
  spawnTarget?: Id<StructureSpawn>;
}

/**
 * This function has no parameters. The optional next parameter is to faciliate implicit typing.
 */
export type Complete = (next?: () => void) => void;

export default abstract class Task {
  public abstract type: TaskType;

  protected abstract getSteps(creep: Creep, complete: Complete): Step[];

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
