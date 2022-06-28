import Manager from "./Manager";
import { ActionType } from "creep/Action";

interface SpawnInfo {
  spawn: StructureSpawn;
  bodyParts: BodyPartConstant[];
}

function getBodyParts(energyCapacity: number): BodyPartConstant[] {
  const base = Math.floor(energyCapacity / 200);
  let remainder = energyCapacity % 200;
  const bodyParts: BodyPartConstant[] = [];
  if (remainder >= 100) {
    bodyParts.push(WORK);
    remainder -= 100;
  }
  if (remainder >= 50) {
    bodyParts.push(MOVE);
  }
  for (let i = 0; i < base; i++) {
    bodyParts.push(WORK);
    bodyParts.push(CARRY);
    bodyParts.push(MOVE);
  }
  return bodyParts;
}

class CreepSpawnManager implements Manager {
  public creepsPerSpawn = 15;

  public constructor() {
    console.log("CreepSpawnManager init");
  }

  public loop(): void {
    const creeps = Object.values(Game.creeps);
    console.log(`Total creeps: ${creeps.length}`);

    const spawns: SpawnInfo[] = [];
    Object.values(Game.spawns).forEach(spawn => {
      const energyAvailable = spawn.room.energyCapacityAvailable;
      spawns.push({
        spawn,
        bodyParts: getBodyParts(energyAvailable)
      });
    });

    spawns.forEach(spawnInfo => {
      const { spawn, bodyParts } = spawnInfo;
      const creepsInSpawn = creeps.filter(c => c.room.name === spawn.room.name);
      if (creepsInSpawn.length < this.creepsPerSpawn) {
        const newName = `${spawn.room.name}-Creep${Game.time}`;
        const result = spawn.spawnCreep(bodyParts, newName, {
          memory: { action: ActionType.Idle }
        });
        console.log(`Spawning new creep: ${newName}\nResult: ${result}`);
      }
    });
  }
}

export default new CreepSpawnManager();
