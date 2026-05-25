function showPacienteEditForm() {
  if (pacienteEditCard) {
    pacienteEditCard.classList.remove('hidden');
    pacienteEditCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function hidePacienteEditForm() {
  if (pacienteEditCard) {
    pacienteEditCard.classList.add('hidden');
  }
  if (pacienteEditForm) {
    pacienteEditForm.reset();
  }
}

function fillPacienteEditForm(data) {
  document.getElementById('pac-edit-id').value = data.id_paciente;
  document.getElementById('pac-edit-nombre').value = data.nombre || '';
  document.getElementById('pac-edit-apellido-paterno').value = data.apellido_paterno || '';
  document.getElementById('pac-edit-curp').value = data.curp || '';
  document.getElementById('pac-edit-telefono').value = data.telefono || '';
  document.getElementById('pac-edit-correo').value = data.correo_electronico || '';
  document.getElementById('pac-edit-tipo').value = TIPO_SANGRE_FROM_ID[data.id_tipo_sangre] || '';
}

function showMedicoEditForm() {
  if (medicoEditCard) {
    medicoEditCard.classList.remove('hidden');
    medicoEditCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function hideMedicoEditForm() {
  if (medicoEditCard) {
    medicoEditCard.classList.add('hidden');
  }
  if (medicoEditForm) {
    medicoEditForm.reset();
  }
}

function fillMedicoEditForm(data) {
  document.getElementById('med-edit-id').value = data.id_medico;
  document.getElementById('med-edit-nombre').value = data.nombre || '';
  document.getElementById('med-edit-apellido-paterno').value = data.apellido_paterno || '';
  document.getElementById('med-edit-cedula').value = data.cedula_profesional || '';
  document.getElementById('med-edit-especialidad').value = data.id_especialidad || '';
  document.getElementById('med-edit-telefono').value = data.telefono || '';
  document.getElementById('med-edit-correo').value = data.correo_electronico || '';
}

function showUsuarioEditForm() {
  if (usuarioEditCard) {
    usuarioEditCard.classList.remove('hidden');
    usuarioEditCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function hideUsuarioEditForm() {
  if (usuarioEditCard) {
    usuarioEditCard.classList.add('hidden');
  }
  if (usuarioEditForm) {
    usuarioEditForm.reset();
  }
}

function fillUsuarioEditForm(data) {
  document.getElementById('usr-edit-id').value = data.id_usuario;
  document.getElementById('usr-edit-username').value = data.username || '';
  document.getElementById('usr-edit-medico').value = data.id_medico || '';
  document.getElementById('usr-edit-rol').value = data.id_rol || '';
  const isSelf = state.payload && Number(state.payload.sub) === Number(data.id_usuario);

  if (!isSelf) {
    document.getElementById('usr-edit-activo').value = data.activo === false ? 'false' : 'true';
    document.getElementById('usr-edit-bloqueado').value = data.bloqueado === true ? 'true' : 'false';
  } else {
    document.getElementById('usr-edit-activo').value = '';
    document.getElementById('usr-edit-bloqueado').value = '';
  }

  const activoSelect = document.getElementById('usr-edit-activo');
  const bloqueadoSelect = document.getElementById('usr-edit-bloqueado');
  if (activoSelect) {
    activoSelect.disabled = isSelf;
  }
  if (bloqueadoSelect) {
    bloqueadoSelect.disabled = isSelf;
  }

  toggleUsuarioMedicoField(data.id_rol, true);
}

function toggleUsuarioMedicoField(roleId, isEdit) {
  const role = rolesCache.find((row) => row.id_rol === Number(roleId));
  const shouldShow = role && role.nombre === 'MEDICO';

  if (isEdit) {
    if (usuarioMedicoEditField) {
      usuarioMedicoEditField.classList.toggle('hidden', !shouldShow);
    }
    if (!shouldShow) {
      document.getElementById('usr-edit-medico').value = '';
    }
  } else {
    if (usuarioMedicoField) {
      usuarioMedicoField.classList.toggle('hidden', !shouldShow);
    }
    if (!shouldShow) {
      document.getElementById('usr-medico').value = '';
    }
  }
}

function setView(key, title) {
  Object.values(views).forEach((view) => view.classList.add('hidden'));
  if (views[key]) {
    views[key].classList.remove('hidden');
  }
  viewTitle.textContent = title || 'Dashboard';

  if (key === 'consultas') {
    loadEstadosConsulta();
    if (consultaPacienteInput && (consultaPacienteInput.value || '').trim().length >= 1) {
      searchConsultaPacientes(consultaPacienteInput.value);
    }
    if (consultaMedicoInput && (consultaMedicoInput.value || '').trim().length >= 1) {
      searchConsultaMedicos(consultaMedicoInput.value);
    }
  }

  if (key === 'pacientes') {
    handlePacienteBuscar();
  }

  if (key === 'medicos') {
    loadEspecialidadesCatalog();
    handleMedicoBuscar();
  }

  if (key === 'usuarios') {
    loadRoles();
    loadMedicosCatalog();
    handleUsuarioBuscar();
  }

  if (key === 'agendaMedico') {
    loadAgendaMedico();
  }

  if (key === 'hospitalizaciones') {
    loadHospitalizaciones();
  }

  if (key === 'facturacion') {
    loadFacturacionCatalogs();
  }

  if (key === 'dashboard') {
    drawDashboardChart();
  }

  Array.from(menu.querySelectorAll('button')).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === key);
  });
}

function buildMenu(role) {
  const items = [
    { key: 'dashboard', label: 'Dashboard', roles: ['ADMIN', 'MEDICO', 'USUARIO_GENERAL'] },
    { key: 'usuarios', label: 'Usuarios', roles: ['ADMIN'] },
    { key: 'auditoria', label: 'Auditoria', roles: ['ADMIN'] },
    { key: 'reportes', label: 'Reportes', roles: ['ADMIN'] },
    { key: 'pacientes', label: 'Pacientes', roles: ['ADMIN', 'USUARIO_GENERAL'] },
    { key: 'medicos', label: 'Medicos', roles: ['ADMIN'] },
    { key: 'consultas', label: 'Agenda', roles: ['ADMIN', 'USUARIO_GENERAL'] },
    { key: 'agendaMedico', label: 'Mi agenda', roles: ['MEDICO'] },
    { key: 'expediente', label: 'Expediente clinico', roles: ['MEDICO'] },
    { key: 'hospitalizaciones', label: 'Hospitalizaciones', roles: ['MEDICO'] },
    { key: 'facturacion', label: 'Facturacion', roles: ['ADMIN', 'USUARIO_GENERAL'] }
  ];

  menu.innerHTML = '';
  items
    .filter((item) => item.roles.includes(role))
    .forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.view = item.key;
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        if (!requireAuth()) return;
        setView(item.key, item.label);
        if (item.key === 'reportes') {
          loadReportes();
        }
        if (item.key === 'auditoria') {
          loadAuditoria();
        }
        if (item.key === 'consultas') {
          loadEstadosConsulta();
        }
      });
      menu.appendChild(btn);
    });
}

