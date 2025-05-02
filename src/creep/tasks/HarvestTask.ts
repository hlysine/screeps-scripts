import ResourceManager from "managers/ResourceManager";
import { completeTask, requireCapacity } from "./SharedSteps";
import { getInterRoomDistance, findClosestAcrossRooms, deserialize, positionEquals } from "utils/MoveUtils";
import Task, { makeTask, TaskStatus } from "./Task";
import { isRoomRestricted } from "utils/StructureUtils";
import TaskTargetManager from "managers/TaskTargetManager";
import { isHarvestSuccess, isMoveSuccess } from "utils/ReturnCodeUtils";

export const HarvestTaskId = "harvest" as Id<Task>;

export default function HarvestTask(filter: (resourceType: ResourceConstant) => boolean): Task {
  return makeTask({
    id: HarvestTaskId,
    displayName: "Harvest",
    data: () => ({
      targetMemorized: false,
      sourceTarget: undefined as Id<Source> | Id<Mineral> | undefined
    }),

    steps: [
      requireCapacity,
      (creep, ctx, next) => {
        if (ctx.data.sourceTarget) {
          const memoizedTarget = Game.getObjectById(ctx.data.sourceTarget);
          if (memoizedTarget) {
            if (isHarvestSuccess(creep.harvest(memoizedTarget))) {
              creep.memory.target = creep.pos;
              TaskTargetManager.setTarget(creep, HarvestTaskId, memoizedTarget.id);
              ctx.data.targetMemorized = true;
              ctx.status = TaskStatus.InProgress;
              ctx.note = "harvesting memory target";
              return;
            }
          }
        }

        if (filter(RESOURCE_ENERGY)) {
          const sources = creep.room.find(FIND_SOURCES_ACTIVE, {
            filter: source => !isRoomRestricted(source.room)
          });
          for (const target of sources) {
            if (isHarvestSuccess(creep.harvest(target))) {
              creep.memory.target = creep.pos;
              TaskTargetManager.setTarget(creep, HarvestTaskId, target.id);
              ctx.data.sourceTarget = target.id;
              const reservation = ResourceManager.reservedSpots.find(s => positionEquals(s.pos, creep.pos));
              if (reservation) {
                ResourceManager.claimReservedSpot(reservation.spot.resourceType, reservation.spot);
              }
              ctx.data.targetMemorized = true;
              ctx.status = TaskStatus.InProgress;
              ctx.note = "harvesting nearby source";
              return;
            }
          }
        }

        const minerals = creep.room.find(FIND_MINERALS, {
          filter: mineral => filter(mineral.mineralType) && mineral.room && !isRoomRestricted(mineral.room)
        });
        for (const target of minerals) {
          if (isHarvestSuccess(creep.harvest(target))) {
            creep.memory.target = creep.pos;
            TaskTargetManager.setTarget(creep, HarvestTaskId, target.id);
            ctx.data.sourceTarget = target.id;
            const reservation = ResourceManager.reservedSpots.find(s => positionEquals(s.pos, creep.pos));
            if (reservation) {
              ResourceManager.claimReservedSpot(reservation.spot.resourceType, reservation.spot);
            }
            ctx.data.targetMemorized = true;
            ctx.status = TaskStatus.InProgress;
            ctx.note = "harvesting nearby mineral";
            return;
          }
        }
        next();
      },
      (creep, ctx, next) => {
        if (!ctx.data.targetMemorized) {
          next();
          return;
        }
        // cannot check sourceTarget here because it can be undefined when mining in another room without visibility
        if (creep.memory.target) {
          if (positionEquals(creep.memory.target, creep.pos)) {
            ctx.status = TaskStatus.Complete;
            ctx.note = "stuck at memory target position";
            return;
          }
          if (!ResourceManager.isRoomAvailable(creep.memory.target.roomName)) {
            ctx.status = TaskStatus.Complete;
            ctx.note = "memory target room is not available";
            return;
          }
          if (ctx.data.sourceTarget && Game.rooms[creep.memory.target.roomName]) {
            const target = Game.getObjectById(ctx.data.sourceTarget);
            if (
              !target ||
              (target instanceof Source && target.energy <= 0) ||
              (target instanceof Mineral && target.mineralAmount <= 0) ||
              (target.room && isRoomRestricted(target.room))
            ) {
              ctx.status = TaskStatus.Complete;
              ctx.note = "memory target is no longer valid";
              return;
            }
          }
          if (!isMoveSuccess(creep.travelTo(deserialize(creep.memory.target)))) {
            ctx.status = TaskStatus.Complete;
            ctx.note = "failed to path find to memory target";
            return;
          } else {
            const room = Game.rooms[creep.memory.target.roomName];
            if (room && !ctx.data.sourceTarget) {
              const source = room.lookForAtArea(
                LOOK_SOURCES,
                creep.memory.target.y - 1,
                creep.memory.target.x - 1,
                creep.memory.target.y + 1,
                creep.memory.target.x + 1,
                true
              )[0];
              if (source) {
                ctx.data.sourceTarget = source.source.id;
              } else {
                // there isn't a source?!
                console.log(
                  `Source not found at ${creep.memory.target.roomName} ${creep.memory.target.x},${creep.memory.target.y} (creep: ${creep.name})`
                );
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
      (creep, ctx, next) => {
        const freeTarget = findClosestAcrossRooms(
          creep.pos,
          ResourceManager.freeSpots.filter(s => filter(s.resourceType))
        );
        if (freeTarget) {
          if (isMoveSuccess(creep.travelTo(freeTarget))) {
            ResourceManager.claimFreeSpot(freeTarget.resourceType, freeTarget);
            creep.memory.target = freeTarget.pos;
            TaskTargetManager.setTarget(creep, HarvestTaskId, freeTarget.resourceId);
            ctx.data.sourceTarget = freeTarget.resourceId;
            ctx.data.targetMemorized = true;
            ctx.status = TaskStatus.InProgress;
            ctx.note = "moving to free target";
            return;
          }
        }
        const reservedTarget = creep.pos.findClosestByPath(
          ResourceManager.reservedSpots.filter(s => filter(s.spot.resourceType))
        );
        if (reservedTarget) {
          if (isMoveSuccess(creep.travelTo(reservedTarget))) {
            if (creep.memory._trav) {
              const pathLength = creep.memory._trav.path?.length ?? 0;
              if (pathLength + getInterRoomDistance(creep.pos, reservedTarget.spot.pos) < reservedTarget.distance) {
                creep.room.visual.circle(creep.pos.x, creep.pos.y, {
                  radius: 0.7,
                  fill: "transparent",
                  stroke: "#00f",
                  strokeWidth: 0.2
                });
                ResourceManager.claimReservedSpot(reservedTarget.spot.resourceType, reservedTarget.spot);
                creep.memory.target = reservedTarget.pos;
                TaskTargetManager.setTarget(creep, HarvestTaskId, reservedTarget.spot.resourceId);
                ctx.data.sourceTarget = reservedTarget.spot.resourceId;
                ctx.data.targetMemorized = true;
                ctx.status = TaskStatus.InProgress;
                ctx.note = "moving to reserved target";
                reservedTarget.creep.memory.taskId = undefined;
                reservedTarget.creep.memory.task = undefined;
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
  });
}
