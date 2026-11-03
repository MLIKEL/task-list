import { normalizeTasks } from './tasks.js';

export const STATE_KEY = 'task-list-state-v2';
export const LEGACY_TASKS_KEY = 'task-list-v1';
export const LEGACY_MEMO_KEY = 'task-list-memo-v1';
export const DATA_SCHEMA_VERSION = 2;

function stateFrom(raw) {
  if (!raw || raw.schemaVersion !== DATA_SCHEMA_VERSION) throw new Error('数据版本不受支持。');
  if (typeof raw.memo !== 'string' || raw.memo.length > 3000) throw new Error('备忘录数据格式不正确。');
  return { schemaVersion: DATA_SCHEMA_VERSION, tasks: normalizeTasks(raw.tasks), memo: raw.memo };
}

export function saveState(storage, state) {
  try {
    const normalized = stateFrom(state);
    storage.setItem(STATE_KEY, JSON.stringify(normalized));
    return { ok: true, state: normalized };
  } catch (error) {
    return { ok: false, error };
  }
}

export function loadState(storage, defaults) {
  let saved;
  try { saved = storage.getItem(STATE_KEY); }
  catch (error) { return { ok: false, recovery: true, message: '无法读取本地数据。', error }; }
  if (saved !== null) {
    try { return { ok: true, source: 'current', state: stateFrom(JSON.parse(saved)) }; }
    catch (error) { return { ok: false, recovery: true, message: '检测到无法识别的本地数据，原始数据没有被改动。请导入备份恢复。', raw: saved, error }; }
  }
  try {
    const legacyTasks = storage.getItem(LEGACY_TASKS_KEY);
    const legacyMemo = storage.getItem(LEGACY_MEMO_KEY);
    if (legacyTasks !== null || legacyMemo !== null) {
      if (legacyMemo !== null && (typeof legacyMemo !== 'string' || legacyMemo.length > 3000)) throw new Error('旧版备忘录数据格式不正确。');
      const state = { schemaVersion: DATA_SCHEMA_VERSION, tasks: legacyTasks === null ? [] : normalizeTasks(JSON.parse(legacyTasks)), memo: legacyMemo ?? '' };
      const savedResult = saveState(storage, state);
      return savedResult.ok ? { ok: true, source: 'legacy', state: savedResult.state } : { ok: true, source: 'legacy-unsaved', state, warning: '已读取旧数据，但暂时无法保存升级后的副本。' };
    }
    return { ok: true, source: 'defaults', state: { schemaVersion: DATA_SCHEMA_VERSION, tasks: normalizeTasks(defaults), memo: '' } };
  } catch (error) {
    return { ok: false, recovery: true, message: '旧版本数据无法读取，原始数据没有被改动。请导入备份恢复。', error };
  }
}
