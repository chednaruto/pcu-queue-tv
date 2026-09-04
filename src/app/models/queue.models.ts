export interface DepartmentConfig {
  code: string;
  name: string;
  icon?: string;
}

export interface DisplaySettings {
  serverBaseUrl: string;
  apiPath: string;
  hospitalName: string;
  hospitalSubtitle: string;
  displayDepartmentCount: number;
  pollIntervalMs: number;
  statsIntervalMs: number;
  voiceEnabled: boolean;
  announcePatientName: boolean;
  ttsRate: number;
  departments: DepartmentConfig[];
  notices: string[];
  marquee: string;
}

export interface QueueItem {
  oqueue: string | number;
  sd_queue_calling_curdep: string;
  sd_queue_calling_slot?: string | number;
  sd_queue_calling_datetime?: string;
  vn?: string;
  hn?: string;
  full_name?: string;
  full_namecall?: string;
  department?: string;
  pt_priority?: string | number;
}

export interface CallingResponse {
  success: boolean;
  queues: QueueItem[];
  serverTime?: string;
  message?: string;
}

export interface QueueStats {
  totalvisit: number;
  waiting: number;
}

export interface StatsResponse {
  success: boolean;
  stats?: QueueStats;
  message?: string;
}
