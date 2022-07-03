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
  /**
   * Debug print explaining the status of the current task.
   */
  note?: string;
  [key: string]: any;
}

export type Next = () => void;

export interface Step {
  (creep: Creep, ctx: TaskContext, next: Next): void;
}

export type TaskCoordinate = `${number},${number}`;

export interface TaskMemory {
  task?: TaskCoordinate;
  taskId?: Id<Task>;
  debug: boolean;
  target?: Serialized<RoomPosition>;
  creepTarget?: Id<Creep>;
  structureTarget?: Id<AnyStructure>;
  constructionTarget?: Id<ConstructionSite>;
  sourceTarget?: Id<Source>;
  spawnTarget?: Id<StructureSpawn>;
  salvageTarget?: Id<Tombstone> | Id<Ruin>;
  resourceTarget?: Id<Resource>;
}

export function clearTaskTargets(creep: Creep): void {
  creep.memory.target = undefined;
  creep.memory.creepTarget = undefined;
  creep.memory.structureTarget = undefined;
  creep.memory.constructionTarget = undefined;
  creep.memory.sourceTarget = undefined;
  creep.memory.spawnTarget = undefined;
  creep.memory.salvageTarget = undefined;
  creep.memory.resourceTarget = undefined;
}

export default interface Task {
  id: Id<this>;
  displayName: string;
  steps: Step[];
}
