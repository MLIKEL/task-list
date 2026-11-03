import { DATA_SCHEMA_VERSION } from './storage.js';
import { normalizeTasks } from './tasks.js';

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const byteLength = (text) => new TextEncoder().encode(text).length;

export function makeBackupName(date = new Date()) {
  const pad = (number) => String(number).padStart(2, '0');
  return `任务清单备份-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.json`;
}

export function createBackup(state, date = new Date()) {
  const memo = state.memo ?? '';
  if (typeof memo !== 'string' || memo.length > 3000) throw new Error('备忘录内容不正确。');
  const backup = { format: 'task-list-backup', version: 1, dataSchemaVersion: DATA_SCHEMA_VERSION, exportedAt: date.toISOString(), tasks: normalizeTasks(state.tasks), memo };
  const content = JSON.stringify(backup, null, 2);
  if (byteLength(content) > MAX_BACKUP_BYTES) throw new Error('备份文件超过 5 MiB，无法导出。');
  return { backup, content };
}

export function parseBackup(content) {
  if (typeof content !== 'string' || byteLength(content) > MAX_BACKUP_BYTES) throw new Error('备份文件超过 5 MiB，无法导入。');
  let raw;
  try { raw = JSON.parse(content); } catch { throw new Error('备份文件不是有效的 JSON。'); }
  if (!raw || raw.format !== 'task-list-backup' || raw.version !== 1 || !Array.isArray(raw.tasks)) throw new Error('这不是任务清单的备份文件。');
  if (raw.memo !== undefined && (typeof raw.memo !== 'string' || raw.memo.length > 3000)) throw new Error('备份中的备忘录内容不正确。');
  return { schemaVersion: DATA_SCHEMA_VERSION, tasks: normalizeTasks(raw.tasks), memo: raw.memo ?? '' };
}
