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

export function isRoomMine(room: Room): boolean {
  if (room.controller) {
    if (room.controller.my) return true;
    if (room.controller.reservation?.username === getUsername()) return true;
    return false;
  }
  return false;
}

export function getStoreContentTypes(store: StoreDefinition | StoreDefinitionUnlimited): ResourceConstant[] {
  return Object.keys(store).filter(key => store[key as ResourceConstant] > 0) as ResourceConstant[];
}

export function isFilteredStoreEmpty(
  store: StoreDefinition | StoreDefinitionUnlimited,
  filter: (resourceType: ResourceConstant) => boolean
): boolean {
  return !getStoreContentTypes(store).some(filter);
}

export function getExtensionQuota(room: Room): number {
  if (room.controller && room.controller.my) {
    switch (room.controller.level) {
      case 2:
        return 5;
      case 3:
        return 10;
      case 4:
        return 20;
      case 5:
        return 30;
      case 6:
        return 40;
      case 7:
        return 50;
      case 8:
        return 60;
      default:
        return 0;
    }
  }
  return 0;
}

export function getTowerQuota(room: Room): number {
  if (room.controller && room.controller.my) {
    switch (room.controller.level) {
      case 3:
      case 4:
        return 1;
      case 5:
      case 6:
        return 2;
      case 7:
        return 3;
      case 8:
        return 6;
      default:
        return 0;
    }
  }
  return 0;
}
