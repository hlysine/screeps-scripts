import "./utils/prototypes/ArrayProto";
import "./utils/prototypes/CreepProto";
import "./utils/prototypes/RoomPositionProto";
import "./utils/prototypes/RoomProto";
import { ErrorMapper } from "utils/ErrorMapper";
import { Serialized } from "utils/TypeUtils";
import { RoleMemory } from "creep/roles/Role";
import { TaskMemory } from "creep/tasks/Task";
import TowerManager from "managers/TowerManager";
import SourceManager from "managers/SourceManager";
import CreepSpawnManager, { SpawnMemory } from "managers/CreepSpawnManager";
import CreepTaskManager from "managers/CreepTaskManager";
import FlagManager from "managers/FlagManager";
import TaskTargetManager from "managers/TaskTargetManager";
import RoadConstructionManager, { RoadMemory } from "managers/RoadConstructionManager";

declare global {
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory extends TaskMemory, RoleMemory, SpawnMemory {
    _move?: {
      dest: Serialized<RoomPosition>;
      time: number;
      path: string;
      room: string;
    };
  }

  interface RoomMemory extends RoadMemory {
    [_: symbol]: never; // placeholder
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      managers: typeof managers;
    }
  }
}

const managers = {
  flag: FlagManager,
  tower: TowerManager,
  source: SourceManager,
  creepSpawn: CreepSpawnManager,
  taskTarget: TaskTargetManager,
  creepTask: CreepTaskManager,
  roadConstruction: RoadConstructionManager
} as const;
global.managers = managers;

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
  for (const name in managers) {
    managers[name as keyof typeof managers].loop();
  }
  if (Game.cpu.bucket === 10000) {
    Game.cpu.generatePixel?.(); // this function does not exist on private servers
    console.log("Generated pixel");
  }
  console.log("CPU usage:", Game.cpu.getUsed().toFixed(2));
});
