/**
 * Represents an incident reported in the system
 */
export interface Incident {
  [x: string]: any;
  _id: string;
  description: string;
  address: string;
  time: string;
  date: string;
  evidenceUrls?: string[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: string;
  status?: 'pending' | 'verified' | 'resolved';
  tags?: string[];
}

export interface IncidentFilters {
  neighborhoodId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  time?: string;
  timeFrom?: string;
  timeTo?: string;
  status?: 'pending' | 'verified' | 'resolved';
  tags?: string[];
}

export interface StatisticsResults {
  day?: {
    dates: string[];
    counts: number[];
    rollingAverage: number[];
  };
  week?: {
    weeks: string[];
    counts: number[];
    rollingAverage: number[];
  };
  weekdayDistribution?: {
    weekdays: string[];
    counts: number[];
  };
  hourDistribution?: {
    hours: number[];
    counts: number[];
  };
  tag?: {
    tags: string[];
    counts: number[];
  };
  heatMapDensity?: {
    density: number;
    totalIncidents: number;
    area: number;
  };
}

/**
 * Represents a user in the system
 */
export interface User {
  _id: string;
  email: string;
  name?: string;
  surname?: string;
  blockNumber?: number;
  lotNumber?: number;
  neighborhood?: string;
  chatId?: string;
  onboarded: boolean;
  profileImage?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Represents a neighborhood chat
 */
export interface Chat {
  _id: string;
  neighborhood: string;
  participants: string[]; // Array of user IDs
  createdAt: Date;
  updatedAt?: Date;
}

export interface LastChatMessage {
  userId: string;
  userName: string;
  message: string;
  profileImage: string;
}

/**
 * Represents a chat with populated participants
 */
export interface ChatWithParticipants {
  _id: string;
  neighborhood: string;
  participants: User[];
  lastMessageAt?: Date;
  lastMessage?: LastChatMessage;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Represents a chat message
 */
export interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date | string;
  type: 'normal' | 'panic';
  isOwn?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Represents chat data for the optimized service
 */
export interface ChatData {
  id: string;
  neighborhood: string;
  participants: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Represents a panic alert
 */
export interface PanicAlert {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  neighborhood: string;
  chatId?: string;
  blockNumber?: number;
  lotNumber?: number;
  timestamp: Date;
  location: string;
  status: 'active' | 'resolved';
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}
