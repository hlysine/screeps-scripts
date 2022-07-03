import Manager from "./Manager";
import Role, { CreepInfo, RoleCountMap } from "creep/roles/Role";
import { Roles } from "creep/roles/RoleStore";
import WorkerRole from "creep/roles/WorkerRole";

interface RoleInfo {
  limit: number;
  creepInfo: CreepInfo;
  spawnPriority: number;
}

interface RoleInfoMap {
  [key: Id<Role>]: RoleInfo;
}

interface SpawnInfo {
  spawn: StructureSpawn;
  roles: RoleInfoMap;
}

class CreepSpawnManager implements Manager {
  public spawns: SpawnInfo[] | undefined;

  public spawnRefreshFrequency = 10;

  public creeepsCount: RoleCountMap = {} as RoleCountMap;

  private countCreepCapacity(): number {
    return Object.values(Game.creeps).reduce((sum, creep) => {
      return sum + creep.store.getCapacity(RESOURCE_ENERGY);
    }, 0);
  }

  private getRoleInfoMap(spawn: StructureSpawn): RoleInfoMap {
    const effectiveEnergyCapacity = Math.min(
      spawn.room.energyCapacityAvailable,
      // we can't use capacity from extensions if there are no creeps filling them
      spawn.store.getCapacity(RESOURCE_ENERGY) + this.countCreepCapacity() * 3,
      // creeps too large may deplete energy too quickly
      (spawn.room.controller?.level ?? 0) * 300
    );
    return Roles.reduce((map, role) => {
      map[role.id] = {
        limit: role.getCreepLimit(spawn.room),
        creepInfo: role.getCreepInfo(effectiveEnergyCapacity),
        spawnPriority: role.getSpawnPriority(spawn.room, this.creeepsCount)
      };
      return map;
    }, {} as RoleInfoMap);
  }

  public getSpawns(): SpawnInfo[] {
    return Object.values(Game.spawns).map(spawn => {
      return {
        spawn,
        roles: this.getRoleInfoMap(spawn)
      };
    });
  }

  private countCreepsByRole(creeps: Creep[]): void {
    this.creeepsCount = {} as RoleCountMap;
    creeps.forEach(c => {
      const role = c.memory.role;
      if (!this.creeepsCount[role]) this.creeepsCount[role] = 0;
      this.creeepsCount[role]++;
    });
  }

  public loop(): void {
    const creeps = Object.values(Game.creeps);
    this.countCreepsByRole(creeps);
    console.log(`Total creeps: ${creeps.length}`);

    if (!this.spawns || Game.time % this.spawnRefreshFrequency === 0) {
      if (!this.spawns) console.log("Initializing spawn info");
      this.spawns = this.getSpawns();
    }

    this.spawns.forEach(spawnInfo => {
      const { spawn, roles } = spawnInfo;

      let report = `Spawn info: ${spawn.name}\n`;

      if (spawn.spawning) {
        const spawningCreep = Game.creeps[spawn.spawning.name];
        spawn.room.visual.text("🛠️" + spawningCreep.name, spawn.pos.x + 1, spawn.pos.y, {
          align: "left",
          opacity: 0.8
        });
        report += `  Spawning ${spawningCreep.name}`;
        console.log(report);
        return;
      }

      let blockSpawn = false;

      for (const role of Roles.slice().sort((a, b) => roles[b.id].spawnPriority - roles[a.id].spawnPriority)) {
        const {
          limit,
          creepInfo: { bodyParts, energyCost },
          spawnPriority
        } = roles[role.id];
        const count = this.creeepsCount[role.id] || 0;
        report += `  ${role.id}: ${count}/${limit} (${energyCost} energy ${spawnPriority} priority)\n`;
        if (!blockSpawn && count < limit) {
          if (spawn.room.energyAvailable >= energyCost) {
            const newName = `${spawn.name}-${role.id}-${Game.time}`;
            const result = spawn.spawnCreep(bodyParts, newName, {
              memory: { role: role.id, debug: false }
            });
            console.log(`Spawning new creep: ${newName}\nResult: ${result}`);
            if (result === OK) {
              this.creeepsCount[role.id] = count + 1;
              blockSpawn = true;
            }
          } else {
            blockSpawn = true;
          }
        }
      }

      if (!blockSpawn) {
        const nearbyCreeps = spawn.room.lookForAtArea(
          LOOK_CREEPS,
          spawn.pos.y - 1,
          spawn.pos.x - 1,
          spawn.pos.y + 1,
          spawn.pos.x + 1,
          true
        );
        // find creep with min lifetime
        let creepWithMinLifetime: Creep | undefined;
        for (const creep of nearbyCreeps) {
          if (!creep.creep.ticksToLive) break;
          if (creep.creep.ticksToLive < (creepWithMinLifetime?.ticksToLive ?? Number.POSITIVE_INFINITY)) {
            creepWithMinLifetime = creep.creep;
          }
        }
        if (creepWithMinLifetime && creepWithMinLifetime.ticksToLive && creepWithMinLifetime.ticksToLive < 1000) {
          spawn.room.visual.text("🔨" + creepWithMinLifetime.name, spawn.pos.x + 1, spawn.pos.y, {
            align: "left",
            opacity: 0.8
          });
          spawn.renewCreep(creepWithMinLifetime);
          console.log(`Renewing ${creepWithMinLifetime.name}`);
        }
      }

      console.log(report);
    });
  }
}

export default new CreepSpawnManager();
