import { Serialized } from "utils/TypeUtils";

export enum ActionType {
  Harvest = "harvest",
  Upgrade = "upgrade",
  Build = "build",
  Transfer = "transfer",
  Idle = "idle"
}

export interface ActionMenory {
  action: ActionType;
  target?: Serialized<RoomPosition>;
}

export default interface Action {
  loop(creep: Creep, complete: () => void): void;
  type: ActionType;
}
