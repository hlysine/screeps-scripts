import Manager from "./Manager";
import { CreepInfo, RoleType } from "creep/roles/Role";
import { Roles } from "creep/roles/RoleStore";

interface RoleInfo {
  limit: number;
  creepInfo: CreepInfo;
}

type RoleInfoMap = {
  [key in RoleType]: RoleInfo;
};

interface SpawnInfo {
  spawn: StructureSpawn;
  roles: RoleInfoMap;
}

type RoleCountMap = {
  [key in RoleType]: number;
};

class CreepSpawnManager implements Manager {
  public spawns: SpawnInfo[] | undefined;

  public spawnRefreshFrequency = 10;

  private getRoleInfoMap(spawn: StructureSpawn): RoleInfoMap {
    return Roles.reduce((map, role) => {
      map[role.type] = {
        limit: role.getCreepLimit(spawn.room),
        creepInfo: role.getCreepInfo(spawn.room.energyCapacityAvailable)
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

  private countCreepsByRole(creeps: Creep[]): RoleCountMap {
    const creepsByRole: RoleCountMap = {} as RoleCountMap;
    creeps.forEach(c => {
      const role = c.memory.role;
      if (!creepsByRole[role]) creepsByRole[role] = 0;
      creepsByRole[role]++;
    });
    return creepsByRole;
  }

  public loop(): void {
    const creeps = Object.values(Game.creeps);
    console.log(`Total creeps: ${creeps.length}`);

    if (!this.spawns || Game.time % this.spawnRefreshFrequency === 0) {
      if (!this.spawns) console.log("Initializing spawn info");
      this.spawns = this.getSpawns();
    }

    const creepsInSpawn = this.countCreepsByRole(creeps);

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
        return;
      }

      for (const role of Roles) {
        const {
          limit,
          creepInfo: { bodyParts, energyCost }
        } = roles[role.type];
        const count = creepsInSpawn[role.type] || 0;
        report += `  ${role.type}: ${count}/${limit} (${energyCost} energy)\n`;
        if (count < limit && spawn.room.energyAvailable >= energyCost) {
          const newName = `${spawn.name}-${role.type}-${Game.time}`;
          const result = spawn.spawnCreep(bodyParts, newName, {
            memory: { role: role.type, action: role.actions[0] }
          });
          console.log(`Spawning new creep: ${newName}\nResult: ${result}`);
          if (result === OK) {
            creepsInSpawn[role.type] = count + 1;
            break;
          }
        }
      }

      console.log(report);
    });
  }
}

export default new CreepSpawnManager();
