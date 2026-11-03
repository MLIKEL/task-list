import test from 'node:test';
import assert from 'node:assert/strict';
import { loadState, saveState } from '../dist/js/storage.js';

class FakeStorage {
  constructor(values = {}, shouldFail = false) {
    this.values = new Map(Object.entries(values));
    this.shouldFail = shouldFail;
  }

  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) {
    if (this.shouldFail) throw new Error('磁盘空间不足');
    this.values.set(key, value);
  }
}

test('保存失败时保留旧的合并状态', () => {
  const oldValue = JSON.stringify({ schemaVersion: 2, tasks: [], memo: '旧内容' });
  const storage = new FakeStorage({ 'task-list-state-v2': oldValue }, true);

  const result = saveState(storage, { schemaVersion: 2, tasks: [], memo: '新内容' });

  assert.equal(result.ok, false);
  assert.equal(storage.getItem('task-list-state-v2'), oldValue);
});

test('损坏的当前数据会进入恢复状态，并保留原始内容', () => {
  const storage = new FakeStorage({ 'task-list-state-v2': '{不是 JSON' });
  const result = loadState(storage, []);

  assert.equal(result.ok, false);
  assert.equal(result.recovery, true);
  assert.equal(storage.getItem('task-list-state-v2'), '{不是 JSON');
});
