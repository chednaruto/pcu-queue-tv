import { Injectable } from '@angular/core';
import { DepartmentConfig, DisplaySettings } from '../models/queue.models';

const STORAGE_KEY = 'pcu-queue-tv-settings-v2';

const DEFAULT_DEPARTMENTS: DepartmentConfig[] = [
  { code: '010', name: 'จุดคัดกรอง', icon: 'shield-outline' },
  { code: '018', name: 'ห้องตรวจโรค 1', icon: 'medkit-outline' },
  { code: '019', name: 'ห้องตรวจโรค 2', icon: 'clipboard-outline' },
  { code: '030', name: 'ห้องจ่ายยาผู้ป่วยนอก', icon: 'medical-outline' },
  { code: '040', name: 'ห้องเจาะเลือด', icon: 'flask-outline' },
  { code: '050', name: 'ห้องทันตกรรม', icon: 'sparkles-outline' }
];

export const DEFAULT_SETTINGS: DisplaySettings = {
  serverBaseUrl: 'http://192.168.1.100/display',
  apiPath: 'api/queue-tv.php',
  hospitalName: 'ระบบแสดงคิวผู้รับบริการ',
  hospitalSubtitle: 'โรงพยาบาลส่งเสริมสุขภาพตำบล',
  displayDepartmentCount: 3,
  pollIntervalMs: 3000,
  statsIntervalMs: 10000,
  voiceEnabled: true,
  announcePatientName: false,
  ttsRate: 0.92,
  departments: DEFAULT_DEPARTMENTS,
  notices: [
    'กรุณาสวมหน้ากากอนามัยขณะรับบริการ',
    'โปรดเตรียมบัตรประชาชนก่อนเข้ารับบริการ',
    'กรุณารอฟังเสียงเรียกคิวจากระบบ'
  ],
  marquee: 'ยินดีต้อนรับเข้าสู่ระบบบริการอัตโนมัติ กรุณารอฟังเสียงเรียกคิวและติดตามหน้าจอแสดงผล'
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  load(): DisplaySettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SETTINGS);
      const saved = JSON.parse(raw) as Partial<DisplaySettings>;
      const departments = this.normalizeDepartments(saved.departments);
      return {
        ...structuredClone(DEFAULT_SETTINGS),
        ...saved,
        displayDepartmentCount: this.normalizeCount(saved.displayDepartmentCount),
        departments,
        notices: saved.notices?.length ? saved.notices : structuredClone(DEFAULT_SETTINGS.notices)
      };
    } catch {
      return structuredClone(DEFAULT_SETTINGS);
    }
  }

  save(settings: DisplaySettings): void {
    const normalized: DisplaySettings = {
      ...settings,
      displayDepartmentCount: this.normalizeCount(settings.displayDepartmentCount),
      departments: this.normalizeDepartments(settings.departments)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  reset(): DisplaySettings {
    localStorage.removeItem(STORAGE_KEY);
    return structuredClone(DEFAULT_SETTINGS);
  }

  private normalizeCount(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return DEFAULT_SETTINGS.displayDepartmentCount;
    return Math.min(6, Math.max(1, Math.round(n)));
  }

  private normalizeDepartments(value: unknown): DepartmentConfig[] {
    const list = Array.isArray(value) ? value as Partial<DepartmentConfig>[] : [];
    const merged = DEFAULT_DEPARTMENTS.map((dep, index) => ({
      ...dep,
      ...(list[index] || {})
    }));
    return merged.slice(0, 6);
  }
}
