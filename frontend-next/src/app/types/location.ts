// Location-related type definitions

import { RideUser } from "./ride";

export type LocationType = "PICKUP" | "DROPOFF" | "WAYPOINT" | "FAVORITE";

export interface LocationData {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: LocationType;
  userId?: string;
  isActive: boolean;
  metadata?: {
    placeId?: string;
    category?: string;
    description?: string;
    instructions?: string;
    popularity?: number;
  };
  createdAt: string;
  updatedAt: string;

  // Relations
  user?: RideUser;
}
