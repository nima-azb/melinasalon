export type ServicePackage = {
  id: string;
  name: string;
  price: number;
  duration?: number | null;
  description?: string | null;
};

export type BaseServiceInfo = {
  id: string;
  name: string;
  duration: number;
  capacity: number;
  oneBookingPerDay: boolean;
  isActive: boolean;
  price?: number | null;
  packages?: unknown;
  linkedServiceIds?: string[];
};

export type TimeInterval = {
  startsAt: Date;
  endsAt: Date;
};

export type ServiceBookingItem = TimeInterval & {
  serviceId: string;
};

export type ServiceBlockedTimeItem = TimeInterval & {
  serviceId: string;
};

/**
 * Safely parse packages JSON stored on a Service record.
 */
export function parseServicePackages(packagesJson: unknown): ServicePackage[] {
  if (!packagesJson) return [];

  let list: unknown = packagesJson;
  if (typeof packagesJson === "string") {
    try {
      list = JSON.parse(packagesJson);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(list)) return [];

  return list
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item, idx) => ({
      id: typeof item.id === "string" ? item.id : `pkg-${idx + 1}`,
      name: typeof item.name === "string" ? item.name.trim() : "",
      price:
        typeof item.price === "number" ? item.price : Number(item.price) || 0,
      duration:
        typeof item.duration === "number"
          ? item.duration
          : item.duration
            ? Number(item.duration) || null
            : null,
      description:
        typeof item.description === "string" ? item.description.trim() : null,
    }))
    .filter((pkg) => Boolean(pkg.name && pkg.price >= 0));
}

/**
 * Checks if two time intervals overlap.
 */
export function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Returns all service IDs that consume capacity for a specific component service.
 * A component's capacity is consumed by:
 * 1. The component itself.
 * 2. ANY combined service that includes this component in its `linkedServiceIds`.
 */
export function getConsumerServiceIds(
  componentId: string,
  allServices: BaseServiceInfo[],
): string[] {
  const ids = new Set<string>();
  ids.add(componentId);

  for (const s of allServices) {
    if (s.linkedServiceIds && s.linkedServiceIds.includes(componentId)) {
      ids.add(s.id);
    }
  }

  return Array.from(ids);
}

/**
 * Determines which component services must be checked for the target service.
 * If target service is combined (linkedServiceIds is not empty), each of its components must be checked.
 * Otherwise, only targetService itself is checked.
 */
export function getRequiredComponentServices(
  targetService: BaseServiceInfo,
  allServices: BaseServiceInfo[],
): BaseServiceInfo[] {
  if (
    targetService.linkedServiceIds &&
    targetService.linkedServiceIds.length > 0
  ) {
    const linked = allServices.filter((s) =>
      targetService.linkedServiceIds?.includes(s.id),
    );
    return linked.length > 0 ? linked : [targetService];
  }

  return [targetService];
}

/**
 * Evaluates whether a slot [slotStart, slotEnd] is available for booking targetService,
 * taking into account all shared capacity, component dependencies, and blocked times.
 */
export function isSlotAvailable(params: {
  targetService: BaseServiceInfo;
  allServices: BaseServiceInfo[];
  bookings: ServiceBookingItem[];
  pendingPayments: ServiceBookingItem[];
  blockedTimes: ServiceBlockedTimeItem[];
  slotStart: Date;
  slotEnd: Date;
}): boolean {
  const {
    targetService,
    allServices,
    bookings,
    pendingPayments,
    blockedTimes,
    slotStart,
    slotEnd,
  } = params;

  // 1. Direct blocked times on target service
  const directBlocked = blockedTimes.some(
    (b) =>
      b.serviceId === targetService.id &&
      intervalsOverlap(slotStart, slotEnd, b.startsAt, b.endsAt),
  );
  if (directBlocked) {
    return false;
  }

  // 2. Identify all component services that this target service relies on
  const requiredComponents = getRequiredComponentServices(
    targetService,
    allServices,
  );

  // 3. Check capacity and blockages for every required component
  for (const component of requiredComponents) {
    const consumerIds = getConsumerServiceIds(component.id, allServices);
    const consumerSet = new Set(consumerIds);

    // Check if any component is blocked
    const componentBlocked = blockedTimes.some(
      (b) =>
        consumerSet.has(b.serviceId) &&
        intervalsOverlap(slotStart, slotEnd, b.startsAt, b.endsAt),
    );
    if (componentBlocked) {
      return false;
    }

    // Count overlapping bookings across all consumer services
    const overlappingBookingsCount = bookings.filter(
      (b) =>
        consumerSet.has(b.serviceId) &&
        intervalsOverlap(slotStart, slotEnd, b.startsAt, b.endsAt),
    ).length;

    // Count overlapping pending payments
    const overlappingPendingCount = pendingPayments.filter(
      (p) =>
        consumerSet.has(p.serviceId) &&
        intervalsOverlap(slotStart, slotEnd, p.startsAt, p.endsAt),
    ).length;

    // If total consumed capacity meets or exceeds component capacity, this slot is closed
    if (
      overlappingBookingsCount + overlappingPendingCount >=
      component.capacity
    ) {
      return false;
    }
  }

  return true;
}
