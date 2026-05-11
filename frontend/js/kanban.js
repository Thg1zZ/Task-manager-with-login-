// kanban.js — depende de shared.js (api, toast, setLoading, escHtml, safeColor)

let allTasks       = [];
let deleteTargetId = null;
let draggedTaskId  = null;
let isSavingTask   = false;

const COLUMNS = [
    { status: 'TODO',        label: 'A Fazer',      icon: '○', colorVar: '--yellow' },
    { status: 'IN_PROGRESS', label: 'Em Progresso', icon: '◑', colorVar: '--accent' },
    { status: 'DONE',        label: 'Concluída',    icon: '●', colorVar: '--green'  },
];

// --- Init -------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    buildBoard();
    await loadTasks();
    await loadCategoriesIntoSelect('taskCategory');
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    setupTaskPrazoModeListeners();
});

// --- Estrutura do board -----------------------------------------

function buildBoard() {
    const board = document.getElementById('kanbanBoard');
    // Valores de status são constantes internas — sem dados do servidor aqui
    board.innerHTML = COLUMNS.map(col => `
        <div class="kanban-col" id="col-${col.status}"
             ondragover="onDragOver(event, '${col.status}')"
             ondrop="onDrop(event, '${col.status}')"
             ondragleave="onDragLeave(event)">
            <div class="kanban-col-header">
                <span class="kanban-col-icon" style="color:var(${col.colorVar})">${col.icon}</span>
                <span class="kanban-col-title">${col.label}</span>
                <span class="kanban-col-count" id="count-${col.status}">0</span>
            </div>
            <div class="kanban-cards" id="cards-${col.status}">
                <span class="spin" style="color:var(--text-3);padding:16px;display:block;text-align:center">⟳</span>
            </div>
            <button class="kanban-add-btn" onclick="openModalWithStatus('${col.status}')">+ Adicionar</button>
        </div>`).join('');
}

// --- Dados ------------------------------------------------------

async function loadTasks() {
    try {
        allTasks = await api('GET', '/tasks') || [];
        renderBoard();
    } catch {
        toast('Erro ao carregar tarefas', 'error');
    }
}

function renderBoard() {
    COLUMNS.forEach(col => {
        const tasks     = allTasks.filter(t => t.status === col.status);
        const container = document.getElementById(`cards-${col.status}`);
        document.getElementById(`count-${col.status}`).textContent = tasks.length;

        if (tasks.length === 0) {
            container.innerHTML = `<div class="kanban-empty">
                <strong>Sem tarefas aqui</strong>
                <span>Arraste uma tarefa ou crie uma nova nesta coluna.</span>
            </div>`;
            return;
        }
        container.innerHTML = tasks.map(renderCard).join('');
    });
}

function renderCard(task) {
    const priorityColors = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22d3a5' };
    const color    = priorityColors[task.priority] || '#3b82f6';
    // safeColor valida cores vindas do servidor — previne CSS injection
    const catColor = safeColor(task.categoryColor);
    const taskId   = Number(task.id);

    const now     = new Date(); now.setHours(0, 0, 0, 0);
    const endDate = taskEndDate(task);
    const overdue = endDate && task.status !== 'DONE' &&
                    new Date(endDate + 'T00:00:00') < now;

    const catHtml = task.categoryName
        ? `<span class="kcard-cat"
                style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}44">
               ${escHtml(task.categoryIcon || '')} ${escHtml(task.categoryName)}
           </span>`
        : '';

    const dueHtml = endDate
        ? `<span class="kcard-meta-item ${overdue ? 'overdue' : ''}">
               📅 ${escHtml(formatTaskRange(task))}
           </span>`
        : '';

    const priorityHtml = `<span class="kcard-meta-item priority-${escHtml(task.priority)}">${escHtml(priorityLabel(task.priority))}</span>`;

    const estHtml = task.estimatedMinutes
        ? `<span class="kcard-meta-item">⏱ ${escHtml(fmtMin(task.estimatedMinutes))}</span>`
        : '';

    const commentHtml = task.commentCount > 0
        ? `<span class="kcard-meta-item">💬 ${task.commentCount}</span>`
        : '';

    return `
    <div class="kanban-card" id="kcard-${taskId}"
         draggable="true"
         ondragstart="onDragStart(event, ${taskId})"
         ondragend="onDragEnd(event)">
        <div class="kcard-priority-bar" style="background:${color}"></div>
        <div class="kcard-body">
            <div class="kcard-header">
                <span class="kcard-title ${task.status === 'DONE' ? 'done' : ''}">${escHtml(task.title)}</span>
                <div class="kcard-actions">
                    <button class="task-action-btn" onclick="openEditModal(${taskId})" title="Editar">✎</button>
                    <button class="task-action-btn delete" onclick="openDeleteModal(${taskId})" title="Excluir">✕</button>
                </div>
            </div>
            ${task.description ? `<p class="kcard-desc">${escHtml(task.description)}</p>` : ''}
            <div class="kcard-footer">
                ${catHtml}
                <div class="kcard-meta">${priorityHtml}${dueHtml}${estHtml}${commentHtml}</div>
            </div>
        </div>
    </div>`;
}

