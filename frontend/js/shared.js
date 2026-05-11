const API_URL = 'https://task-manager-with-login.onrender.com/api';
const token    = localStorage.getItem('token');
const userName = localStorage.getItem('userName') || 'Usuário';
const userEmail = localStorage.getItem('userEmail') || '';
const userProfileImage = localStorage.getItem('userProfileImage') || '';

if (!token) window.location.href = 'index.html';

// Aplica o tema salvo antes de qualquer render para evitar flash
(function () {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
})();

const NAV_ITEMS = [
    { href: 'dashboard.html',  icon: '◫', label: 'Dashboard'  },
    { href: 'kanban.html',     icon: '⊞', label: 'Kanban'     },
    { href: 'categories.html', icon: '◈', label: 'Categorias' },
    { href: 'profile.html',    icon: '◉', label: 'Perfil'     },
];

function buildSidebar() {
    const nav     = document.getElementById('sidebarNav');
    const current = window.location.pathname.split('/').pop();
    if (!nav) return;

    nav.innerHTML = NAV_ITEMS.map(item => {
        const active = current === item.href ? ' active' : '';
        return `<a href="${item.href}" class="nav-item${active}">
                    <span class="nav-icon">${item.icon}</span>
                    <span>${item.label}</span>
                </a>`;
    }).join('');

    const themeBtn = document.createElement('button');
    themeBtn.className = 'nav-item';
    themeBtn.id = 'themeToggleBtn';
    themeBtn.addEventListener('click', toggleTheme);
    nav.appendChild(themeBtn);
    updateThemeBtn();

    const av = document.getElementById('userAvatar');
    if (av) setAvatar(av, userName, userProfileImage);
    const un = document.getElementById('userName');
    if (un) un.textContent = userName;
    const ue = document.getElementById('userEmail');
    if (ue) ue.textContent = userEmail;
}

document.addEventListener('DOMContentLoaded', buildSidebar);

// --- API helper -------------------------------------------------

async function apiRaw(method, path, body = null) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${path}`, opts);

    if (res.status === 401) {
        logout();
        return;
    }
    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
}

async function api(method, path, body = null) {
    const slowTimer = setTimeout(() => {
        toast('Servidor acordando no Render. Pode demorar alguns segundos...', 'info', 7000);
    }, 8000);

    try {
        return await apiRaw(method, path, body);
    } catch (err) {
        if (err instanceof TypeError) {
            throw new Error('NÃ£o foi possÃ­vel conectar agora. Verifique a internet ou aguarde o Render acordar.');
        }
        throw err;
    } finally {
        clearTimeout(slowTimer);
    }
}

// --- Toasts -----------------------------------------------------
// SEGURANÇA: message inserida via textContent — nunca innerHTML

function toast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

    const t = document.createElement('div');
    t.className = `toast toast-${type}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = icons[type] || '●';

    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast-msg';
    msgSpan.textContent = message; // textContent — XSS-safe

    t.appendChild(iconSpan);
    t.appendChild(msgSpan);
    container.appendChild(t);

    requestAnimationFrame(() => t.classList.add('toast-visible'));

    setTimeout(() => {
        t.classList.remove('toast-visible');
        t.addEventListener('transitionend', () => t.remove(), { once: true });
    }, duration);
}

// --- Tema -------------------------------------------------------

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeBtn();
}

function toggleTheme() {
    const current = localStorage.getItem('theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

function updateThemeBtn() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const isDark = (localStorage.getItem('theme') || 'dark') === 'dark';
    btn.innerHTML = '';
    const icon = document.createElement('span');
    icon.className = 'nav-icon';
    icon.textContent = isDark ? '☀' : '◑';
    const label = document.createElement('span');
    label.textContent = isDark ? 'Tema Claro' : 'Tema Escuro';
    btn.appendChild(icon);
    btn.appendChild(label);
}

// --- Sidebar mobile ---------------------------------------------

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// --- Logout -----------------------------------------------------

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function setAvatar(el, name, image) {
    el.textContent = '';
    el.style.backgroundImage = '';
    el.classList.remove('has-photo');

    if (image) {
        el.classList.add('has-photo');
        el.style.backgroundImage = `url("${image}")`;
        return;
    }

    el.textContent = (name || '?').charAt(0).toUpperCase();
}

// --- Botão de loading -------------------------------------------

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    const t = btn.querySelector('.btn-text');
    const l = btn.querySelector('.btn-loader');
    if (t) t.classList.toggle('hidden', loading);
    if (l) l.classList.toggle('hidden', !loading);
}

// --- Select de categorias (modal de tarefa) --------------------
// SEGURANÇA: name e icon inseridos via textContent

async function loadCategoriesIntoSelect(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    try {
        const cats = await api('GET', '/categories');
        sel.innerHTML = '';

        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = 'Nenhuma';
        sel.appendChild(blank);

        (cats || []).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = (c.icon ? c.icon + ' ' : '') + c.name; // textContent — XSS-safe
            sel.appendChild(opt);
        });
    } catch (_) { /* categorias são opcionais — falha silenciosa */ }
}

// --- Sanitização ------------------------------------------------

/**
 * Escapa HTML para uso seguro dentro de atributos ou conteúdo.
 * Inclui aspas simples (&#39;) para uso seguro em onclick='...'
 */
function escHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Valida se uma string é uma cor hex CSS válida (#rgb ou #rrggbb).
 * Evita CSS injection ao inserir cores vindas do servidor em style="".
 */
function safeColor(color, fallback = '#3b82f6') {
    return /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(color) ? color : fallback;
}
