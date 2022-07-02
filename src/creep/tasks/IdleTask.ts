import Task, { Next, TaskContext, TaskStatus } from "./Task";

const IdleTask: Task = {
  id: "idle" as Id<Task>,
  displayName: "Idle",

  steps: [
    (_creep: Creep, ctx: TaskContext, next: Next): void => {
      ctx.status = TaskStatus.Background;
      next();
    }
  ]
};

export default IdleTask;
