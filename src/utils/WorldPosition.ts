const WORLD_SIZE = 25;
const SIM_WORLD_OFFSET = WORLD_SIZE * 2 * 50;

export default class WorldPosition {
  public static readonly WORLD_SIZE = WORLD_SIZE;
  public x: number;
  public y: number;
  public constructor(roomPos: RoomPosition);
  public constructor(x: number, y: number);
  public constructor(xx: number | RoomPosition, yy?: number) {
    if (xx instanceof RoomPosition && yy === undefined) {
      if (xx.roomName === "sim") {
        this.x = xx.x + SIM_WORLD_OFFSET;
        this.y = xx.y;
      } else {
        const room = /^([WE])([0-9]+)([NS])([0-9]+)$/.exec(xx.roomName);
        if (!room) {
          throw new Error("Invalid room name");
        }
        this.x = xx.x + 50 * (WORLD_SIZE + (room[1] === "W" ? -Number(room[2]) : Number(room[2]) + 1));
        this.y = xx.y + 50 * (WORLD_SIZE + (room[3] === "N" ? -Number(room[4]) : Number(room[4]) + 1));
      }
    } else if (typeof xx === "number" && typeof yy === "number") {
      this.x = xx;
      this.y = yy;
    } else {
      throw new Error("Invalid arguments");
    }
  }

  public static deserialize(json: number): WorldPosition {
    return new WorldPosition(Math.floor(json / (WORLD_SIZE * 2 * 50)), json % (WORLD_SIZE * 2 * 50));
  }

  /**
   * Serialize a WorldPosition into something that can be JSON'd
   */
  public serialize(): number {
    return this.x * (WORLD_SIZE * 2 * 50) + this.y;
  }

  /**
   * Create a standard RoomPosition
   */
  public toRoomPosition(): RoomPosition {
    if (this.x >= SIM_WORLD_OFFSET) {
      return new RoomPosition(this.x - SIM_WORLD_OFFSET, this.y, "sim");
    } else {
      return new RoomPosition(this.x % 50, this.y % 50, this.getRoomName());
    }
  }

  /**
   * Return the name of the room this position is in
   */
  public getRoomName(): string {
    if (this.x >= SIM_WORLD_OFFSET) {
      return "sim";
    }
    return (
      (this.x <= WORLD_SIZE * 50 + 49
        ? `W${WORLD_SIZE - Math.floor(this.x / 50)}`
        : `E${Math.floor(this.x / 50) - WORLD_SIZE - 1}`) +
      (this.y <= WORLD_SIZE * 50 + 49
        ? `N${WORLD_SIZE - Math.floor(this.y / 50)}`
        : `S${Math.floor(this.y / 50) - WORLD_SIZE - 1}`)
    );
  }

  /**
   * Return a new WorldPosition in the direction request
   */
  public getPositionInDirection(direction: DirectionConstant): WorldPosition {
    switch (direction) {
      case TOP:
        return new WorldPosition(this.x, this.y - 1);
      case TOP_RIGHT:
        return new WorldPosition(this.x + 1, this.y - 1);
      case RIGHT:
        return new WorldPosition(this.x + 1, this.y);
      case BOTTOM_RIGHT:
        return new WorldPosition(this.x + 1, this.y + 1);
      case BOTTOM:
        return new WorldPosition(this.x, this.y + 1);
      case BOTTOM_LEFT:
        return new WorldPosition(this.x - 1, this.y + 1);
      case LEFT:
        return new WorldPosition(this.x - 1, this.y);
      case TOP_LEFT:
        return new WorldPosition(this.x - 1, this.y - 1);
    }
  }

  /**
   * Gets the linear direction to a tile
   */
  public getDirectionTo(pos: WorldPosition): DirectionConstant {
    const dx = pos.x - this.x;
    const dy = pos.y - this.y;
    if (dx > 0) {
      if (dy > 0) {
        return BOTTOM_RIGHT;
      } else if (dy < 0) {
        return TOP_RIGHT;
      } else {
        return RIGHT;
      }
    } else if (dx < 0) {
      if (dy > 0) {
        return BOTTOM_LEFT;
      } else if (dy < 0) {
        return TOP_LEFT;
      } else {
        return LEFT;
      }
    } else {
      if (dy > 0) {
        return BOTTOM;
      } else if (dy < 0) {
        return TOP;
      }
    }
    return TOP;
  }

  /**
   * If this position is on the border then return the position in the next room
   */
  public getPositionInNextRoom(): WorldPosition | undefined {
    const exit = new WorldPosition(this.x, this.y);
    if (this.y % 50 === 0) {
      --exit.y;
    } else if (this.y % 50 === 49) {
      ++exit.y;
    } else if (this.x % 50 === 0) {
      --exit.x;
    } else if (this.x % 50 === 49) {
      ++exit.x;
    } else {
      return undefined;
    }
    return exit;
  }

  /**
   * Equality check
   */
  public isEqualTo(pos: WorldPosition | RoomPosition): boolean {
    if (!(pos instanceof WorldPosition)) pos = new WorldPosition(pos);
    return this.x === pos.x && this.y === pos.y;
  }

  /**
   * Get distance to another position
   */
  public getRangeTo(pos: WorldPosition | RoomPosition): number {
    if (!(pos instanceof WorldPosition)) pos = new WorldPosition(pos);
    return Math.max(Math.abs(this.x - pos.x), Math.abs(this.y - pos.y));
  }

  /**
   * Estimate the path distance to another position.
   * This is different fron getRangeTo because this tries to compensate for room borders.
   */
  public estimatePathDistanceTo(pos: WorldPosition | RoomPosition): number {
    if (!(pos instanceof WorldPosition)) pos = new WorldPosition(pos);
    return Math.abs(this.x - pos.x) + Math.abs(this.y - pos.y);
  }

  /**
   * Is this position next to another position
   */
  public isNearTo(pos: WorldPosition | RoomPosition): boolean {
    return this.getRangeTo(pos) <= 1;
  }

  public toString(): string {
    const pos = this.toRoomPosition();
    return `[WorldPosition ${pos.roomName}{${pos.x}, ${pos.y}}]`;
  }
}