async function apiRequest(path, options = {}) {
  if (!requireAuth()) {
    throw new Error('No autenticado');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearAuth();
    showLogin();
  }

  let payload = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload && payload.message ? payload.message : 'Error en la solicitud';
    throw new Error(message);
  }

  return payload || {};
}

async function handleLogin(event) {
  event.preventDefault();
  loginError.textContent = '';

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!username || !password) {
    loginError.textContent = 'Completa usuario y contrasena.';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    let data = null;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      data = null;
    }
    if (!response.ok) {
      const message = data && data.message ? data.message : 'Error de autenticacion';
      throw new Error(message);
    }

    if (!data || !data.token) {
      throw new Error('Respuesta invalida del servidor');
    }

    setAuth(data.token);
    if (!state.payload) {
      throw new Error('Token invalido');
    }

    userRole.textContent = state.payload.role || '';
    userInfo.textContent = state.payload.username || '';
    buildMenu(state.payload.role);
    showApp();
    setView('dashboard', 'Dashboard');
    loadEstadosConsulta();
    if (state.payload.role === 'ADMIN' || state.payload.role === 'USUARIO_GENERAL') {
      loadMedicosCatalog();
    }
    if (state.payload.role === 'ADMIN') {
      loadEspecialidadesCatalog();
    }
    if (state.payload.role === 'ADMIN') {
      loadRoles();
    }
    if (state.payload.role === 'MEDICO') {
      loadMedicamentosCatalog();
      loadLaboratoriosCatalog();
    }
  } catch (err) {
    loginError.textContent = err.message;
  }
}

function formatPatientName(row) {
  return [row.nombre, row.apellido_paterno, row.apellido_materno]
    .filter(Boolean)
    .join(' ');
}

function formatTime(value) {
  if (!value) return 'Sin horario';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  });
}

