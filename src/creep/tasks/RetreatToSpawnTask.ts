import { RoleType } from "creep/roles/Role";
import { findClosestAcrossRooms } from "utils/MoveUtils";
import Task, { TaskType, Complete, Step } from "./Task";

export default class RetreatToSpawnTask extends Task {
  public override type: TaskType = TaskType.RetreatToSpawn;

  public override getSteps(creep: Creep, complete: Complete): Step[] {
    return [
      next => {
        if (creep.memory.spawnTarget) {
          const spawn = Game.getObjectById(creep.memory.spawnTarget);
          if (spawn) {
            if (creep.moveTo(spawn, { visualizePathStyle: { stroke: "#ffffff" }, range: 15 }) === ERR_NO_PATH) {
              creep.memory.target = undefined;
              creep.memory.spawnTarget = undefined;
            } else {
              complete();
              return;
            }
          }
        }
        next();
      },
      _next => {
        const closestSpawn = findClosestAcrossRooms(creep.pos, Object.values(Game.spawns));
        if (!closestSpawn) {
          creep.memory.target = undefined;
          creep.memory.spawnTarget = undefined;
          complete();
          return;
        }
        if (creep.pos.roomName === closestSpawn.pos.roomName && creep.pos.inRangeTo(closestSpawn, 15)) {
          creep.memory.target = undefined;
          creep.memory.spawnTarget = undefined;
          complete();
          return;
        }
        // these roles prioritize idling at the flag instead of going back to spawn
        if (
          (creep.memory.role === RoleType.Defender ||
            creep.memory.role === RoleType.Attacker ||
            creep.memory.role === RoleType.Claimer) &&
          creep.room.find(FIND_FLAGS, { filter: f => f.name.toLowerCase().includes("@" + creep.memory.role) }).length >
            0
        ) {
          creep.memory.target = undefined;
          creep.memory.spawnTarget = undefined;
          complete();
          return;
        }
        creep.moveTo(closestSpawn.pos, { visualizePathStyle: { stroke: "#ffffff" }, range: 15 });
        creep.memory.target = closestSpawn.pos;
        creep.memory.spawnTarget = closestSpawn.id;
        complete();
      }
    ];
  }
}
