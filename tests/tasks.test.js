import test from 'node:test';
import assert from 'node:assert/strict';
import { addSubtask, removeSubtask, updateTaskTitle } from '../dist/js/tasks.js';

test('给已完成任务新增未完成子事项后，任务回到未完成', () => {
  const task = { id: 1, title: '学习', done: true, subs: [] };

  const updated = addSubtask(task, '复习一章', () => 2);

  assert.deepEqual(updated, {
    id: 1,
    title: '学习',
    done: false,
    subs: [{ id: 2, text: '复习一章', done: false }]
  });
});

test('删除子事项后按剩余子事项重新计算任务完成状态', () => {
  const task = {
    id: 1,
    title: '学习',
    done: false,
    subs: [
      { id: 2, text: '已完成', done: true },
      { id: 3, text: '未完成', done: false }
    ]
  };

  const updated = removeSubtask(task, 3);

  assert.equal(updated.done, true);
  assert.deepEqual(updated.subs, [{ id: 2, text: '已完成', done: true }]);
});

test('空白标题不能提交到任务数据', () => {
  assert.throws(() => updateTaskTitle({ id: 1, title: '原任务', done: false, subs: [] }, '   '), /标题/);
});
