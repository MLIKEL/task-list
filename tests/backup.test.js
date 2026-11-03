import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, makeBackupName, parseBackup } from '../dist/js/backup.js';

test('备份往返后保留任务和备忘录', () => {
  const state = { schemaVersion: 2, tasks: [{ id: 1, title: '学习', done: false, subs: [{ id: 2, text: '复习', done: false }] }], memo: '先完成最小一步。' };
  const { content } = createBackup(state, new Date('2026-10-24T08:09:10+08:00'));

  assert.deepEqual(parseBackup(content), state);
  assert.equal(makeBackupName(new Date('2026-10-24T08:09:10+08:00')), '任务清单备份-20261024-080910.json');
});
