import { createBackup, makeBackupName, parseBackup } from './backup.js';
import { attachDrag } from './drag.js';
import { loadState, saveState } from './storage.js';
import { addSubtask, addTask, nextNumericId, removeSubtask, reorderItems, replaceTask, setSubtaskDone, setTaskDone, updateSubtaskText, updateTaskTitle } from './tasks.js';
import { render, scheduleLayout, showRecovery } from './view.js';

const defaults = [
  { id: 1, title: '准备产品发布', done: false, subs: [{ id: 11, text: '整理发布清单', done: true }, { id: 12, text: '确认页面文案', done: false }, { id: 13, text: '安排上线时间', done: false }] },
  { id: 2, title: '本周学习计划', done: false, subs: [{ id: 21, text: '完成两节课程', done: false }, { id: 22, text: '整理学习笔记', done: false }] },
  { id: 3, title: '回复合作消息', done: true, subs: [{ id: 31, text: '确认会议时间', done: true }] }
];
const $ = (selector) => document.querySelector(selector);
let filter = 'all';
let composer = null;
let sidebarOpen = false;
try { sidebarOpen = localStorage.getItem('task-list-sidebar-open') === 'true'; } catch { /* preference is optional */ }
let memoOpen = false;
const loaded = loadState(localStorage, defaults);
let state = loaded.ok ? loaded.state : { schemaVersion: 2, tasks: defaults, memo: '' };
let recoveryMode = !loaded.ok;

function setMessage(message, error = false) {
  const element = $('#backup-status'); element.textContent = message; element.classList.toggle('error', error);
}
function commit(candidate, message = '', allowRecovery = false) {
  if (recoveryMode && !allowRecovery) { setMessage('恢复模式下不会覆盖原始数据，请先导入你的备份。', true); return false; }
  const result = saveState(localStorage, candidate);
  if (!result.ok) { setMessage('未能保存：原来的数据没有被覆盖。请先导出备份或检查磁盘空间。', true); return false; }
  state = result.state; render(state, filter, composer); if (message) setMessage(message); return true;
}
function updateTask(id, updater) {
  const task = state.tasks.find((item) => item.id === id); if (!task) return;
  commit({ ...state, tasks: replaceTask(state.tasks, updater(task)) });
}
function setSidebar(open) {
  sidebarOpen = open; $('.app').classList.toggle('sidebar-open', open);
  $('#sidebar-toggle').setAttribute('aria-expanded', String(open));
  try { localStorage.setItem('task-list-sidebar-open', String(open)); } catch { /* preference failure does not affect tasks */ }
}
function setMemo(open) {
  memoOpen = open; $('.app').classList.toggle('memo-open', open); $('#open-memo').setAttribute('aria-expanded', String(open));
  if (open) setTimeout(() => $('#memo-text').focus(), 180);
}
function restoreInvalidTitle(element) { render(state, filter, composer); setMessage('标题不能为空，且最多 200 个字符。', true); element?.focus(); }

$('#nav').addEventListener('click', (event) => {
  const button = event.target.closest('button'); if (!button) return;
  filter = button.dataset.filter; document.querySelectorAll('.nav button').forEach((item) => item.classList.toggle('active', item === button)); setSidebar(false); render(state, filter, composer);
});
$('#tasks').addEventListener('click', (event) => {
  const card = event.target.closest('.task'); if (!card) return;
  const taskId = Number(card.dataset.id); const task = state.tasks.find((item) => item.id === taskId); if (!task) return;
  if (event.target.classList.contains('delete')) { if (confirm(`删除“${task.title}”？`)) commit({ ...state, tasks: state.tasks.filter((item) => item.id !== taskId) }); return; }
  if (event.target.classList.contains('add-sub')) { composer = { taskId, afterId: null }; render(state, filter, composer); return; }
  if (event.target.classList.contains('insert-sub')) { composer = { taskId, afterId: Number(event.target.closest('.subtask').dataset.sub) }; render(state, filter, composer); return; }
  if (event.target.classList.contains('composer-cancel')) { composer = null; render(state, filter, composer); return; }
  if (event.target.classList.contains('sub-remove')) { updateTask(taskId, (current) => removeSubtask(current, Number(event.target.closest('.subtask').dataset.sub))); }
});
$('#tasks').addEventListener('keydown', (event) => {
  if (event.target.matches('.sub-composer-input')) {
    if (event.key === 'Escape') { composer = null; render(state, filter, composer); }
    if (event.key === 'Enter') { const text = event.target.value; const current = state.tasks.find((item) => item.id === composer?.taskId); if (current) { try { const usedIds = new Set(state.tasks.flatMap((task) => [task.id, ...task.subs.map((sub) => sub.id)])); const next = addSubtask(current, text, () => nextNumericId(usedIds), composer.afterId); composer = null; updateTask(current.id, () => next); } catch { setMessage('子事项不能为空，且最多 200 个字符。', true); } } }
    return;
  }
  if (event.key === 'Enter' && !event.shiftKey && event.target.matches('.task-title,.sub-title')) { event.preventDefault(); event.target.blur(); }
});
$('#tasks').addEventListener('blur', (event) => {
  const card = event.target.closest('.task'); if (!card) return; const taskId = Number(card.dataset.id);
  try {
    if (event.target.matches('.task-title')) updateTask(taskId, (task) => updateTaskTitle(task, event.target.value));
    if (event.target.matches('.sub-title')) updateTask(taskId, (task) => updateSubtaskText(task, Number(event.target.closest('.subtask').dataset.sub), event.target.value));
  } catch { restoreInvalidTitle(event.target); }
}, true);
$('#tasks').addEventListener('input', (event) => { if (event.target.matches('.task-title,.sub-title')) { event.target.style.height = 'auto'; event.target.style.height = `${event.target.scrollHeight}px`; scheduleLayout(); } });
$('#tasks').addEventListener('change', (event) => {
  const card = event.target.closest('.task'); if (!card) return; const taskId = Number(card.dataset.id);
  if (event.target.classList.contains('task-check')) updateTask(taskId, (task) => setTaskDone(task, event.target.checked));
  if (event.target.classList.contains('sub-check')) updateTask(taskId, (task) => setSubtaskDone(task, Number(event.target.closest('.subtask').dataset.sub), event.target.checked));
});
attachDrag($('#tasks'), (type, taskId, subId, targetId, before) => {
  if (type === 'task') commit({ ...state, tasks: reorderItems(state.tasks, taskId, targetId, before) });
  else updateTask(taskId, (task) => ({ ...task, subs: reorderItems(task.subs, subId, targetId, before) }));
});

