import { Injectable } from '@angular/core';
import { DisplaySettings } from '../models/queue.models';

const STORAGE_KEY = 'pcu-queue-tv-settings-v1';

export const DEFAULT_SETTINGS: DisplaySettings = {
  serverBaseUrl: 'http://192.168.1.100/display',
  apiPath: 'api/queue-tv.php',
  hospitalName: 'ระบบแสดงคิวผู้รับบริการ',
  hospitalSubtitle: 'โรงพยาบาลส่งเสริมสุขภาพตำบล',
  pollIntervalMs: 3000,
  statsIntervalMs: 10000,
  voiceEnabled: true,
  announcePatientName: false,
  ttsRate: 0.92,
  departments: [
    { code: '010', name: 'จุดคัดกรอง' },
    { code: '018', name: 'ห้องตรวจโรค 1' },
    { code: '030', name: 'ห้องจ่ายยาผู้ป่วยนอก' },
    { code: '', name: 'ห้องเจาะเลือด' }
  ],
  notices: [
    'กรุณาสวมหน้ากากอนามัยขณะรับบริการ',
    'โปรดเตรียมบัตรประชาชนก่อนเข้ารับบริการ',
    'กรุณารอฟังเสียงเรียกคิวจากระบบ'
  ],
  marquee: 'ยินดีต้อนรับเข้าสู่ระบบบริการอัตโนมัติ กรุณารอฟังเสียงเรียกคิวและติดตามหน้าจอแสดงผล • Welcome to Queue Management System'
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  load(): DisplaySettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SETTINGS);
      const saved = JSON.parse(raw) as Partial<DisplaySettings>;
      return {
        ...structuredClone(DEFAULT_SETTINGS),
        ...saved,
        departments: saved.departments?.length ? saved.departments : structuredClone(DEFAULT_SETTINGS.departments),
        notices: saved.notices?.length ? saved.notices : structuredClone(DEFAULT_SETTINGS.notices)
      };
    } catch {
      return structuredClone(DEFAULT_SETTINGS);
    }
  }

  save(settings: DisplaySettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  reset(): DisplaySettings {
    localStorage.removeItem(STORAGE_KEY);
    return structuredClone(DEFAULT_SETTINGS);
  }
}
