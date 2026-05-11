// profile.js - depende de shared.js (api, toast, setLoading)

let profileImageData = '';
let profileStats = {};
let statsChart = null;

const chartDefaults = {
    type: localStorage.getItem('profileChartType') || 'doughnut',
    colors: {
        todo: localStorage.getItem('profileColorTodo') || '#f59e0b',
        progress: localStorage.getItem('profileColorProgress') || '#3b82f6',
        done: localStorage.getItem('profileColorDone') || '#22d3a5',
    },
};

document.addEventListener('DOMContentLoaded', () => {
    setupProfileImageInput();
    setupChartControls();
    loadProfile();
});

async function loadProfile() {
    try {
        const data = await api('GET', '/users/me');
        populateProfile(data);
    } catch {
        toast('Erro ao carregar perfil', 'error');
    }
}

function populateProfile(data) {
    const initials = (data.name || '?').charAt(0).toUpperCase();
    profileImageData = data.profileImage || '';
    if (profileImageData) localStorage.setItem('userProfileImage', profileImageData);
    else localStorage.removeItem('userProfileImage');

    setAvatar(document.getElementById('profileAvatarBig'), data.name, profileImageData);
    setAvatar(document.getElementById('profilePhotoPreview'), data.name, profileImageData);
    document.getElementById('profileName').textContent = data.name || '—';
    document.getElementById('profileJobTitle').textContent = data.jobTitle || 'Sem cargo definido';
    document.getElementById('profileBio').textContent = data.bio || 'Sem bio ainda.';

    const since = data.createdAt
        ? new Date(data.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : '—';
    document.getElementById('profileSince').textContent = since;

    document.getElementById('editName').value = data.name || '';
    document.getElementById('editJobTitle').value = data.jobTitle || '';
    document.getElementById('editBio').value = data.bio || '';

    profileStats = data.stats || {};
    document.getElementById('ps-total').textContent = profileStats.total || 0;
    document.getElementById('ps-done').textContent = profileStats.done || 0;
    document.getElementById('ps-rate').textContent = (profileStats.completionRate || 0) + '%';
    renderStatsChart();
}

function setupProfileImageInput() {
    const input = document.getElementById('profileImageInput');
    if (!input) return;

    input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        const err = document.getElementById('profileImageErr');
        err.textContent = '';
        if (!file) return;

        if (file.size > 1024 * 1024) {
            input.value = '';
            err.textContent = 'Imagem muito grande. Use até 1 MB.';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            profileImageData = reader.result;
            setAvatar(document.getElementById('profilePhotoPreview'), document.getElementById('editName').value, profileImageData);
            setAvatar(document.getElementById('profileAvatarBig'), document.getElementById('editName').value, profileImageData);
        };
        reader.readAsDataURL(file);
    });
}

function removeProfileImage() {
    profileImageData = '';
    document.getElementById('profileImageInput').value = '';
    setAvatar(document.getElementById('profilePhotoPreview'), document.getElementById('editName').value, '');
    setAvatar(document.getElementById('profileAvatarBig'), document.getElementById('editName').value, '');
}

function setupChartControls() {
    document.getElementById('chartTypeSelect').value = chartDefaults.type;
    document.getElementById('colorTodo').value = chartDefaults.colors.todo;
    document.getElementById('colorProgress').value = chartDefaults.colors.progress;
    document.getElementById('colorDone').value = chartDefaults.colors.done;

    document.getElementById('chartTypeSelect').addEventListener('change', e => {
        localStorage.setItem('profileChartType', e.target.value);
        renderStatsChart();
    });

    [
        ['colorTodo', 'profileColorTodo'],
        ['colorProgress', 'profileColorProgress'],
        ['colorDone', 'profileColorDone'],
    ].forEach(([id, key]) => {
        document.getElementById(id).addEventListener('input', e => {
            localStorage.setItem(key, e.target.value);
            renderStatsChart();
        });
    });
}

