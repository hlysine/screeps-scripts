import Manager from "./Manager";
import Role, { CreepInfo, RoleCountMap } from "creep/roles/Role";
import { Roles } from "creep/roles/RoleStore";

export interface SpawnMemory {
  /**
   * Name of the spawn that this creep comes from.
   */
  origin: string;
}

interface RoleInfo {
  limit: number;
  creepInfo: CreepInfo;
  spawnPriority: number;
}

interface RoleInfoMap {
  [key: Id<Role>]: RoleInfo;
}

interface SpawnInfo {
  spawnId: Id<StructureSpawn>;
  roles: RoleInfoMap;
}

interface SpawnRoleCount {
  [key: string]: RoleCountMap;
}

interface RoleReport {
  id: string;
  count: number;
  energyCost: number;
  targetCount: number;
  priority: number;
}

interface SpawnReport {
  spawnName: string;
  roomName: string;
  energyCapacity: number;
  spawningName: string;
  roles: RoleReport[];
}

class CreepSpawnManager extends Manager {
  public spawns: SpawnInfo[] | undefined;

  public spawnRefreshFrequency = 10;

  public creeepsCount: SpawnRoleCount = {};

  public visualization = true;

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
        spawnPriority: role.getSpawnPriority(spawn.room, this.creeepsCount[spawn.name])
      };
      return map;
    }, {} as RoleInfoMap);
  }

  public getSpawns(): SpawnInfo[] {
    return Object.values(Game.spawns).map(spawn => {
      return {
        spawnId: spawn.id,
        roles: this.getRoleInfoMap(spawn)
      };
    });
  }

  private countCreepsByRole(creeps: Creep[], origin: string): RoleCountMap {
    const creeepsCount = {} as RoleCountMap;
    creeps.forEach(c => {
      if (c.memory.origin === undefined) {
        c.memory.origin = origin;
      } else if (c.memory.origin !== origin) return;
      const role = c.memory.role;
      if (!creeepsCount[role]) creeepsCount[role] = 0;
      creeepsCount[role]++;
    });
    return creeepsCount;
  }

  private showReport(reports: SpawnReport[]): void {
    if (!this.visualization) {
      let text = "";
      reports.forEach(report => {
        text += `${report.spawnName} in ${report.roomName} (${report.energyCapacity}):\n`;
        if (report.spawningName) {
          text += `  ${report.spawningName} is spawning\n`;
        } else {
          report.roles.forEach(role => {
            text += `  ${role.id.padEnd(20, " ")} ${role.count}/${role.targetCount} (${role.energyCost
              .toString()
              .padStart(4, " ")} energy ${role.priority.toString().padStart(3, " ")} priority)\n`;
          });
        }
      });
      console.log(text);
    } else {
      reports.forEach(report => {
        const visual = new RoomVisual(report.roomName);
        visual.text(`${report.spawnName} in ${report.roomName} (${report.energyCapacity}):\n`, 0, 0.2, {
          align: "left",
          color: "white",
          opacity: 1,
          font: 1,
          backgroundColor: "#ffffff33",
          stroke: "transparent"
        });
        if (report.spawningName) {
          visual.text("Spawning " + report.spawningName, 1, 1.7, {
            align: "left",
            color: "#bbbbbb",
            opacity: 1,
            backgroundColor: "#ffffff33",
            font: "0.7 monospace"
          });
        } else {
          let y = 1.7;
          report.roles.forEach(role => {
            visual.text(
              `${role.id.padEnd(20, " ")} ${role.count}/${role.targetCount} (${role.energyCost
                .toString()
                .padStart(4, " ")} energy ${role.priority.toString().padStart(3, " ")} priority)`,
              1,
              y,
              {
                align: "left",
                color: "#bbbbbb",
                opacity: 1,
                backgroundColor: "#ffffff33",
                font: "0.6 monospace"
              }
            );
            y += 1.25;
          });
        }
      });
    }
  }

  protected override loop(): void {
    const creeps = Object.values(Game.creeps);
    Object.values(Game.spawns).forEach(spawn => {
      this.creeepsCount[spawn.name] = this.countCreepsByRole(creeps, spawn.name);
    });
    console.log(`Total creeps: ${creeps.length}`);

    if (!this.spawns || Game.time % this.spawnRefreshFrequency === 0) {
      if (!this.spawns) console.log("Initializing spawn info");
      this.spawns = this.getSpawns();
    }

    const reports: SpawnReport[] = this.spawns
      .map(spawnInfo => {
        const { spawnId, roles } = spawnInfo;
        const spawn = Game.getObjectById(spawnId);
        if (spawn === null) return undefined;

        const report: SpawnReport = {
          spawnName: spawn.name,
          roomName: spawn.pos.roomName,
          energyCapacity: spawn.room.energyCapacityAvailable,
          spawningName: "",
          roles: []
        };

        if (spawn.spawning) {
          const spawningCreep = Game.creeps[spawn.spawning.name];
          spawn.room.visual.text("🛠️" + spawningCreep.name, spawn.pos.x + 1, spawn.pos.y, {
            align: "left",
            opacity: 0.8
          });
          report.spawningName = spawningCreep.name;
          return report;
        }

        let blockSpawn = false;

        for (const role of Roles.slice().sort((a, b) => roles[b.id].spawnPriority - roles[a.id].spawnPriority)) {
          const {
            limit,
            creepInfo: { bodyParts, energyCost },
            spawnPriority
          } = roles[role.id];
          const count = this.creeepsCount[spawn.name][role.id] || 0;
          report.roles.push({
            id: role.id,
            count,
            energyCost,
            targetCount: limit,
            priority: spawnPriority
          });
          if (!blockSpawn && count < limit) {
            if (spawn.room.energyAvailable >= energyCost) {
              const newName = `${spawn.name}-${role.id}-${Game.time}`;
              const result = spawn.spawnCreep(bodyParts, newName, {
                memory: { role: role.id, debug: false, origin: spawn.name }
              });
              if (result === OK) {
                this.creeepsCount[spawn.name][role.id] = count + 1;
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
          }
        }

        return report;
      })
      .filter(r => !!r) as SpawnReport[];

    this.showReport(reports);
  }
}

export default new CreepSpawnManager();
