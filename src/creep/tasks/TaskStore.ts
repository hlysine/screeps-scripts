import Task, { TaskType } from "./Task";
import BuildTask from "./BuildTask";
import AttackCreepTask from "./AttackCreepTask";
import AttackStructureTask from "./AttackStructureTask";
import HarvestTask from "./HarvestTask";
import IdleTask from "./IdleTask";
import TransferTask from "./TransferTask";
import UpgradeTask from "./UpgradeTask";
import UrgentUpgradeTask from "./UrgentUpgradeTask";
import MoveToFlagTask from "./MoveToFlagTask";
import ClaimTask from "./ClaimTask";
import RetreatToSpawnTask from "./RetreatToSpawnTask";
import TransferToCreepTask from "./TransferToCreepTask";

type TaskMap = {
  [key in TaskType]: Task;
};

export const Tasks = [
  new BuildTask(),
  new HarvestTask(),
  new IdleTask(),
  new MoveToFlagTask(),
  new AttackCreepTask(),
  new AttackStructureTask(),
  new TransferTask(),
  new TransferToCreepTask(),
  new UpgradeTask(),
  new UrgentUpgradeTask(),
  new ClaimTask(),
  new RetreatToSpawnTask()
];

export const TaskMap = Tasks.reduce<TaskMap>((map, task) => {
  map[task.type] = task;
  return map;
}, {} as TaskMap);
