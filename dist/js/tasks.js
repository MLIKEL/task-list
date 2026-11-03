export const MAX_TITLE_LENGTH = 200;

let lastMillisecond = 0;
let sequence = 0;

export function nextNumericId(usedIds = new Set()) {
  const timestamp = Date.now();
  if (timestamp === lastMillisecond) sequence += 1;
  else { lastMillisecond = timestamp; sequence = 0; }
  let id = timestamp * 1000 + sequence;
  while (usedIds.has(id)) id += 1;
  return id;
}

export function normalizeText(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 && text.length <= MAX_TITLE_LENGTH ? text : null;
}

function normalizeId(value, usedIds) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || usedIds.has(id)) return nextNumericId(usedIds);
  return id;
}

export function normalizeTasks(rawTasks) {
  if (!Array.isArray(rawTasks)) throw new Error('任务数据格式不正确。');
  const usedIds = new Set();
  return rawTasks.map((rawTask, taskIndex) => {
    const title = normalizeText(rawTask?.title);
    if (!title) throw new Error(`第 ${taskIndex + 1} 个任务标题应为 1 到 200 个字符。`);
    const id = normalizeId(rawTask.id, usedIds); usedIds.add(id);
    if (rawTask.subs !== undefined && !Array.isArray(rawTask.subs)) throw new Error(`第 ${taskIndex + 1} 个任务的子事项格式不正确。`);
    const subs = (rawTask.subs ?? []).map((rawSub, subIndex) => {
      const text = normalizeText(rawSub?.text);
      if (!text) throw new Error(`第 ${taskIndex + 1} 个任务的第 ${subIndex + 1} 个子事项应为 1 到 200 个字符。`);
      const subId = normalizeId(rawSub.id, usedIds); usedIds.add(subId);
      return { id: subId, text, done: Boolean(rawSub.done) };
    });
    return { id, title, done: subs.length > 0 ? subs.every((sub) => sub.done) : Boolean(rawTask.done), subs };
  });
}

export function addTask(tasks, title) {
  const normalized = normalizeText(title);
  if (!normalized) throw new Error('任务标题应为 1 到 200 个字符。');
  const usedIds = new Set(tasks.flatMap((task) => [task.id, ...task.subs.map((sub) => sub.id)]));
  return [{ id: nextNumericId(usedIds), title: normalized, done: false, subs: [] }, ...tasks];
}

export function updateTaskTitle(task, title) {
  const normalized = normalizeText(title);
  if (!normalized) throw new Error('任务标题应为 1 到 200 个字符。');
  return { ...task, title: normalized };
}

export function updateSubtaskText(task, subtaskId, text) {
  const normalized = normalizeText(text);
  if (!normalized) throw new Error('子事项内容应为 1 到 200 个字符。');
  return { ...task, subs: task.subs.map((sub) => sub.id === subtaskId ? { ...sub, text: normalized } : sub) };
}

export function addSubtask(task, text, nextId = () => nextNumericId(new Set([task.id, ...task.subs.map((sub) => sub.id)])), afterId = null) {
  const normalized = normalizeText(text);
  if (!normalized) throw new Error('子事项内容应为 1 到 200 个字符。');
  const subs = [...task.subs];
  const index = afterId === null ? subs.length : subs.findIndex((item) => item.id === afterId) + 1;
  subs.splice(index < 0 ? subs.length : index, 0, { id: nextId(), text: normalized, done: false });
  return { ...task, done: false, subs };
}

export function removeSubtask(task, subtaskId) {
  const subs = task.subs.filter((sub) => sub.id !== subtaskId);
  if (subs.length === task.subs.length) return task;
  return { ...task, done: subs.length === 0 ? task.done : subs.every((sub) => sub.done), subs };
}

export function setTaskDone(task, done) {
  return { ...task, done: Boolean(done), subs: task.subs.map((sub) => ({ ...sub, done: Boolean(done) })) };
}

export function setSubtaskDone(task, subtaskId, done) {
  const subs = task.subs.map((sub) => sub.id === subtaskId ? { ...sub, done: Boolean(done) } : sub);
  return { ...task, done: subs.length > 0 ? subs.every((sub) => sub.done) : task.done, subs };
}

export function replaceTask(tasks, updatedTask) {
  return tasks.map((task) => task.id === updatedTask.id ? updatedTask : task);
}

export function reorderItems(items, sourceId, targetId, before) {
  if (sourceId === targetId) return items;
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return items;
  const reordered = [...items];
  const [source] = reordered.splice(sourceIndex, 1);
  const destination = reordered.findIndex((item) => item.id === targetId) + (before ? 0 : 1);
  reordered.splice(destination, 0, source);
  return reordered;
}
