let username: string | null = null;

export function getUsername(): string {
  if (username) return username;
  username = Object.values(Game.spawns)[0].owner.username;
  return username;
}

export function isRoomRestricted(room: Room): boolean {
  if (room.controller) {
    if (room.controller.reservation) {
      return room.controller.reservation.username !== getUsername();
    }
    return !room.controller.my && room.controller.level > 0;
  }
  return false;
}
