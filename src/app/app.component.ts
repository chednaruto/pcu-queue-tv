import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DepartmentConfig, DisplaySettings, QueueItem, QueueStats } from './models/queue.models';
import { QueueApiService } from './services/queue-api.service';
import { SettingsService } from './services/settings.service';
import { TtsService } from './services/tts.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  settings: DisplaySettings;
  draftSettings: DisplaySettings;
  now = new Date();
  settingsOpen = false;
  connectionState: 'online' | 'offline' | 'checking' = 'checking';
  connectionMessage = 'กำลังเชื่อมต่อ';
  currentQueues: Record<string, QueueItem> = {};
  recentCalls: QueueItem[] = [];
  activeDepCode = '';
  stats: QueueStats = { totalvisit: 0, waiting: 0 };
  testMessage = '';

  private clockTimer?: number;
  private pollTimer?: number;
  private statsTimer?: number;
  private clearActiveTimer?: number;
  private pollBusy = false;
  private seenKeys: string[] = [];

  constructor(
    private readonly api: QueueApiService,
    private readonly settingsService: SettingsService,
    private readonly tts: TtsService
  ) {
    this.settings = this.settingsService.load();
    this.draftSettings = structuredClone(this.settings);
  }

  ngOnInit(): void {
    this.clockTimer = window.setInterval(() => this.now = new Date(), 1000);
    this.restartPolling();
  }

  ngOnDestroy(): void {
    this.stopTimers();
    void this.tts.stop();
  }

  get thaiTime(): string {
    return this.now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  get thaiDate(): string {
    return this.now.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get stateLabel(): string {
    return this.connectionState === 'online'
      ? 'เชื่อมต่อแล้ว'
      : this.connectionState === 'offline'
        ? 'ขาดการเชื่อมต่อ'
        : 'กำลังเชื่อมต่อ';
  }

  get visibleDepartments(): DepartmentConfig[] {
    return this.settings.departments.slice(0, this.settings.displayDepartmentCount);
  }

  get layoutClass(): string {
    return `layout-${this.visibleDepartments.length}`;
  }

  get draftDepartments(): DepartmentConfig[] {
    return this.draftSettings.departments.slice(0, 6);
  }

  queueFor(code: string): string {
    if (!code) return '-';
    return this.formatQueueValue(this.currentQueues[code]?.oqueue);
  }

  formatQueueValue(value: string | number | undefined | null): string {
    if (value === undefined || value === null || value === '') return '-';
    const raw = String(value).trim();
    return /^\d+$/.test(raw) ? raw.padStart(3, '0') : raw;
  }

  isActive(code: string): boolean {
    return !!code && this.activeDepCode === code;
  }

  callTimeFor(item: QueueItem): string {
    const raw = item.sd_queue_calling_datetime;
    if (!raw) return this.thaiTime;
    const date = new Date(raw.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return this.thaiTime;
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  departmentNameFor(item: QueueItem): string {
    const depCode = String(item.sd_queue_calling_curdep || '').trim();
    const configured = this.settings.departments.find(d => d.code === depCode)?.name;
    return item.department || configured || depCode || 'จุดบริการ';
  }

  openSettings(): void {
    this.draftSettings = structuredClone(this.settings);
    this.testMessage = '';
    this.settingsOpen = true;
  }

  closeSettings(): void {
    this.settingsOpen = false;
  }

  saveSettings(): void {
    this.draftSettings.pollIntervalMs = this.clampNumber(Number(this.draftSettings.pollIntervalMs), 1000, 30000);
    this.draftSettings.statsIntervalMs = this.clampNumber(Number(this.draftSettings.statsIntervalMs), 3000, 60000);
    this.draftSettings.ttsRate = this.clampNumber(Number(this.draftSettings.ttsRate), 0.5, 1.5);
    this.draftSettings.displayDepartmentCount = this.clampInt(Number(this.draftSettings.displayDepartmentCount), 1, 6);
    this.draftSettings.departments = this.draftSettings.departments.slice(0, 6);
    this.settings = structuredClone(this.draftSettings);
    this.settingsService.save(this.settings);
    this.settingsOpen = false;
    this.currentQueues = {};
    this.activeDepCode = '';
    this.recentCalls = [];
    this.restartPolling();
  }

  resetSettings(): void {
    this.draftSettings = this.settingsService.reset();
    this.testMessage = 'คืนค่าเริ่มต้นแล้ว กด “บันทึกและใช้งาน” เพื่อใช้งาน';
  }

  async testConnection(): Promise<void> {
    this.testMessage = 'กำลังทดสอบ...';
    try {
      const result = await this.api.health(this.draftSettings);
      this.testMessage = result['success'] === false ? 'เชื่อมต่อได้ แต่ API แจ้งข้อผิดพลาด' : 'เชื่อมต่อ Server/API สำเร็จ';
    } catch (error) {
      this.testMessage = `เชื่อมต่อไม่สำเร็จ: ${this.errorText(error)}`;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if ((key === 's' || key === 'f2') && !this.settingsOpen) {
      event.preventDefault();
      this.openSettings();
    } else if ((key === 'escape' || key === 'backspace') && this.settingsOpen) {
      event.preventDefault();
      this.closeSettings();
    }
  }

  private restartPolling(): void {
    this.stopPollingTimers();
    void this.pollCalling();
    void this.pollStats();
    this.pollTimer = window.setInterval(() => void this.pollCalling(), this.settings.pollIntervalMs);
    this.statsTimer = window.setInterval(() => void this.pollStats(), this.settings.statsIntervalMs);
  }

  private stopTimers(): void {
    if (this.clockTimer) window.clearInterval(this.clockTimer);
    this.stopPollingTimers();
  }

  private stopPollingTimers(): void {
    if (this.pollTimer) window.clearInterval(this.pollTimer);
    if (this.statsTimer) window.clearInterval(this.statsTimer);
    if (this.clearActiveTimer) window.clearTimeout(this.clearActiveTimer);
  }

  private async pollCalling(): Promise<void> {
    if (this.pollBusy) return;
    this.pollBusy = true;
    try {
      const result = await this.api.getCalling(this.settings);
      if (!result.success) throw new Error(result.message || 'API returned success=false');
      this.setOnline();
      for (const item of result.queues || []) {
        await this.handleCall(item);
      }
    } catch (error) {
      this.connectionState = 'offline';
      this.connectionMessage = this.errorText(error);
    } finally {
      this.pollBusy = false;
    }
  }

  private async pollStats(): Promise<void> {
    try {
      const result = await this.api.getStats(this.settings);
      if (result.success && result.stats) {
        this.stats = {
          totalvisit: Number(result.stats.totalvisit || 0),
          waiting: Number(result.stats.waiting || 0)
        };
      }
    } catch {
      // non-fatal
    }
  }

  private async handleCall(item: QueueItem): Promise<void> {
    const depCode = String(item.sd_queue_calling_curdep || '').trim();
    if (!depCode) return;

    this.currentQueues[depCode] = item;
    this.currentQueues = { ...this.currentQueues };
    this.activeDepCode = depCode;
    this.recentCalls = [item, ...this.recentCalls.filter(x => this.callKey(x) !== this.callKey(item))].slice(0, 6);

    if (this.clearActiveTimer) window.clearTimeout(this.clearActiveTimer);
    this.clearActiveTimer = window.setTimeout(() => this.activeDepCode = '', 12000);

    const key = this.callKey(item);
    if (this.seenKeys.includes(key)) return;
    this.seenKeys.push(key);
    if (this.seenKeys.length > 100) this.seenKeys.splice(0, this.seenKeys.length - 100);

    if (this.settings.voiceEnabled) {
      const queue = this.queueFor(depCode);
      const department = this.departmentNameFor(item);
      const patient = this.settings.announcePatientName && item.full_namecall ? ` ${item.full_namecall}` : '';
      await this.tts.speak(`ขอเชิญหมายเลข ${queue}${patient} เข้ารับบริการที่ ${department} ค่ะ`, this.settings.ttsRate);
    }
  }

  private callKey(item: QueueItem): string {
    return [item.vn || '', item.sd_queue_calling_curdep || '', item.oqueue || '', item.sd_queue_calling_datetime || ''].join('|');
  }

  private setOnline(): void {
    this.connectionState = 'online';
    this.connectionMessage = 'รับข้อมูลจาก Server ปกติ';
  }

  private errorText(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private clampNumber(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  private clampInt(value: number, min: number, max: number): number {
    return Math.round(this.clampNumber(value, min, max));
  }
}
