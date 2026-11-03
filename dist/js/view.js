const escapeHtml = (text) => text.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function resizeTextareas() {
  document.querySelectorAll('.task-title,.sub-title').forEach((element) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  });
}

function layoutCards() {
  const cards = document.querySelectorAll('.task');
  if (!matchMedia('(min-width:1120px)').matches) {
    cards.forEach((card) => { card.style.gridRowEnd = ''; });
    return;
  }
  cards.forEach((card) => { card.style.gridRowEnd = `span ${Math.ceil((card.getBoundingClientRect().height + 12) / 20)}`; });
}

function taskHtml(task, composer) {
  const total = task.subs.length;
  const checked = task.subs.filter((sub) => sub.done).length;
  const percent = total ? checked / total * 100 : task.done ? 100 : 0;
  const composerHtml = '<div class="sub-composer"><input class="sub-composer-input" maxlength="200" placeholder="输入子事项后按 Enter 保存" autofocus><button class="composer-cancel" title="取消">取消</button></div>';
  const subs = task.subs.map((sub) => `<div class="subtask ${sub.done ? 'completed' : ''}" data-sub="${sub.id}"><input class="sub-check" type="checkbox" ${sub.done ? 'checked' : ''}><span class="drag-handle" data-drag="sub" title="按住并拖动排序">⠿</span><textarea class="sub-title" rows="1" maxlength="200" aria-label="子事项">${escapeHtml(sub.text)}</textarea><button class="insert-sub" title="在下方添加子事项">+</button><button class="sub-remove" title="删除子事项">×</button></div>${composer?.taskId === task.id && composer.afterId === sub.id ? composerHtml : ''}`).join('');
  return `<article class="task ${task.done ? 'done' : ''}" data-id="${task.id}"><div class="task-top"><input class="check task-check" type="checkbox" ${task.done ? 'checked' : ''} aria-label="完成任务"><span class="drag-handle" data-drag="task" title="按住并拖动排序">⠿</span><textarea class="task-title" rows="1" maxlength="200" aria-label="任务名称">${escapeHtml(task.title)}</textarea><button class="delete" title="删除任务" aria-label="删除任务">×</button></div><div class="progress-row"><span>${checked}/${total} 个子事项</span><progress class="bar" max="100" value="${percent}" aria-label="子事项完成进度"></progress></div><div class="subtasks">${subs}${composer?.taskId === task.id && composer.afterId === null ? composerHtml : ''}</div><button class="add-sub">+ 添加子事项</button></article>`;
}

export function render(state, filter, composer) {
  const tasks = state.tasks;
  const open = tasks.filter((task) => !task.done).length;
  const done = tasks.filter((task) => task.done).length;
  const subs = tasks.flatMap((task) => task.subs);
  const labels = { all: ['我的任务', '今天要推进什么？'], active: ['进行中', '一次只专注一件事。'], done: ['已完成', '做得好，继续保持。'] };
  document.querySelector('#all-count').textContent = tasks.length;
  document.querySelector('#active-count').textContent = open;
  document.querySelector('#done-count').textContent = done;
  document.querySelector('#view-title').textContent = labels[filter][0];
  document.querySelector('#view-desc').textContent = labels[filter][1];
  document.querySelector('#summary').innerHTML = `<div class="metric"><b>${tasks.length}</b><span>全部任务</span></div><div class="metric"><b>${open}</b><span>等待完成</span></div><div class="metric"><b>${subs.filter((sub) => sub.done).length}/${subs.length}</b><span>子事项已完成</span></div>`;
  const visible = tasks.filter((task) => filter === 'all' || (filter === 'done' ? task.done : !task.done));
  document.querySelector('#tasks').innerHTML = visible.length ? visible.map((task) => taskHtml(task, composer)).join('') : '<div class="empty">这里还没有任务。新建一个开始吧。</div>';
  resizeTextareas();
  requestAnimationFrame(() => { layoutCards(); document.querySelector('.sub-composer-input')?.focus(); });
}

export function showRecovery(message) {
  const element = document.querySelector('#recovery');
  element.hidden = false;
  element.textContent = `${message} 当前数据没有被覆盖。`;
}

export function scheduleLayout() { requestAnimationFrame(layoutCards); }