// --- Drag & Drop ------------------------------------------------

function onDragStart(event, taskId) {
    draggedTaskId = taskId;
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => document.getElementById(`kcard-${taskId}`)?.classList.add('dragging'), 0);
}

function onDragEnd() {
    if (draggedTaskId) {
        document.getElementById(`kcard-${draggedTaskId}`)?.classList.remove('dragging');
    }
    document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
    draggedTaskId = null;
}

function onDragOver(event, status) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    document.getElementById(`col-${status}`).classList.add('drag-over');
}

function onDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

async function onDrop(event, newStatus) {
    event.preventDefault();
    document.getElementById(`col-${newStatus}`).classList.remove('drag-over');
    if (!draggedTaskId) return;

    const task = allTasks.find(t => t.id === draggedTaskId);
    if (!task || task.status === newStatus) return;

    const prevStatus = task.status;
    task.status = newStatus;
    renderBoard();

    try {
        await api('PATCH', `/tasks/${draggedTaskId}/status`, { status: newStatus });
        toast('Status atualizado!', 'success', 2000);
    } catch {
        task.status = prevStatus; // reverte otimismo
        renderBoard();
        toast('Erro ao atualizar status', 'error');
    }
}

// --- Modais de criar / editar -----------------------------------

function openModal() {
    resetModal();
    document.getElementById('modalTitle').textContent = 'Nova Tarefa';
    document.getElementById('modalOverlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('taskTitle')?.focus(), 50);
}

function openModalWithStatus(status) {
    resetModal();
    document.getElementById('taskStatus').value       = status;
    document.getElementById('modalTitle').textContent = 'Nova Tarefa';
    document.getElementById('modalOverlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('taskTitle')?.focus(), 50);
}

async function openEditModal(id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    resetModal();
    document.getElementById('taskId').value       = task.id;
    document.getElementById('taskTitle').value    = task.title;
    document.getElementById('taskDesc').value     = task.description || '';
    document.getElementById('taskStatus').value   = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskStartDate').value = task.startDate || '';
    document.getElementById('taskEndDate').value   = taskEndDate(task) || '';
    document.getElementById('taskEstimate').value = task.estimatedMinutes || '';
    setTaskPrazoMode(inferPrazoModeFromTask(task));
    await loadCategoriesIntoSelect('taskCategory');
    if (task.categoryId) document.getElementById('taskCategory').value = task.categoryId;
    document.getElementById('modalTitle').textContent = 'Editar Tarefa';
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function resetModal() {
    ['taskId', 'taskTitle', 'taskDesc', 'taskStartDate', 'taskEndDate', 'taskEstimate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('taskStatus').value   = 'TODO';
    document.getElementById('taskPriority').value = 'MEDIUM';
    document.getElementById('taskTitleError').textContent = '';
    document.getElementById('modalAlert').classList.add('hidden');
    loadCategoriesIntoSelect('taskCategory');
    setTaskPrazoMode('none');
}

function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }
function closeModalOutside(e) { if (e.target === document.getElementById('modalOverlay')) closeModal(); }

async function handleTaskSubmit(e) {
    e.preventDefault();
    if (isSavingTask) return;
    const id    = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    document.getElementById('taskTitleError').textContent = '';

    if (!title) {
        document.getElementById('taskTitleError').textContent = 'Título é obrigatório';
        return;
    }

    const catVal = document.getElementById('taskCategory').value;
    const estVal = parseInt(document.getElementById('taskEstimate').value, 10);
    const dates = validateAndGetTaskDates();
    if (!dates.ok) {
        const alertEl = document.getElementById('modalAlert');
        alertEl.textContent = dates.message;
        alertEl.className = 'alert error';
        alertEl.classList.remove('hidden');
        return;
    }
    const { startDate, endDate } = dates;

    const body = {
        title,
        description:      document.getElementById('taskDesc').value.trim() || null,
        status:           document.getElementById('taskStatus').value,
        priority:         document.getElementById('taskPriority').value,
        startDate,
        endDate,
        dueDate:          endDate,
        categoryId:       catVal ? Number(catVal) : null,
        estimatedMinutes: Number.isFinite(estVal) && estVal > 0 ? estVal : null,
    };

    isSavingTask = true;
    setLoading('saveTaskBtn', true);
    try {
        if (id) {
            await api('PUT', `/tasks/${id}`, body);
            toast('Tarefa atualizada!', 'success');
        } else {
            await api('POST', '/tasks', body);
            toast('Tarefa criada!', 'success');
        }
        closeModal();
        await loadTasks();
    } catch (err) {
        const alertEl = document.getElementById('modalAlert');
        alertEl.textContent = err.message;
        alertEl.className = 'alert error';
        alertEl.classList.remove('hidden');
        await loadTasks();
    } finally {
        isSavingTask = false;
        setLoading('saveTaskBtn', false);
    }
}

// --- Modal excluir ----------------------------------------------

function openDeleteModal(id) {
    deleteTargetId = id;
    const task = allTasks.find(t => t.id === id);
    document.getElementById('deleteTaskName').textContent = task ? `"${task.title}"` : '';
    document.getElementById('deleteOverlay').classList.remove('hidden');
}

function closeDeleteModal() {
    deleteTargetId = null;
    document.getElementById('deleteOverlay').classList.add('hidden');
}

function closeDeleteOutside(e) {
    if (e.target === document.getElementById('deleteOverlay')) closeDeleteModal();
}

async function confirmDelete() {
    if (!deleteTargetId) return;
    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true; // corrigido: era setLoading(btn, false) — bug
    try {
        await api('DELETE', `/tasks/${deleteTargetId}`);
        toast('Tarefa excluída', 'info');
        closeDeleteModal();
        await loadTasks();
    } catch {
        toast('Erro ao excluir', 'error');
        btn.disabled = false;
    }
}

// --- Helpers ---------------------------------------------------

function formatDate(d) {
    if (!d) return '';
    const [, m, dd] = d.split('-');
    const y = d.split('-')[0];
    return `${dd}/${m}/${y}`;
}

function taskEndDate(task) {
    return task.endDate || task.dueDate || '';
}

function formatTaskRange(task) {
    const start = task.startDate;
    const end = taskEndDate(task);
    if (start && end) return `${formatDate(start)} até ${formatDate(end)}`;
    if (end) return formatDate(end);
    if (start) return `A partir de ${formatDate(start)}`;
    return '';
}

function priorityLabel(priority) {
    return { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' }[priority] || priority || 'Prioridade';
}

function fmtMin(m) {
    if (!m) return '';
    if (m < 60) return `${m}min`;
    const h   = Math.floor(m / 60);
    const min = m % 60;
    return min ? `${h}h${min}m` : `${h}h`;
}
