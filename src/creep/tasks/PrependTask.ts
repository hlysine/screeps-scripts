import Task, { makeTask, Step } from "./Task";

export default function PrependTask(task: Task, ...prepend: Step[]): Task {
  return makeTask({
    id: (task.id + "_prepended") as Id<Task>,
    displayName: task.displayName + "  prepended",
    data: creep => task.data(creep),
    steps: [...prepend, ...task.steps]
  });
}
