import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { CallingResponse, DisplaySettings, StatsResponse } from '../models/queue.models';

@Injectable({ providedIn: 'root' })
export class QueueApiService {
  async getCalling(settings: DisplaySettings): Promise<CallingResponse> {
    const depcodes = settings.departments.map(d => d.code.trim()).filter(Boolean).join(',');
    if (!depcodes) return { success: true, queues: [] };
    return this.post<CallingResponse>(settings, {
      action: 'calling',
      depcode: depcodes,
      limit: '5'
    });
  }

  async getStats(settings: DisplaySettings): Promise<StatsResponse> {
    const depcodes = settings.departments.map(d => d.code.trim()).filter(Boolean).join(',');
    return this.post<StatsResponse>(settings, {
      action: 'stats',
      depcode: depcodes
    });
  }

  async health(settings: DisplaySettings): Promise<Record<string, unknown>> {
    return this.post<Record<string, unknown>>(settings, { action: 'health' });
  }

  private async post<T>(settings: DisplaySettings, params: Record<string, string>): Promise<T> {
    const url = this.buildUrl(settings.serverBaseUrl, settings.apiPath);
    const body = new URLSearchParams(params).toString();

    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.request({
        method: 'POST',
        url,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        data: body,
        connectTimeout: 5000,
        readTimeout: 8000
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP ${response.status}`);
      }
      return this.parse<T>(response.data);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return this.parse<T>(await response.text());
  }

  private parse<T>(data: unknown): T {
    if (typeof data === 'string') {
      const text = data.replace(/^\uFEFF/, '').trim();
      return JSON.parse(text) as T;
    }
    return data as T;
  }

  private buildUrl(base: string, path: string): string {
    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }
}
