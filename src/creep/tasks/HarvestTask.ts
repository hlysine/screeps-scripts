import SourceManager from "room/SourceManager";
import { completeTask, requireEnergyCapacity } from "./SharedSteps";
import {
  getInterRoomDistance,
  findClosestAcrossRooms,
  isMoveSuccess,
  deserialize,
  positionEquals
} from "utils/MoveUtils";
import Task, { TaskContext, Next, TaskStatus } from "./Task";
import { isRoomRestricted } from "utils/StructureUtils";

const HarvestTask: Task = {
  id: "harvest" as Id<Task>,
  displayName: "Harvest",

  steps: [
    requireEnergyCapacity,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.sourceTarget) {
        const memoizedTarget = Game.getObjectById(creep.memory.sourceTarget);
        if (memoizedTarget) {
          if (creep.harvest(memoizedTarget) === OK) {
            creep.memory.target = creep.pos;
            ctx.status = TaskStatus.InProgress;
            ctx.note = "harvesting memory target";
            return;
          }
        }
      }

      const sources = creep.room.find(FIND_SOURCES_ACTIVE, {
        filter: source => !isRoomRestricted(source.room)
      });
      for (const target of sources) {
        if (creep.harvest(target) === OK) {
          creep.memory.target = creep.pos;
          creep.memory.sourceTarget = target.id;
          const reservation = SourceManager.reservedSpots.find(s => positionEquals(s.pos, creep.pos));
          if (reservation) {
            SourceManager.claimReservedSpot(reservation.spot);
          }
          ctx.status = TaskStatus.InProgress;
          ctx.note = "harvesting nearby target";
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      // cannot check sourceTarget here because it can be undefined when mining in another room without visibility
      if (creep.memory.target) {
        if (positionEquals(creep.memory.target, creep.pos)) {
          creep.memory.target = undefined;
          creep.memory.sourceTarget = undefined;
          ctx.status = TaskStatus.Complete;
          ctx.note = "stuck at memory target position";
          return;
        }
        if (!SourceManager.isRoomAvailable(creep.memory.target.roomName)) {
          creep.memory.target = undefined;
          creep.memory.sourceTarget = undefined;
          ctx.status = TaskStatus.Complete;
          ctx.note = "memory target room is not available";
          return;
        }
        if (creep.memory.sourceTarget) {
          const target = Game.getObjectById(creep.memory.sourceTarget);
          if (!target || target.energy <= 0 || isRoomRestricted(target.room)) {
            creep.memory.target = undefined;
            creep.memory.sourceTarget = undefined;
            ctx.status = TaskStatus.Complete;
            ctx.note = "memory target is no longer valid";
            return;
          }
        }
        if (
          !isMoveSuccess(
            creep.moveTo(deserialize(creep.memory.target), {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          creep.memory.target = undefined;
          creep.memory.sourceTarget = undefined;
          ctx.status = TaskStatus.Complete;
          ctx.note = "failed to path find to memory target";
          return;
        } else {
          const room = Game.rooms[creep.memory.target.roomName];
          if (room && !creep.memory.sourceTarget) {
            const source = room.lookForAtArea(
              LOOK_SOURCES,
              creep.memory.target.y - 1,
              creep.memory.target.x - 1,
              creep.memory.target.y + 1,
              creep.memory.target.x + 1,
              true
            )[0];
            if (source) {
              creep.memory.sourceTarget = source.source.id;
            } else {
              // there isn't a source?!
              console.log(`Source not found at ${creep.memory.target.roomName} (creep: ${creep.name})`);
              creep.memory.target = undefined;
              creep.memory.sourceTarget = undefined;
              ctx.status = TaskStatus.Complete;
              ctx.note = "no source near memory target (!)";
              return;
            }
          }
          ctx.status = TaskStatus.InProgress;
          ctx.note = "moving to memory target";
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const freeTarget = findClosestAcrossRooms(creep.pos, SourceManager.freeSpots);
      if (freeTarget) {
        if (isMoveSuccess(creep.moveTo(freeTarget, { visualizePathStyle: { stroke: "#ffffff" } }))) {
          SourceManager.claimFreeSpot(freeTarget);
          creep.memory.target = freeTarget.pos;
          creep.memory.sourceTarget = freeTarget.sourceId;
          ctx.status = TaskStatus.InProgress;
          ctx.note = "moving to free target";
          return;
        }
      }
      const reservedTarget = creep.pos.findClosestByPath(SourceManager.reservedSpots);
      if (reservedTarget) {
        if (isMoveSuccess(creep.moveTo(reservedTarget))) {
          if (creep.memory._move) {
            const path = Room.deserializePath(creep.memory._move.path);
            if (path.length + getInterRoomDistance(creep.pos, reservedTarget.spot.pos) < reservedTarget.distance) {
              creep.room.visual.poly(
                path.map(s => [s.x, s.y]),
                { fill: "transparent", stroke: "#00f", lineStyle: "dashed", strokeWidth: 0.15, opacity: 0.5 }
              );
              SourceManager.claimReservedSpot(reservedTarget.spot);
              creep.memory.target = reservedTarget.pos;
              creep.memory.sourceTarget = reservedTarget.spot.sourceId;
              ctx.status = TaskStatus.InProgress;
              ctx.note = "moving to reserved target";
              return;
            } else {
              creep.cancelOrder("move");
            }
          } else {
            creep.cancelOrder("move");
          }
        }
      }
      next();
    },
    completeTask
  ]
};

export default HarvestTask;
