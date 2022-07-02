import { Serialized } from "utils/TypeUtils";

export enum TaskStatus {
  /**
   * The task is currently running. No more tasks will be executed in the same tick.
   * This task will be prioritized over other tasks of the same tier in the next tick.
   */
  InProgress = "in_progress",
  /**
   * The task is currently running with a low priority. No more tasks will be executed in the same tick,
   * but it does not get priority over other tasks of the same tier in the next tick.
   */
  Background = "background",
  /**
   * The task is complete or cannot be executed. The next task in queue will be executed in the same tick.
   */
  Complete = "complete"
}

export interface TaskContext {
  status: TaskStatus;
  [key: string]: any;
}

export type Next = () => void;

export interface Step {
  (creep: Creep, ctx: TaskContext, next: Next): void;
}

export interface TaskMemory {
  task?: Id<Task>;
  target?: Serialized<RoomPosition>;
  creepTarget?: Id<Creep>;
  structureTarget?: Id<Structure>;
  sourceTarget?: Id<Source>;
  spawnTarget?: Id<StructureSpawn>;
}

export default interface Task {
  id: Id<this>;
  displayName: string;
  steps: Step[];
}
