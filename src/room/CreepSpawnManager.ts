import Manager from "./Manager";
import { ActionType } from "creep/Action";

interface SpawnInfo {
  spawn: StructureSpawn;
  bodyParts: BodyPartConstant[];
  creepLimit: number;
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

function getCreepLimit(room: Room): number {
  let limit = 1;
  if (room.controller) {
    limit += room.controller.level + 3;
  }
  limit += Object.values(Game.structures).filter(s => s.pos.roomName === room.name).length;
  return limit;
}

class CreepSpawnManager implements Manager {
  public spawns: SpawnInfo[] | undefined;

  public spawnRefreshFrequency = 10;

  public getSpawns(): SpawnInfo[] {
    return Object.values(Game.spawns).map(spawn => {
      const energyAvailable = spawn.room.energyCapacityAvailable;
      return {
        spawn,
        bodyParts: getBodyParts(energyAvailable),
        creepLimit: getCreepLimit(spawn.room)
      };
    });
  }

  public loop(): void {
    const creeps = Object.values(Game.creeps);
    console.log(`Total creeps: ${creeps.length}`);

    if (!this.spawns || Game.time % this.spawnRefreshFrequency === 0) {
      if (!this.spawns) console.log("Initializing spawn info");
      this.spawns = this.getSpawns();
    }

    this.spawns.forEach(spawnInfo => {
      const { spawn, bodyParts } = spawnInfo;
      const creepsInSpawn = creeps.filter(c => c.room.name === spawn.room.name);
      if (creepsInSpawn.length < spawnInfo.creepLimit) {
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
