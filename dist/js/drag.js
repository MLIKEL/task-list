export function attachDrag(container, onMove) {
  let state = null;
  const clear = () => container.querySelectorAll('.drop-before,.drop-after').forEach((item) => item.classList.remove('drop-before', 'drop-after'));
  const finish = (commit) => {
    if (!state) return;
    const previous = state;
    previous.source.classList.remove('dragging');
    state = null; clear();
    if (commit && previous.started && previous.target) onMove(previous.type, previous.taskId, previous.subId, Number(previous.target.dataset[previous.type === 'task' ? 'id' : 'sub']), previous.before);
  };
  container.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.drag-handle');
    if (!handle || event.button !== 0) return;
    const task = handle.closest('.task');
    const sub = handle.closest('.subtask');
    state = { type: sub ? 'sub' : 'task', taskId: Number(task.dataset.id), subId: sub ? Number(sub.dataset.sub) : null, source: sub ?? task, pointerId: event.pointerId, x: event.clientX, y: event.clientY, started: false, target: null, before: false };
    handle.setPointerCapture?.(event.pointerId); event.preventDefault();
  });
  container.addEventListener('pointermove', (event) => {
    if (!state || state.pointerId !== event.pointerId) return;
    if (!state.started) {
      if (Math.hypot(event.clientX - state.x, event.clientY - state.y) < 6) return;
      state.started = true; state.source.classList.add('dragging');
    }
    clear();
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const candidate = state.type === 'task' ? under?.closest('.task') : under?.closest('.subtask');
    if (!candidate || candidate === state.source || (state.type === 'sub' && Number(candidate.closest('.task')?.dataset.id) !== state.taskId)) { state.target = null; return; }
    state.target = candidate;
    const box = candidate.getBoundingClientRect(); state.before = event.clientY < box.top + box.height / 2;
    candidate.classList.add(state.before ? 'drop-before' : 'drop-after'); event.preventDefault();
  });
  container.addEventListener('pointerup', (event) => { if (state?.pointerId === event.pointerId) finish(true); });
  container.addEventListener('pointercancel', (event) => { if (state?.pointerId === event.pointerId) finish(false); });
}