const dialog = $('#task-dialog'); const backupDialog = $('#backup-dialog');
$('#open-dialog').onclick = () => { dialog.showModal(); $('#new-task-title').focus(); };
$('#cancel-dialog').onclick = () => dialog.close();
$('#task-form').addEventListener('submit', (event) => { event.preventDefault(); try { if (commit({ ...state, tasks: addTask(state.tasks, $('#new-task-title').value) })) { $('#new-task-title').value = ''; dialog.close(); } } catch { $('#new-task-title').setCustomValidity('任务标题不能为空，且最多 200 个字符。'); $('#new-task-title').reportValidity(); } });
$('#new-task-title').addEventListener('input', () => $('#new-task-title').setCustomValidity(''));
$('#open-backup').onclick = () => { setMessage(''); backupDialog.showModal(); };
$('#close-backup').onclick = () => backupDialog.close();
$('#export-backup').onclick = async () => {
  const invoke = window.__TAURI__?.core?.invoke; if (!invoke) { setMessage('当前版本不支持选择保存位置，请安装桌面版。', true); return; }
  try { const { content } = createBackup(state); setMessage('正在选择保存位置…'); const path = await invoke('save_backup', { content, defaultName: makeBackupName() }); setMessage(path ? `备份已保存到：${path}` : '已取消保存。'); } catch (error) { setMessage(String(error?.message ?? error ?? '无法保存备份。'), true); }
};
$('#choose-backup').onclick = () => $('#import-backup').click();
$('#import-backup').addEventListener('change', (event) => {
  const file = event.target.files[0]; event.target.value = ''; if (!file) return;
  const reader = new FileReader(); reader.onload = () => { try { const candidate = parseBackup(reader.result); if (!confirm(`将恢复 ${candidate.tasks.length} 个任务，并替换当前任务。确定继续吗？`)) return; composer = null; if (commit(candidate, `已恢复 ${candidate.tasks.length} 个任务和备忘录。`, true)) { recoveryMode = false; $('#memo-text').value = candidate.memo; } } catch (error) { setMessage(error.message ?? '无法读取这个备份文件。', true); } }; reader.onerror = () => setMessage('读取文件失败，请再试一次。', true); reader.readAsText(file, 'utf-8');
});
const memo = $('#memo-text'); memo.value = state.memo;
$('#open-memo').onclick = () => setMemo(true); $('#close-memo').onclick = () => setMemo(false); $('#memo-backdrop').onclick = () => setMemo(false);
memo.addEventListener('input', () => { if (commit({ ...state, memo: memo.value })) $('#memo-status').textContent = '已自动保存'; else $('#memo-status').textContent = '未保存'; });
$('#clear-memo').onclick = () => { if (!memo.value || confirm('清空备忘录内容？')) { memo.value = ''; if (commit({ ...state, memo: '' })) $('#memo-status').textContent = '内容已清空'; } };
$('#sidebar-toggle').onclick = () => setSidebar(!sidebarOpen); $('#drawer-backdrop').onclick = () => setSidebar(false);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && sidebarOpen) setSidebar(false); if (event.key === 'Escape' && memoOpen) setMemo(false); });
$('#today').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
setSidebar(sidebarOpen); render(state, filter, composer); if (!loaded.ok) showRecovery(loaded.message); if (loaded.warning) setMessage(loaded.warning, true);
window.addEventListener('resize', scheduleLayout);
