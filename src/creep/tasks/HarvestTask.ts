import SourceManager from "room/SourceManager";
import { completeTask, requireEnergyCapacity } from "./SharedSteps";
import { positionEquals, getInterRoomDistance, findClosestAcrossRooms, isMoveSuccess } from "utils/MoveUtils";
import Task, { TaskContext, Next, TaskStatus } from "./Task";
import { isRoomRestricted } from "utils/StructureUtils";

const HarvestTask: Task = {
  id: "harvest" as Id<Task>,
  displayName: "Harvest",

  steps: [
    requireEnergyCapacity,
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      const sources = creep.room.find(FIND_SOURCES_ACTIVE, {
        filter: source => !isRoomRestricted(source.room)
      });
      for (const target of sources) {
        if (creep.harvest(target) === OK) {
          creep.memory.target = creep.pos;
          creep.memory.sourceTarget = target.id;
          ctx.status = TaskStatus.InProgress;
          return;
        }
      }
      next();
    },
    (creep: Creep, ctx: TaskContext, next: Next): void => {
      if (creep.memory.target) {
        if (creep.memory.sourceTarget) {
          const source = Game.getObjectById(creep.memory.sourceTarget);
          if (source && (source.energy <= 0 || isRoomRestricted(source.room))) {
            creep.memory.target = undefined;
            creep.memory.sourceTarget = undefined;
            next();
            return;
          }
        }
        if (positionEquals(creep.memory.target, creep.pos)) {
          creep.memory.target = undefined;
        } else if (
          !isMoveSuccess(
            creep.moveTo(new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName), {
              visualizePathStyle: { stroke: "#ffffff" }
            })
          )
        ) {
          creep.memory.target = undefined;
        } else {
          ctx.status = TaskStatus.InProgress;
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
          return;
        }
      }
      const reservedTarget = findClosestAcrossRooms(creep.pos, SourceManager.reservedSpots);
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
