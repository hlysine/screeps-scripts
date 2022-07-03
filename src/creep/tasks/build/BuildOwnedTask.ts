import makeBuildTask from "./MakeBuildTask";
import Task from "../Task";

const BuildOwnedTask: Task = {
  id: "build_owned" as Id<Task>,
  displayName: "Build owned",

  steps: makeBuildTask(site => site.my)
};

export default BuildOwnedTask;