function renderStatsChart() {
    if (!window.Chart) return;

    const type = document.getElementById('chartTypeSelect').value;
    const colors = [
        document.getElementById('colorTodo').value,
        document.getElementById('colorProgress').value,
        document.getElementById('colorDone').value,
    ];
    const values = [
        Number(profileStats.todo || 0),
        Number(profileStats.inProgress || 0),
        Number(profileStats.done || 0),
    ];
    const labels = ['A Fazer', 'Em Progresso', 'Concluídas'];
    const ctx = document.getElementById('profileStatsChart');

    if (statsChart) statsChart.destroy();

    const chartType = type === 'area' ? 'line' : type === 'histogram' ? 'bar' : type;
    const dataset = {
        label: 'Tarefas',
        data: type === 'scatter'
            ? values.map((v, i) => ({ x: i + 1, y: v }))
            : values,
        backgroundColor: type === 'line' || type === 'area' || type === 'scatter'
            ? colors[1] + '33'
            : colors,
        borderColor: type === 'line' || type === 'area' || type === 'scatter'
            ? colors[1]
            : colors,
        borderWidth: 2,
        fill: type === 'area',
        tension: 0.35,
    };

    statsChart = new Chart(ctx, {
        type: chartType,
        data: { labels, datasets: [dataset] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: type === 'doughnut' } },
            scales: chartType === 'doughnut' ? {} : {
                y: { beginAtZero: true, ticks: { precision: 0 } },
            },
        },
    });
}

document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('editName').value.trim();

    document.getElementById('editNameErr').textContent = '';
    if (!name || name.length < 2) {
        document.getElementById('editNameErr').textContent = 'Nome deve ter pelo menos 2 caracteres';
        return;
    }

    setLoading('saveProfileBtn', true);
    try {
        const data = await api('PUT', '/users/me', {
            name,
            jobTitle: document.getElementById('editJobTitle').value.trim() || null,
            bio: document.getElementById('editBio').value.trim() || null,
            profileImage: profileImageData || null,
        });

        localStorage.setItem('userName', data.name);
        if (data.profileImage) localStorage.setItem('userProfileImage', data.profileImage);
        else localStorage.removeItem('userProfileImage');

        document.getElementById('userName').textContent = data.name;
        setAvatar(document.getElementById('userAvatar'), data.name, data.profileImage);

        toast('Perfil atualizado!', 'success');
        await loadProfile();
    } catch (err) {
        const alertEl = document.getElementById('profileAlert');
        alertEl.textContent = err.message;
        alertEl.className = 'alert error';
        alertEl.classList.remove('hidden');
    } finally {
        setLoading('saveProfileBtn', false);
    }
});

document.getElementById('passwordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const currentPwd = document.getElementById('currentPwd').value;
    const newPwd = document.getElementById('newPwd').value;
    const confirmPwd = document.getElementById('confirmPwd').value;

    ['currentPwdErr', 'newPwdErr', 'confirmPwdErr'].forEach(id => {
        document.getElementById(id).textContent = '';
    });

    let valid = true;
    if (!currentPwd) {
        document.getElementById('currentPwdErr').textContent = 'Informe a senha atual';
        valid = false;
    }
    if (!newPwd || newPwd.length < 6) {
        document.getElementById('newPwdErr').textContent = 'Mínimo de 6 caracteres';
        valid = false;
    }
    if (currentPwd && newPwd && currentPwd === newPwd) {
        document.getElementById('newPwdErr').textContent = 'A nova senha deve ser diferente da atual';
        valid = false;
    }
    if (newPwd !== confirmPwd) {
        document.getElementById('confirmPwdErr').textContent = 'As senhas não coincidem';
        valid = false;
    }
    if (!valid) return;

    setLoading('savePwdBtn', true);
    try {
        await api('PATCH', '/users/me/password', {
            currentPassword: currentPwd,
            newPassword: newPwd,
        });
        document.getElementById('passwordForm').reset();
        document.getElementById('passwordAlert').classList.add('hidden');
        toast('Senha alterada com sucesso!', 'success');
    } catch (err) {
        const alertEl = document.getElementById('passwordAlert');
        alertEl.textContent = err.message;
        alertEl.className = 'alert error';
        alertEl.classList.remove('hidden');
    } finally {
        setLoading('savePwdBtn', false);
    }
});
