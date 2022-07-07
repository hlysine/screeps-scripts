import { Serialized } from "utils/TypeUtils";

export enum TaskStatus {
  /**
   * The task is currently running. No more tasks will be executed in the same tick.
   * This task will be prioritized over other tasks of the same tier in the next tick.
   * Task data is persisted to the next tick.
   */
  InProgress = "in_progress",
  /**
   * The task is currently running with a low priority. No more tasks will be executed in the same tick,
   * but it does not get priority over other tasks of the same tier in the next tick.
   * Task data is persisted to the next tick.
   */
  Background = "background",
  /**
   * The task is complete or cannot be executed. The next task in queue will be executed in the same tick.
   * Task data will be discarded.
   */
  Complete = "complete"
}

export interface TaskContext<TData = unknown> {
  status: TaskStatus;
  data: TData;
  /**
   * Debug print explaining the status of the current task.
   */
  note?: string;
  [key: string]: any;
}

export type Next = () => void;

export interface Step<TData = unknown> {
  (creep: Creep, ctx: TaskContext<TData>, next: Next): void;
}

export type TaskCoordinate = `${number},${number}`;

export interface TaskMemory {
  /**
   * Coordinate of the in-progress task in the role task matrix.
   */
  task?: TaskCoordinate;
  /**
   * The id of the current task. This is used to verify the task coordinate.
   */
  taskId?: Id<Task>;
  /**
   * Whether the task gets priority over other tasks of the same tier.
   */
  isBackground?: boolean;
  /**
   * If debug is true, the creep is highlighted and detailed task information is printed.
   */
  debug: boolean;
  /**
   * Where the creep is currently headed to.
   * Note that this field is shared between tasks and may be overwritten by other tasks.
   */
  target?: Serialized<RoomPosition>;
  /**
   * Id of the current target of the task. This is used by TaskTargetManager to manage targets.
   */
  targetId?: string;
  /**
   * The data associated with the current task.
   * This data is only accessible to the current task and is cleared when the task is completed.
   */
  data?: unknown;
}

export function makeTask<TData>(task: Task<TData>): Task {
  return task as Task;
}

export default interface Task<TData = unknown> {
  id: Id<Task>;
  displayName: string;
  data: (creep: Creep) => TData;
  steps: Step<TData>[];
}
