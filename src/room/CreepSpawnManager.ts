import Manager from "./Manager";
import { CreepInfo, RoleCountMap, RoleType } from "creep/roles/Role";
import { Roles } from "creep/roles/RoleStore";

interface RoleInfo {
  limit: number;
  creepInfo: CreepInfo;
  spawnPriority: number;
}

type RoleInfoMap = {
  [key in RoleType]: RoleInfo;
};

interface SpawnInfo {
  spawn: StructureSpawn;
  roles: RoleInfoMap;
}

class CreepSpawnManager implements Manager {
  public spawns: SpawnInfo[] | undefined;

  public spawnRefreshFrequency = 10;

  public creeepsCount: RoleCountMap = {} as RoleCountMap;

  private getRoleInfoMap(spawn: StructureSpawn): RoleInfoMap {
    const effectiveEnergyCapacity = Math.min(
      spawn.room.energyCapacityAvailable,
      // we can't use capacity from extensions if there are no creeps filling them
      spawn.store.getCapacity(RESOURCE_ENERGY) + (this.creeepsCount[RoleType.Worker] ?? 0) * 100,
      // creeps too large may deplete energy too quickly
      (spawn.room.controller?.level ?? 0) * 250
    );
    return Roles.reduce((map, role) => {
      map[role.type] = {
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

      for (const role of Roles.slice().sort((a, b) => roles[b.type].spawnPriority - roles[a.type].spawnPriority)) {
        const {
          limit,
          creepInfo: { bodyParts, energyCost },
          spawnPriority
        } = roles[role.type];
        const count = this.creeepsCount[role.type] || 0;
        report += `  ${role.type}: ${count}/${limit} (${energyCost} energy ${spawnPriority} priority)\n`;
        if (!blockSpawn && count < limit) {
          if (spawn.room.energyAvailable >= energyCost) {
            const newName = `${spawn.name}-${role.type}-${Game.time}`;
            const result = spawn.spawnCreep(bodyParts, newName, {
              memory: { role: role.type, task: role.tasks[0] }
            });
            console.log(`Spawning new creep: ${newName}\nResult: ${result}`);
            if (result === OK) {
              this.creeepsCount[role.type] = count + 1;
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
