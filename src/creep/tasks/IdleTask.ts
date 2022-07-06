import Task, { makeTask, TaskStatus } from "./Task";

const IdleTask = makeTask({
  id: "idle" as Id<Task>,
  displayName: "Idle",
  data: () => null,

  steps: [
    (_creep, ctx, next) => {
      ctx.status = TaskStatus.Background;
      next();
    }
  ]
});

export default IdleTask;