function dashboardAction(label, viewKey, title) {
  return `<button type="button" class="ghost dashboard-action" data-view="${viewKey}" data-title="${title}">${label}</button>`;
}

function bindDashboardActions() {
  document.querySelectorAll('#dashboard-content [data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const viewKey = button.dataset.view;
      const title = button.dataset.title || button.textContent;
      setView(viewKey, title);
      if (viewKey === 'agendaMedico') {
        loadAgendaMedico();
      }
      if (viewKey === 'hospitalizaciones') {
        loadHospitalizaciones();
      }
    });
  });
}

function renderGenericDashboard() {
  const target = document.getElementById('dashboard-content');
  if (!target) return;

  target.innerHTML = `
    <div class="dashboard-grid">
      <div class="card dashboard-hero">
        <div>
          <p class="section-kicker">SIGEH</p>
          <h3>Panel operativo</h3>
          <p class="muted">Selecciona un modulo del menu para iniciar el flujo de trabajo.</p>
        </div>
      </div>
      <div class="card">
        <h3>Actividad general</h3>
        <canvas id="dashboard-chart" height="120"></canvas>
      </div>
    </div>
  `;

  const ctx = document.getElementById('dashboard-chart');
  if (!ctx) return;

  if (state.chart) {
    state.chart.destroy();
  }

  state.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Consultas',
        data: [12, 19, 14, 8, 20, 16],
        backgroundColor: '#b94a2c'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

async function renderMedicoDashboard() {
  const target = document.getElementById('dashboard-content');
  if (!target) return;

  target.innerHTML = `
    <div class="dashboard-loading card">
      <h3>Cargando panel medico</h3>
      <p class="muted">Consultando agenda, pendientes y hospitalizaciones.</p>
    </div>
  `;

  try {
    const data = await apiRequest('/medico/resumen');
    const perfil = data.perfil || {};
    const resumen = data.resumen_agenda || {};
    const agenda = Array.isArray(data.agenda_hoy) ? data.agenda_hoy : [];
    const proxima = data.proxima_consulta;
    const nombreMedico = [perfil.nombre, perfil.apellido_paterno].filter(Boolean).join(' ') || state.payload.username;
    const agendaRows = agenda.length > 0
      ? agenda.map((row) => `
          <tr>
            <td>${formatTime(row.fecha_hora)}</td>
            <td>${formatPatientName(row)}</td>
            <td><span class="badge badge-neutral">${row.estado || 'Sin estado'}</span></td>
            <td>${row.motivo || ''}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" class="muted">No hay consultas programadas para hoy.</td></tr>';

    target.innerHTML = `
      <div class="doctor-dashboard">
        <div class="card dashboard-hero">
          <div>
            <p class="section-kicker">Turno medico</p>
            <h3>${nombreMedico}</h3>
            <p class="muted">${perfil.especialidad || 'Medicina general'} · Cedula ${perfil.cedula_profesional || 'N/D'}</p>
          </div>
          <div class="dashboard-actions">
            ${dashboardAction('Abrir agenda', 'agendaMedico', 'Mi agenda')}
            ${dashboardAction('Buscar expediente', 'expediente', 'Expediente clinico')}
            ${dashboardAction('Hospitalizaciones', 'hospitalizaciones', 'Hospitalizaciones')}
          </div>
        </div>

        <div class="metric-grid">
          <div class="metric-card">
            <span>Consultas hoy</span>
            <strong>${resumen.total || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Programadas</span>
            <strong>${resumen.programadas || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Atendidas</span>
            <strong>${resumen.atendidas || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Hospitalizados</span>
            <strong>${data.hospitalizaciones_activas || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Estudios pendientes</span>
            <strong>${data.estudios_pendientes || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Recetas emitidas hoy</span>
            <strong>${data.recetas_hoy || 0}</strong>
          </div>
        </div>

        <div class="dashboard-grid dashboard-grid-main">
          <div class="card">
            <div class="section-header">
              <h3>Agenda de hoy</h3>
              ${dashboardAction('Ver agenda', 'agendaMedico', 'Mi agenda')}
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Paciente</th>
                    <th>Estado</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>${agendaRows}</tbody>
              </table>
            </div>
          </div>

          <div class="card next-card">
            <h3>Proxima atencion</h3>
            ${proxima ? `
              <div class="next-time">${formatTime(proxima.fecha_hora)}</div>
              <strong>${formatPatientName(proxima)}</strong>
              <p class="muted">${proxima.motivo || 'Sin motivo registrado'}</p>
              ${dashboardAction('Atender desde agenda', 'agendaMedico', 'Mi agenda')}
            ` : `
              <p class="muted">No hay consultas futuras pendientes para este medico.</p>
              ${dashboardAction('Actualizar agenda', 'agendaMedico', 'Mi agenda')}
            `}
          </div>
        </div>
      </div>
    `;

    bindDashboardActions();
  } catch (err) {
    target.innerHTML = `
      <div class="card">
        <h3>No se pudo cargar el panel medico</h3>
        <p class="muted">${err.message}</p>
        ${dashboardAction('Abrir agenda', 'agendaMedico', 'Mi agenda')}
      </div>
    `;
    bindDashboardActions();
  }
}

async function renderUsuarioGeneralDashboard() {
  const target = document.getElementById('dashboard-content');
  if (!target) return;

  target.innerHTML = `
    <div class="dashboard-loading card">
      <h3>Cargando operacion diaria</h3>
      <p class="muted">Consultando pacientes, citas y facturacion.</p>
    </div>
  `;

  try {
    const data = await apiRequest('/operacion/resumen');
    const pacientes = data.pacientes || {};
    const consultas = data.consultas_hoy || {};
    const facturacionHoy = data.facturacion_hoy || {};
    const pendientes = data.facturas_pendientes || {};
    const proximas = Array.isArray(data.proximas_consultas) ? data.proximas_consultas : [];
    const rows = proximas.length > 0
      ? proximas.map((row) => `
          <tr>
            <td>${formatTime(row.fecha_hora)}</td>
            <td>${[row.paciente_nombre, row.paciente_apellido].filter(Boolean).join(' ')}</td>
            <td>${[row.medico_nombre, row.medico_apellido].filter(Boolean).join(' ')}</td>
            <td><span class="badge badge-neutral">${row.estado || 'Programada'}</span></td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" class="muted">No hay citas proximas registradas.</td></tr>';

    target.innerHTML = `
      <div class="doctor-dashboard">
        <div class="card dashboard-hero">
          <div>
            <p class="section-kicker">Recepcion y caja</p>
            <h3>Operacion diaria</h3>
            <p class="muted">Gestiona altas de pacientes, programacion de citas y cobros del dia.</p>
          </div>
          <div class="dashboard-actions">
            ${dashboardAction('Registrar paciente', 'pacientes', 'Pacientes')}
            ${dashboardAction('Programar cita', 'consultas', 'Agenda')}
            ${dashboardAction('Registrar pago', 'facturacion', 'Facturacion')}
          </div>
        </div>

        <div class="metric-grid">
          <div class="metric-card">
            <span>Pacientes activos</span>
            <strong>${pacientes.total || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Altas de hoy</span>
            <strong>${pacientes.nuevos_hoy || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Citas de hoy</span>
            <strong>${consultas.total || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Programadas</span>
            <strong>${consultas.programadas || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Cobrado hoy</span>
            <strong class="metric-money">${formatCurrency(facturacionHoy.total)}</strong>
          </div>
          <div class="metric-card">
            <span>Facturas pendientes</span>
            <strong>${pendientes.total || 0}</strong>
          </div>
        </div>

        <div class="dashboard-grid dashboard-grid-main">
          <div class="card">
            <div class="section-header">
              <h3>Proximas citas</h3>
              ${dashboardAction('Abrir agenda', 'consultas', 'Agenda')}
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Paciente</th>
                    <th>Medico</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>

          <div class="card next-card">
            <h3>Prioridades</h3>
            <div>
              <strong>${pendientes.total || 0} factura(s) pendientes</strong>
              <p class="muted">${formatCurrency(pendientes.monto)} por cobrar.</p>
            </div>
            <div>
              <strong>${consultas.en_atencion || 0} consulta(s) en atencion</strong>
              <p class="muted">Mantener coordinada la recepcion con el area medica.</p>
            </div>
            ${dashboardAction('Ir a facturacion', 'facturacion', 'Facturacion')}
          </div>
        </div>
      </div>
    `;

    bindDashboardActions();
  } catch (err) {
    target.innerHTML = `
      <div class="card">
        <h3>No se pudo cargar el panel operativo</h3>
        <p class="muted">${err.message}</p>
        ${dashboardAction('Registrar paciente', 'pacientes', 'Pacientes')}
      </div>
    `;
    bindDashboardActions();
  }
}

async function renderAdminDashboard() {
  const target = document.getElementById('dashboard-content');
  if (!target) return;

  target.innerHTML = `
    <div class="dashboard-loading card">
      <h3>Cargando panel administrativo</h3>
      <p class="muted">Consultando usuarios, auditoria, respaldos y actividad global.</p>
    </div>
  `;

  try {
    const data = await apiRequest('/admin/resumen');
    const usuarios = data.usuarios || {};
    const pacientes = data.pacientes || {};
    const medicos = data.medicos || {};
    const consultas = data.consultas_hoy || {};
    const pendientes = data.facturas_pendientes || {};
    const accesos = data.accesos_24h || {};
    const cambios = data.cambios_hoy || {};
    const respaldo = data.ultimo_respaldo;
    const respaldoEstado = respaldo ? respaldo.estado : 'Sin registro';
    const respaldoFecha = respaldo && respaldo.fecha_inicio
      ? new Date(respaldo.fecha_inicio).toLocaleString()
      : 'N/D';

    target.innerHTML = `
      <div class="doctor-dashboard">
        <div class="card dashboard-hero">
          <div>
            <p class="section-kicker">Administracion SIGEH</p>
            <h3>Control general del sistema</h3>
            <p class="muted">Supervisa usuarios, actividad operativa, respaldos y trazabilidad.</p>
          </div>
          <div class="dashboard-actions">
            ${dashboardAction('Usuarios', 'usuarios', 'Usuarios')}
            ${dashboardAction('Auditoria', 'auditoria', 'Auditoria')}
            ${dashboardAction('Reportes', 'reportes', 'Reportes')}
          </div>
        </div>

        <div class="metric-grid">
          <div class="metric-card">
            <span>Usuarios activos</span>
            <strong>${usuarios.activos || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Usuarios bloqueados</span>
            <strong>${usuarios.bloqueados || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Pacientes</span>
            <strong>${pacientes.total || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Medicos activos</span>
            <strong>${medicos.activos || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Consultas hoy</span>
            <strong>${consultas.total || 0}</strong>
          </div>
          <div class="metric-card">
            <span>Facturas pendientes</span>
            <strong>${pendientes.total || 0}</strong>
          </div>
        </div>

        <div class="dashboard-grid dashboard-grid-main">
          <div class="card">
            <div class="section-header">
              <h3>Estado administrativo</h3>
              ${dashboardAction('Abrir auditoria', 'auditoria', 'Auditoria')}
            </div>
            <div class="admin-status-list">
              <div>
                <span class="muted">Accesos correctos 24h</span>
                <strong>${accesos.exitosos_24h || 0}</strong>
              </div>
              <div>
                <span class="muted">Accesos fallidos 24h</span>
                <strong>${accesos.fallidos_24h || 0}</strong>
              </div>
              <div>
                <span class="muted">Cambios auditados hoy</span>
                <strong>${cambios.total_hoy || 0}</strong>
              </div>
              <div>
                <span class="muted">Monto pendiente</span>
                <strong>${formatCurrency(pendientes.monto)}</strong>
              </div>
            </div>
          </div>

          <div class="card next-card">
            <h3>Ultimo respaldo</h3>
            <div>
              <span class="badge ${respaldoEstado === 'Exitoso' ? 'badge-success' : 'badge-neutral'}">${respaldoEstado}</span>
            </div>
            <strong>${respaldoFecha}</strong>
            <p class="muted">${respaldo && respaldo.ruta_archivo ? respaldo.ruta_archivo : 'No hay respaldo registrado.'}</p>
            ${dashboardAction('Gestionar respaldos', 'auditoria', 'Auditoria')}
          </div>
        </div>
      </div>
    `;

    bindDashboardActions();
  } catch (err) {
    target.innerHTML = `
      <div class="card">
        <h3>No se pudo cargar el panel administrativo</h3>
        <p class="muted">${err.message}</p>
        ${dashboardAction('Abrir auditoria', 'auditoria', 'Auditoria')}
      </div>
    `;
    bindDashboardActions();
  }
}

function drawDashboardChart() {
  if (state.payload && state.payload.role === 'ADMIN') {
    renderAdminDashboard();
    return;
  }

  if (state.payload && state.payload.role === 'MEDICO') {
    renderMedicoDashboard();
    return;
  }

  if (state.payload && state.payload.role === 'USUARIO_GENERAL') {
    renderUsuarioGeneralDashboard();
    return;
  }

  renderGenericDashboard();
}

function logout() {
  clearAuth();
  showLogin();
}

