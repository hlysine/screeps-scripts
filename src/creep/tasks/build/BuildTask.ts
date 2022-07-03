import makeBuildTask from "./MakeBuildTask";
import Task from "../Task";

const BuildTask: Task = {
  id: "build" as Id<Task>,
  displayName: "Build",

  steps: makeBuildTask(() => true)
};

export default BuildTask;
