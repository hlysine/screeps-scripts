import { ErrorMapper } from "utils/ErrorMapper";
import builder from "creeps/builder";
import harvester from "creeps/harvester";
import tower from "structures/tower";
import upgrader from "creeps/upgrader";

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

  interface CreepMemory {
    role: string;
    working: boolean;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

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

  const harvesters = _.filter(Game.creeps, creep => creep.memory.role === "harvester");
  const builders = _.filter(Game.creeps, creep => creep.memory.role === "builder");
  const upgraders = _.filter(Game.creeps, creep => creep.memory.role === "upgrader");
  console.log(`Harvesters: ${harvesters.length}\nBuilders: ${builders.length}\nUpgraders: ${upgraders.length}`);

  if (harvesters.length < 2) {
    const newName = `Harvester${Game.time}`;
    const result = Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE], newName, {
      memory: { role: "harvester", working: true }
    });
    console.log(`Spawning new harvester: ${newName}\nResult: ${result}`);
  }

  if (builders.length < 2) {
    const newName = `Builder${Game.time}`;
    console.log("Spawning new builder: " + newName);
    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: "builder", working: true } });
  }

  if (upgraders.length < 2) {
    const newName = `Upgrader${Game.time}`;
    console.log("Spawning new upgrader: " + newName);
    Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: "upgrader", working: true } });
  }

  if (Game.spawns.Spawn1.spawning) {
    const spawningCreep = Game.creeps[Game.spawns.Spawn1.spawning.name];
    Game.spawns.Spawn1.room.visual.text(
      "🛠️" + spawningCreep.memory.role,
      Game.spawns.Spawn1.pos.x + 1,
      Game.spawns.Spawn1.pos.y,
      { align: "left", opacity: 0.8 }
    );
  }

  for (const name in Game.structures) {
    const structure = Game.structures[name];
    if (structure instanceof StructureTower) {
      tower.run(structure);
    }
  }

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role === "harvester") {
      harvester.run(creep);
    }
    if (creep.memory.role === "upgrader") {
      upgrader.run(creep);
    }
    if (creep.memory.role === "builder") {
      builder.run(creep);
    }
  }
});
