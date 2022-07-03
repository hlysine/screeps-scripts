import Task, { Step } from "./Task";

export default function PrependTask(task: Task, ...prepend: Step[]): Task {
  return {
    id: (task.id + "_prepended") as Id<Task>,
    displayName: task.displayName + "  prepended",
    steps: [...prepend, ...task.steps]
  };
}
