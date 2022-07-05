import "./utils/prototypes/ArrayProto";
import { ErrorMapper } from "utils/ErrorMapper";
import { Serialized } from "utils/TypeUtils";
import { RoleMemory } from "creep/roles/Role";
import { TaskMemory } from "creep/tasks/Task";
import TowerManager from "managers/TowerManager";
import SourceManager from "managers/SourceManager";
import CreepSpawnManager from "managers/CreepSpawnManager";
import CreepTaskManager from "managers/CreepTaskManager";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
  }

  interface CreepMemory extends TaskMemory, RoleMemory {
    _move?: {
      dest: Serialized<RoomPosition>;
      time: number;
      path: string;
      room: string;
    };
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      managers: typeof managers;
    }
  }
}

const managers = {
  tower: TowerManager,
  source: SourceManager,
  creepSpawn: CreepSpawnManager,
  creepTask: CreepTaskManager
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
    Game.cpu.generatePixel();
    console.log("Generated pixel");
  }
});
