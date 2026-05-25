const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const isDevFrontend = window.location.protocol === 'file:'
  || window.location.port === '5500'
  || (isLocalHost && window.location.port && window.location.port !== '3000');

const API_BASE = isDevFrontend ? 'http://localhost:3000/api' : '/api';

const state = {
  token: null,
  payload: null,
  chart: null,
  reportes: {
    'reportes-consultas': null,
    'reportes-facturacion': null
  }
};

const views = {
  login: document.getElementById('login-view'),
  dashboard: document.getElementById('dashboard-view'),
  pacientes: document.getElementById('pacientes-view'),
  medicos: document.getElementById('medicos-view'),
  consultas: document.getElementById('consultas-view'),
  agendaMedico: document.getElementById('agenda-medico-view'),
  atencion: document.getElementById('atencion-view'),
  expediente: document.getElementById('expediente-view'),
  hospitalizaciones: document.getElementById('hospitalizaciones-view'),
  reportes: document.getElementById('reportes-view'),
  facturacion: document.getElementById('facturacion-view'),
  usuarios: document.getElementById('usuarios-view'),
  auditoria: document.getElementById('auditoria-view')
};

const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const menu = document.getElementById('menu');
const userRole = document.getElementById('user-role');
const userInfo = document.getElementById('user-info');
const viewTitle = document.getElementById('view-title');
const logoutBtn = document.getElementById('logout');

const TIPO_SANGRE_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const TIPO_SANGRE_TO_ID = {
  'A+': 1,
  'A-': 2,
  'B+': 3,
  'B-': 4,
  'AB+': 5,
  'AB-': 6,
  'O+': 7,
  'O-': 8
};
const TIPO_SANGRE_FROM_ID = Object.entries(TIPO_SANGRE_TO_ID)
  .reduce((acc, [name, id]) => {
    acc[id] = name;
    return acc;
  }, {});

let estadosConsultaCache = [];
let rolesCache = [];
let medicosCache = [];
let especialidadesCache = [];
let medicamentosCache = [];
let laboratoriosCache = [];
let facturacionPacientesCache = [];
let facturacionMetodosPagoCache = [];
let facturacionPacienteSearchTimer = null;
let facturacionPacienteSearchSeq = 0;
let consultaPacienteSearchTimer = null;
let consultaPacienteSearchSeq = 0;
let consultaMedicoSearchTimer = null;
let consultaMedicoSearchSeq = 0;
let medicoSearchTimer = null;
let medicoSearchSeq = 0;
let consultaActivaId = null;
let recetaDetalle = [];

const IVA_RATE = 0.16;

const pacienteEditCard = document.getElementById('paciente-edit-card');
const pacienteEditCancel = document.getElementById('paciente-edit-cancel');
const pacienteEditForm = document.getElementById('paciente-edit-form');

const medicoEditCard = document.getElementById('medico-edit-card');
const medicoEditCancel = document.getElementById('medico-edit-cancel');
const medicoEditForm = document.getElementById('medico-edit-form');

const usuarioEditCard = document.getElementById('usuario-edit-card');
const usuarioEditCancel = document.getElementById('usuario-edit-cancel');
const usuarioEditForm = document.getElementById('usuario-edit-form');
const usuarioRolSelect = document.getElementById('usr-rol');
const usuarioRolEditSelect = document.getElementById('usr-edit-rol');
const usuarioMedicoField = document.getElementById('usr-medico-field');
const usuarioMedicoEditField = document.getElementById('usr-edit-medico-field');
const facturacionPacienteInput = document.getElementById('fac-paciente');
const facturacionSubtotalInput = document.getElementById('fac-subtotal');
const facturacionIvaInput = document.getElementById('fac-iva');
const facturacionMetodoSelect = document.getElementById('fac-metodo');
const facturacionMontoInput = document.getElementById('fac-monto');
const facturacionPacienteResults = document.getElementById('fac-paciente-results');
const consultaPacienteInput = document.getElementById('con-paciente');
const consultaPacienteResults = document.getElementById('con-paciente-results');
const consultaMedicoInput = document.getElementById('con-medico');
const consultaMedicoResults = document.getElementById('con-medico-results');
const pacienteNombreInput = document.getElementById('pac-nombre');
const pacienteApellidoPaternoInput = document.getElementById('pac-apellido-paterno');
const pacienteApellidoMaternoInput = document.getElementById('pac-apellido-materno');
const pacienteFechaInput = document.getElementById('pac-fecha');
const pacienteCurpInput = document.getElementById('pac-curp');

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (err) {
    return null;
  }
}

function isTokenValid(payload) {
  if (!payload || !payload.exp) {
    return false;
  }
  return Date.now() < payload.exp * 1000;
}

function setAuth(token) {
  state.token = token;
  state.payload = decodeJwt(token);
  if (token) {
    sessionStorage.setItem('sigeh_token', token);
    localStorage.removeItem('sigeh_token');
  }
}

function clearAuth() {
  state.token = null;
  state.payload = null;
  sessionStorage.removeItem('sigeh_token');
  localStorage.removeItem('sigeh_token');
}

function requireAuth() {
  if (!state.token || !isTokenValid(state.payload)) {
    clearAuth();
    showLogin();
    return false;
  }
  return true;
}

function showLogin() {
  document.body.classList.add('auth-mode');
  document.body.classList.remove('app-mode');
  appShell.classList.add('hidden');
  views.login.classList.remove('hidden');
}

function showApp() {
  document.body.classList.add('app-mode');
  document.body.classList.remove('auth-mode');
  views.login.classList.add('hidden');
  appShell.classList.remove('hidden');
}

async function loadEstadosConsulta() {
  try {
    const data = await apiRequest('/catalogos/estados-consulta');
    estadosConsultaCache = Array.isArray(data) ? data : [];
    const select = document.getElementById('con-estado');
    if (!select) return;

    select.innerHTML = '<option value="">Selecciona</option>';
    estadosConsultaCache.forEach((row) => {
      const option = document.createElement('option');
      option.value = row.nombre;
      option.textContent = row.nombre;
      select.appendChild(option);
    });
  } catch (err) {
    estadosConsultaCache = [];
  }
}

async function loadRoles() {
  try {
    const data = await apiRequest('/catalogos/roles');
    rolesCache = Array.isArray(data) ? data : [];
    populateRolesSelect('usr-rol', true);
    populateRolesSelect('usr-edit-rol', false);
  } catch (err) {
    rolesCache = [];
  }
}

async function loadMedicosCatalog() {
  try {
    const data = await apiRequest('/catalogos/medicos');
    medicosCache = Array.isArray(data) ? data : [];
    populateMedicosSelect('usr-medico', true);
    populateMedicosSelect('usr-edit-medico', false);
  } catch (err) {
    medicosCache = [];
  }
}

async function loadEspecialidadesCatalog() {
  try {
    const data = await apiRequest('/catalogos/especialidades');
    especialidadesCache = Array.isArray(data) ? data : [];
    populateEspecialidadesSelect('med-especialidad', true);
    populateEspecialidadesSelect('med-edit-especialidad', false);
  } catch (err) {
    especialidadesCache = [];
  }
}

async function loadMedicamentosCatalog() {
  try {
    const data = await apiRequest('/catalogos/medicamentos');
    medicamentosCache = Array.isArray(data) ? data : [];
    populateMedicamentosSelect('receta-medicamento');
  } catch (err) {
    medicamentosCache = [];
  }
}

async function loadLaboratoriosCatalog() {
  try {
    const data = await apiRequest('/catalogos/laboratorios');
    laboratoriosCache = Array.isArray(data) ? data : [];
    populateLaboratoriosSelect('laboratorio-estudio');
  } catch (err) {
    laboratoriosCache = [];
  }
}

async function loadFacturacionCatalogs() {
  try {
    const metodosData = await apiRequest('/facturacion/metodos-pago');
    facturacionMetodosPagoCache = Array.isArray(metodosData) ? metodosData : [];
    populateFacturacionMetodosPago();
  } catch (err) {
    facturacionMetodosPagoCache = [];
  }

  updateFacturacionImportes();
}

function populateMedicamentosSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">Selecciona</option>';

  medicamentosCache.forEach((row) => {
    const option = document.createElement('option');
    option.value = row.id_medicamento;
    const nombre = row.nombre_comercial || row.nombre_generico;
    option.textContent = `${nombre} (${row.presentacion})`;
    select.appendChild(option);
  });
}

function populateLaboratoriosSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">Selecciona</option>';

  laboratoriosCache.forEach((row) => {
    const option = document.createElement('option');
    option.value = row.id_laboratorio;
    option.textContent = row.nombre;
    select.appendChild(option);
  });
}

function populateFacturacionPacientes() {
  renderFacturacionPacienteResults(facturacionPacientesCache);
}

function getFacturacionPacienteLabel(row) {
  const nombreCompleto = [row.nombre, row.apellido_paterno, row.apellido_materno].filter(Boolean).join(' ');
  return `${row.id_paciente} - ${nombreCompleto}`.trim();
}

function renderFacturacionPacienteResults(rows) {
  if (!facturacionPacienteResults) return;

  const filtered = Array.isArray(rows) ? rows.slice(0, 8) : [];

  facturacionPacienteResults.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'search-results-empty';
    empty.textContent = 'Escribe al menos 2 caracteres para buscar.';
    facturacionPacienteResults.appendChild(empty);
    return;
  }

  filtered.forEach((row) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result-item';
    button.textContent = getFacturacionPacienteLabel(row);
    button.addEventListener('click', () => {
      if (facturacionPacienteInput) {
        facturacionPacienteInput.value = getFacturacionPacienteLabel(row);
      }
      renderFacturacionPacienteResults(facturacionPacientesCache);
      facturacionPacienteInput?.focus();
    });
    facturacionPacienteResults.appendChild(button);
  });
}

async function searchFacturacionPacientes(term) {
  const query = (term || '').trim();

  if (!facturacionPacienteResults) return;

  if (query.length < 2) {
    facturacionPacientesCache = [];
    renderFacturacionPacienteResults([]);
    return;
  }

  const requestSeq = ++facturacionPacienteSearchSeq;

  const loading = document.createElement('div');
  loading.className = 'search-results-empty';
  loading.textContent = 'Buscando pacientes...';
  facturacionPacienteResults.innerHTML = '';
  facturacionPacienteResults.appendChild(loading);

  try {
    const data = await apiRequest(`/pacientes/buscar?q=${encodeURIComponent(query)}`);
    if (requestSeq !== facturacionPacienteSearchSeq) {
      return;
    }

    facturacionPacientesCache = Array.isArray(data) ? data : [];
    renderFacturacionPacienteResults(facturacionPacientesCache);
  } catch (err) {
    if (requestSeq !== facturacionPacienteSearchSeq) {
      return;
    }

    facturacionPacientesCache = [];
    facturacionPacienteResults.innerHTML = '';
    const error = document.createElement('div');
    error.className = 'search-results-empty';
    error.textContent = 'No se pudo buscar pacientes.';
    facturacionPacienteResults.appendChild(error);
  }
}

function populateFacturacionMetodosPago() {
  if (!facturacionMetodoSelect) return;

  facturacionMetodoSelect.innerHTML = '<option value="">Selecciona un metodo</option>';
  facturacionMetodosPagoCache.forEach((metodo) => {
    const option = document.createElement('option');
    option.value = typeof metodo === 'string' ? metodo : metodo.value;
    option.textContent = typeof metodo === 'string' ? metodo : (metodo.label || metodo.value);
    facturacionMetodoSelect.appendChild(option);
  });
}

function parseSearchResultId(value) {
  const raw = (value || '').trim();
  const match = raw.match(/^(\d+)/);
  return match ? Number(match[1]) : NaN;
}

function renderSearchResults(container, rows, onSelect, getLabel) {
  if (!container) return;

  container.innerHTML = '';

  if (!Array.isArray(rows) || rows.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'search-results-empty';
    empty.textContent = 'Sin coincidencias';
    container.appendChild(empty);
    return;
  }

  rows.slice(0, 8).forEach((row) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result-item';
    button.textContent = getLabel(row);
    button.addEventListener('click', () => onSelect(row));
    container.appendChild(button);
  });
}

async function searchConsultaPacientes(term) {
  const query = (term || '').trim();

  if (!consultaPacienteResults) return;

  if (query.length < 1) {
    consultaPacienteResults.innerHTML = '';
    const hint = document.createElement('div');
    hint.className = 'search-results-empty';
    hint.textContent = 'Escribe id, nombre o CURP para buscar.';
    consultaPacienteResults.appendChild(hint);
    return;
  }

  const requestSeq = ++consultaPacienteSearchSeq;
  consultaPacienteResults.innerHTML = '<div class="search-results-empty">Buscando pacientes...</div>';

  try {
    const data = await apiRequest(`/pacientes/buscar?q=${encodeURIComponent(query)}`);
    if (requestSeq !== consultaPacienteSearchSeq) return;

    const rows = Array.isArray(data) ? data : [];
    renderSearchResults(
      consultaPacienteResults,
      rows,
      (row) => {
        if (consultaPacienteInput) {
          consultaPacienteInput.value = `${row.id_paciente} - ${row.nombre} ${row.apellido_paterno || ''}`.trim();
        }
        consultaPacienteResults.innerHTML = '';
      },
      (row) => `${row.id_paciente} - ${row.nombre} ${row.apellido_paterno || ''}`.trim()
    );
  } catch (err) {
    if (requestSeq !== consultaPacienteSearchSeq) return;
    consultaPacienteResults.innerHTML = '<div class="search-results-empty">No se pudo buscar pacientes.</div>';
  }
}

async function searchConsultaMedicos(term) {
  const query = (term || '').trim();

  if (!consultaMedicoResults) return;

  if (query.length < 1) {
    consultaMedicoResults.innerHTML = '';
    const hint = document.createElement('div');
    hint.className = 'search-results-empty';
    hint.textContent = 'Escribe id o nombre para buscar.';
    consultaMedicoResults.appendChild(hint);
    return;
  }

  const requestSeq = ++consultaMedicoSearchSeq;
  consultaMedicoResults.innerHTML = '<div class="search-results-empty">Buscando medicos...</div>';

  try {
    const data = await apiRequest(`/catalogos/medicos/buscar?q=${encodeURIComponent(query)}`);
    if (requestSeq !== consultaMedicoSearchSeq) return;

    const rows = Array.isArray(data) ? data : [];
    renderSearchResults(
      consultaMedicoResults,
      rows,
      (row) => {
        if (consultaMedicoInput) {
          consultaMedicoInput.value = `${row.id_medico} - ${row.nombre} ${row.apellido_paterno || ''} ${row.apellido_materno || ''}`.trim();
        }
        consultaMedicoResults.innerHTML = '';
      },
      (row) => `${row.id_medico} - ${row.nombre} ${row.apellido_paterno || ''} ${row.apellido_materno || ''}`.trim()
    );
  } catch (err) {
    if (requestSeq !== consultaMedicoSearchSeq) return;
    consultaMedicoResults.innerHTML = '<div class="search-results-empty">No se pudo buscar medicos.</div>';
  }
}

function parseFacturacionPacienteId(value) {
  const raw = (value || '').trim();
  const match = raw.match(/^(\d+)/);
  return match ? Number(match[1]) : NaN;
}

function calculateFacturacionIva(subtotal) {
  return Number((subtotal * IVA_RATE).toFixed(2));
}

function normalizeCurpText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

function getFirstInternalVowel(value) {
  const text = normalizeCurpText(value);
  const match = text.slice(1).match(/[AEIOU]/);
  return match ? match[0] : 'X';
}

function getFirstInternalConsonant(value) {
  const text = normalizeCurpText(value);
  const match = text.slice(1).match(/[BCDFGHJKLMNPQRSTVWXYZ]/);
  return match ? match[0] : 'X';
}

function formatCurpDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function buildCurpSuffix(seed) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1296;
  }

  return hash.toString(36).toUpperCase().padStart(2, '0').slice(-2);
}

function generateCurpPreview() {
  if (!pacienteCurpInput) {
    return '';
  }

  const nombre = normalizeCurpText(pacienteNombreInput?.value);
  const apellidoPaterno = normalizeCurpText(pacienteApellidoPaternoInput?.value);
  const apellidoMaterno = normalizeCurpText(pacienteApellidoMaternoInput?.value);
  const fecha = formatCurpDate(pacienteFechaInput?.value);

  if (!nombre || !apellidoPaterno || !fecha) {
    pacienteCurpInput.value = '';
    return '';
  }

  const nombrePrincipal = ['MARIA', 'JOSE'].includes(nombre) && nombre.length > 2
    ? nombre.slice(1)
    : nombre;

  const prefijo = [
    apellidoPaterno[0] || 'X',
    getFirstInternalVowel(apellidoPaterno),
    apellidoMaterno[0] || 'X',
    nombrePrincipal[0] || 'X'
  ].join('');

  const sexoPlaceholder = 'X';
  const entidadPlaceholder = 'XX';
  const consonantes = [
    getFirstInternalConsonant(apellidoPaterno),
    getFirstInternalConsonant(apellidoMaterno),
    getFirstInternalConsonant(nombrePrincipal)
  ].join('');
  const homoclave = buildCurpSuffix(`${apellidoPaterno}|${apellidoMaterno}|${nombrePrincipal}|${fecha}`);

  const curp = `${prefijo}${fecha}${sexoPlaceholder}${entidadPlaceholder}${consonantes}${homoclave}`.slice(0, 18);
  pacienteCurpInput.value = curp;
  return curp;
}

function updateFacturacionImportes() {
  if (!facturacionSubtotalInput || !facturacionIvaInput || !facturacionMontoInput) return;

  const subtotal = Number.parseFloat(facturacionSubtotalInput.value);
  if (Number.isNaN(subtotal) || subtotal < 0) {
    facturacionIvaInput.value = '';
    facturacionMontoInput.value = '';
    return;
  }

  const iva = calculateFacturacionIva(subtotal);
  const total = Number((subtotal + iva).toFixed(2));
  facturacionIvaInput.value = iva.toFixed(2);
  facturacionMontoInput.value = total.toFixed(2);
}

function populateEspecialidadesSelect(selectId, includeEmpty) {
  const select = document.getElementById(selectId);
  if (!select) return;

  if (includeEmpty) {
    select.innerHTML = '<option value="">Selecciona</option>';
  } else {
    select.innerHTML = '<option value="">Sin cambio</option>';
  }

  especialidadesCache.forEach((row) => {
    const option = document.createElement('option');
    option.value = row.id_especialidad;
    option.textContent = row.nombre;
    select.appendChild(option);
  });
}

function populateMedicosSelect(selectId, includeEmpty) {
  const select = document.getElementById(selectId);
  if (!select) return;

  if (includeEmpty) {
    select.innerHTML = '<option value="">Selecciona</option>';
  } else {
    select.innerHTML = '<option value="">Sin cambio</option>';
  }

  medicosCache.forEach((row) => {
    const option = document.createElement('option');
    option.value = row.id_medico;
    const apellido = row.apellido_paterno ? ` ${row.apellido_paterno}` : '';
    const apellidoM = row.apellido_materno ? ` ${row.apellido_materno}` : '';
    option.textContent = `${row.nombre}${apellido}${apellidoM}`.trim();
    select.appendChild(option);
  });
}

function populateRolesSelect(selectId, includeEmpty) {
  const select = document.getElementById(selectId);
  if (!select) return;

  if (includeEmpty) {
    select.innerHTML = '<option value="">Selecciona</option>';
  } else {
    select.innerHTML = '<option value="">Sin cambio</option>';
  }

  rolesCache.forEach((row) => {
    const option = document.createElement('option');
    option.value = row.id_rol;
    option.textContent = row.nombre;
    select.appendChild(option);
  });
}

function populateTipoSangreSelect(selectId, includeEmpty) {
  const select = document.getElementById(selectId);
  if (!select) return;

  if (includeEmpty) {
    select.innerHTML = '<option value="">Selecciona</option>';
  } else {
    select.innerHTML = '<option value="">Sin cambio</option>';
  }

  TIPO_SANGRE_OPTIONS.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

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

  if (key === 'facturacion') {
    loadFacturacionCatalogs();
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
    { key: 'expediente', label: 'Expediente clinico', roles: ['MEDICO', 'USUARIO_GENERAL'] },
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
        if (item.key === 'agendaMedico') {
          loadAgendaMedico();
        }
        if (item.key === 'hospitalizaciones') {
          loadHospitalizaciones();
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
    drawDashboardChart();
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

function drawDashboardChart() {
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

function logout() {
  clearAuth();
  showLogin();
}

async function handlePacienteCreate(event) {
  event.preventDefault();

  const generatedCurp = generateCurpPreview();
  const payload = {
    nombre: pacienteNombreInput.value.trim(),
    apellido_paterno: pacienteApellidoPaternoInput.value.trim(),
    apellido_materno: pacienteApellidoMaternoInput.value.trim() || null,
    fecha_nacimiento: pacienteFechaInput.value,
    curp: generatedCurp,
    telefono: document.getElementById('pac-telefono').value.trim() || null,
    correo_electronico: document.getElementById('pac-correo').value.trim() || null,
    id_tipo_sangre: TIPO_SANGRE_TO_ID[document.getElementById('pac-tipo').value] || null,
    alergias: document.getElementById('pac-alergias').value.trim() || null
  };

  if (!payload.nombre || !payload.apellido_paterno || !payload.fecha_nacimiento || !payload.curp) {
    return Swal.fire('Error', 'Completa los campos requeridos.', 'error');
  }

  if (payload.curp.length !== 18) {
    return Swal.fire('Error', 'No se pudo generar la CURP.', 'error');
  }

  try {
    await apiRequest('/pacientes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Paciente registrado', 'success');
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handlePacienteBuscar() {
  const rawId = document.getElementById('paciente-id-buscar').value.trim();
  const id = rawId ? parseInt(rawId, 10) : null;

  try {
    const data = id ? await apiRequest(`/pacientes/${id}`) : await apiRequest('/pacientes');
    const tbody = document.querySelector('#pacientes-table tbody');
    tbody.innerHTML = '';
    const rows = Array.isArray(data) ? data : [data];

    if (rows.length === 0) {
      return Swal.fire('Aviso', 'No hay pacientes registrados', 'info');
    }

    rows.forEach((rowData) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${rowData.id_paciente}</td>
        <td>${rowData.nombre} ${rowData.apellido_paterno}</td>
        <td>${rowData.curp}</td>
        <td>${rowData.telefono || ''}</td>
        <td><button class="ghost" data-id="${rowData.id_paciente}">Editar</button></td>
      `;
      row.querySelector('button').addEventListener('click', async () => {
        try {
          const fullData = await apiRequest(`/pacientes/${rowData.id_paciente}`);
          fillPacienteEditForm(fullData);
        } catch (err) {
          fillPacienteEditForm(rowData);
        }
        showPacienteEditForm();
      });
      tbody.appendChild(row);
    });
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handlePacienteUpdate(event) {
  event.preventDefault();

  const id = parseInt(document.getElementById('pac-edit-id').value, 10);
  if (!id) {
    return Swal.fire('Error', 'Id invalido', 'error');
  }

  const payload = {
    nombre: document.getElementById('pac-edit-nombre').value.trim() || undefined,
    apellido_paterno: document.getElementById('pac-edit-apellido-paterno').value.trim() || undefined,
    curp: document.getElementById('pac-edit-curp').value.trim() || undefined,
    telefono: document.getElementById('pac-edit-telefono').value.trim() || undefined,
    correo_electronico: document.getElementById('pac-edit-correo').value.trim() || undefined,
    id_tipo_sangre: TIPO_SANGRE_TO_ID[document.getElementById('pac-edit-tipo').value],
    activo: document.getElementById('pac-edit-activo').value
  };

  if (payload.curp && payload.curp.length !== 18) {
    return Swal.fire('Error', 'CURP debe tener 18 caracteres.', 'error');
  }

  if (!payload.id_tipo_sangre) {
    delete payload.id_tipo_sangre;
  }

  if (payload.activo === '') {
    delete payload.activo;
  } else {
    payload.activo = payload.activo === 'true';
  }

  try {
    await apiRequest(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Paciente actualizado', 'success');
    hidePacienteEditForm();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleMedicoCreate(event) {
  event.preventDefault();

  const payload = {
    nombre: document.getElementById('med-nombre').value.trim(),
    apellido_paterno: document.getElementById('med-apellido-paterno').value.trim(),
    apellido_materno: document.getElementById('med-apellido-materno').value.trim() || null,
    cedula_profesional: document.getElementById('med-cedula').value.trim(),
    id_especialidad: parseInt(document.getElementById('med-especialidad').value, 10),
    telefono: document.getElementById('med-telefono').value.trim() || null,
    correo_electronico: document.getElementById('med-correo').value.trim() || null
  };

  if (!payload.nombre || !payload.apellido_paterno || !payload.cedula_profesional || !payload.id_especialidad) {
    return Swal.fire('Error', 'Completa los campos requeridos.', 'error');
  }

  try {
    await apiRequest('/medicos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Medico registrado', 'success');
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleMedicoBuscar() {
  const term = document.getElementById('medico-id-buscar').value.trim();
  const tbody = document.querySelector('#medicos-table tbody');

  if (!tbody) {
    return;
  }

  if (term.length < 1) {
    tbody.innerHTML = '<tr><td colspan="4">Escribe un id o nombre para buscar.</td></tr>';
    return;
  }

  const requestSeq = ++medicoSearchSeq;
  tbody.innerHTML = '<tr><td colspan="4">Buscando medicos...</td></tr>';

  try {
    const data = await apiRequest(`/catalogos/medicos/buscar?q=${encodeURIComponent(term)}`);
    if (requestSeq !== medicoSearchSeq) {
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    tbody.innerHTML = '';

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">Sin coincidencias.</td></tr>';
      return;
    }

    rows.forEach((rowData) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${rowData.id_medico}</td>
        <td>${rowData.nombre} ${rowData.apellido_paterno || ''} ${rowData.apellido_materno || ''}</td>
        <td>${rowData.cedula_profesional || ''}</td>
        <td><button class="ghost" data-id="${rowData.id_medico}">Editar</button></td>
      `;
      row.querySelector('button').addEventListener('click', () => {
        fillMedicoEditForm(rowData);
        showMedicoEditForm();
      });
      tbody.appendChild(row);
    });
  } catch (err) {
    if (requestSeq !== medicoSearchSeq) {
      return;
    }
    tbody.innerHTML = '<tr><td colspan="4">No se pudo buscar medicos.</td></tr>';
  }
}

async function handleUsuarioCreate(event) {
  event.preventDefault();

  const payload = {
    username: document.getElementById('usr-username').value.trim(),
    password: document.getElementById('usr-password').value.trim(),
    id_rol: parseInt(document.getElementById('usr-rol').value, 10),
    id_medico: parseInt(document.getElementById('usr-medico').value, 10) || null
  };

  if (!payload.username || !payload.password || !payload.id_rol) {
    return Swal.fire('Error', 'Completa los campos requeridos.', 'error');
  }

  toggleUsuarioMedicoField(payload.id_rol, false);

  if (usuarioMedicoField && !usuarioMedicoField.classList.contains('hidden') && !payload.id_medico) {
    return Swal.fire('Error', 'Selecciona el medico asociado.', 'error');
  }

  try {
    await apiRequest('/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Usuario creado', 'success');
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleUsuarioBuscar() {
  const rawId = document.getElementById('usuario-id-buscar').value.trim();
  const id = rawId ? parseInt(rawId, 10) : null;

  try {
    const data = id ? await apiRequest(`/usuarios/${id}`) : await apiRequest('/usuarios');
    const tbody = document.querySelector('#usuarios-table tbody');
    tbody.innerHTML = '';

    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) {
      return Swal.fire('Aviso', 'No hay usuarios registrados', 'info');
    }

    rows.forEach((rowData) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${rowData.id_usuario}</td>
        <td>${rowData.username}</td>
        <td>${rowData.rol}</td>
        <td>${rowData.activo ? 'Si' : 'No'}</td>
        <td>
          <button class="ghost" data-id="${rowData.id_usuario}" data-action="edit">Editar</button>
          <button class="ghost" data-id="${rowData.id_usuario}" data-action="delete" ${Number(state.payload.sub) === Number(rowData.id_usuario) ? 'disabled' : ''}>Eliminar</button>
        </td>
      `;
      tr.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const action = btn.dataset.action;
          if (action === 'delete') {
            if (Number(state.payload.sub) === Number(rowData.id_usuario)) {
              return Swal.fire('Error', 'No puedes eliminar tu propio usuario.', 'error');
            }
            const confirm = await Swal.fire({
              title: 'Eliminar usuario?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Si'
            });
            if (!confirm.isConfirmed) return;
            try {
              await apiRequest(`/usuarios/${rowData.id_usuario}`, { method: 'DELETE' });
              Swal.fire('Listo', 'Usuario eliminado', 'success');
              handleUsuarioBuscar();
            } catch (err) {
              Swal.fire('Error', err.message, 'error');
            }
            return;
          }

          try {
            const full = await apiRequest(`/usuarios/${rowData.id_usuario}`);
            fillUsuarioEditForm(full);
          } catch (err) {
            fillUsuarioEditForm(rowData);
          }
          showUsuarioEditForm();
        });
      });
      tbody.appendChild(tr);
    });
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleUsuarioUpdate(event) {
  event.preventDefault();

  const id = parseInt(document.getElementById('usr-edit-id').value, 10);
  if (!id) {
    return Swal.fire('Error', 'Id invalido', 'error');
  }

  const payload = {
    username: document.getElementById('usr-edit-username').value.trim() || undefined,
    password: document.getElementById('usr-edit-password').value.trim() || undefined,
    id_rol: parseInt(document.getElementById('usr-edit-rol').value, 10) || undefined,
    id_medico: parseInt(document.getElementById('usr-edit-medico').value, 10) || undefined,
    activo: document.getElementById('usr-edit-activo').value,
    bloqueado: document.getElementById('usr-edit-bloqueado').value
  };

  if (payload.activo === '') {
    delete payload.activo;
  } else {
    payload.activo = payload.activo === 'true';
  }

  if (payload.bloqueado === '') {
    delete payload.bloqueado;
  } else {
    payload.bloqueado = payload.bloqueado === 'true';
  }

  if (!payload.password) {
    delete payload.password;
  }

  if (!payload.id_rol) {
    delete payload.id_rol;
  }

  if (!payload.id_medico) {
    delete payload.id_medico;
  }

  toggleUsuarioMedicoField(payload.id_rol || document.getElementById('usr-edit-rol').value, true);

  if (usuarioMedicoEditField && !usuarioMedicoEditField.classList.contains('hidden') && !payload.id_medico) {
    return Swal.fire('Error', 'Selecciona el medico asociado.', 'error');
  }

  try {
    await apiRequest(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Usuario actualizado', 'success');
    hideUsuarioEditForm();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

function setAuditoriaTab(tab) {
  const accesos = document.getElementById('auditoria-accesos');
  const cambios = document.getElementById('auditoria-cambios');
  const respaldos = document.getElementById('auditoria-respaldos');
  const monitoreo = document.getElementById('auditoria-monitoreo');
  const btnAccesos = document.getElementById('auditoria-tab-accesos');
  const btnCambios = document.getElementById('auditoria-tab-cambios');
  const btnRespaldos = document.getElementById('auditoria-tab-respaldos');
  const btnMonitoreo = document.getElementById('auditoria-tab-monitoreo');

  if (accesos && cambios && respaldos && monitoreo) {
    accesos.classList.toggle('hidden', tab !== 'accesos');
    cambios.classList.toggle('hidden', tab !== 'cambios');
    respaldos.classList.toggle('hidden', tab !== 'respaldos');
    monitoreo.classList.toggle('hidden', tab !== 'monitoreo');
  }
  if (btnAccesos && btnCambios && btnRespaldos && btnMonitoreo) {
    btnAccesos.classList.toggle('active', tab === 'accesos');
    btnCambios.classList.toggle('active', tab === 'cambios');
    btnRespaldos.classList.toggle('active', tab === 'respaldos');
    btnMonitoreo.classList.toggle('active', tab === 'monitoreo');
  }
}

async function loadInfraMonitor() {
  try {
    const [overview, replica] = await Promise.all([
      apiRequest('/infra/monitor/overview'),
      apiRequest('/infra/replication/status')
    ]);

    const overviewOut = document.getElementById('monitor-overview-output');
    const replicaOut = document.getElementById('monitor-replica-output');
    if (overviewOut) {
      overviewOut.textContent = JSON.stringify(overview, null, 2);
    }
    if (replicaOut) {
      replicaOut.textContent = JSON.stringify(replica, null, 2);
    }
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function loadAuditoria() {
  try {
    const [accesos, cambios, respaldos] = await Promise.all([
      apiRequest('/auditoria/accesos'),
      apiRequest('/auditoria/cambios'),
      apiRequest('/auditoria/respaldos')
    ]);

    const accesosBody = document.querySelector('#auditoria-accesos-table tbody');
    const cambiosBody = document.querySelector('#auditoria-cambios-table tbody');
    const respaldosBody = document.querySelector('#auditoria-respaldos-table tbody');
    if (accesosBody) accesosBody.innerHTML = '';
    if (cambiosBody) cambiosBody.innerHTML = '';
    if (respaldosBody) respaldosBody.innerHTML = '';

    (accesos || []).forEach((row) => {
      const tr = document.createElement('tr');
      const badgeClass = row.exito ? 'badge badge-success' : 'badge badge-error';
      const badgeText = row.exito ? 'OK' : 'FAIL';
      tr.innerHTML = `
        <td>${row.username || row.username_intento || ''}</td>
        <td>${row.ip_origen || ''}</td>
        <td>${new Date(row.fecha_hora).toLocaleString()}</td>
        <td>${row.tipo_evento}</td>
        <td><span class="${badgeClass}">${badgeText}</span></td>
      `;
      accesosBody && accesosBody.appendChild(tr);
    });

    (cambios || []).forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.tabla_afectada}</td>
        <td>${row.campo_modificado}</td>
        <td>${row.valor_anterior || ''}</td>
        <td>${row.valor_nuevo || ''}</td>
        <td>${row.operacion}</td>
        <td>${new Date(row.fecha_hora).toLocaleString()}</td>
      `;
      cambiosBody && cambiosBody.appendChild(tr);
    });

    (respaldos || []).forEach((row) => {
      const tr = document.createElement('tr');
      const existe = row.archivo_existe ? 'Si' : 'No';
      tr.innerHTML = `
        <td>${row.tipo_respaldo}</td>
        <td>${row.ruta_archivo}</td>
        <td>${row.estado}</td>
        <td>${new Date(row.fecha_inicio).toLocaleString()}</td>
        <td>${row.fecha_fin ? new Date(row.fecha_fin).toLocaleString() : ''}</td>
        <td>${row.tamanio_mb ?? row.tamano_archivo_mb_real ?? ''}</td>
        <td>${existe}</td>
      `;
      respaldosBody && respaldosBody.appendChild(tr);
    });
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleRespaldoCreate(event) {
  event.preventDefault();

  const payload = {
    tipo_respaldo: document.getElementById('respaldo-tipo').value,
    directorio: document.getElementById('respaldo-directorio').value.trim() || undefined
  };

  if (!payload.tipo_respaldo) {
    return Swal.fire('Error', 'Completa los campos requeridos.', 'error');
  }

  try {
    await apiRequest('/auditoria/respaldos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Respaldo generado y registrado', 'success');
    document.getElementById('respaldo-form').reset();
    loadAuditoria();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleFacturacion(event) {
  event.preventDefault();

  const idPaciente = parseFacturacionPacienteId(facturacionPacienteInput?.value);
  const subtotal = Number.parseFloat(facturacionSubtotalInput?.value);
  const metodoPago = facturacionMetodoSelect?.value.trim();
  const monto = Number.parseFloat(facturacionMontoInput?.value);

  const payload = {
    id_paciente: idPaciente,
    subtotal,
    metodo_pago: metodoPago,
    monto
  };

  if (!payload.id_paciente || Number.isNaN(payload.subtotal) || !payload.metodo_pago || Number.isNaN(payload.monto)) {
    return Swal.fire('Error', 'Completa los campos requeridos.', 'error');
  }

  if (payload.subtotal <= 0 || payload.monto <= 0) {
    return Swal.fire('Error', 'Montos invalidos.', 'error');
  }

  try {
    const result = await apiRequest('/facturacion/pago', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', `Factura ${result.folio} y pago registrados`, 'success');
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function loadAgendaMedico() {
  try {
    const data = await apiRequest('/medico/agenda');
    const tbody = document.querySelector('#agenda-medico-table tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
      return Swal.fire('Aviso', 'No hay consultas para hoy', 'info');
    }

    data.forEach((row) => {
      const tr = document.createElement('tr');
      const hora = new Date(row.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      tr.innerHTML = `
        <td>${hora}</td>
        <td>${row.nombre} ${row.apellido_paterno}</td>
        <td>${row.motivo}</td>
        <td><button class="ghost" data-id="${row.id_consulta}">Atender</button></td>
      `;
      tr.querySelector('button').addEventListener('click', () => {
        consultaActivaId = row.id_consulta;
        const resumen = document.getElementById('atencion-resumen');
        if (resumen) {
          resumen.textContent = `Consulta #${row.id_consulta} - ${row.nombre} ${row.apellido_paterno}`;
        }
        setView('atencion', 'Sala de atencion');
      });
      tbody.appendChild(tr);
    });
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleAtencionSubmit(event) {
  event.preventDefault();

  if (!consultaActivaId) {
    return Swal.fire('Error', 'Selecciona una consulta', 'error');
  }

  const payload = {
    sintomas: document.getElementById('atencion-sintomas').value.trim(),
    peso: document.getElementById('atencion-peso').value.trim() || null,
    talla: document.getElementById('atencion-talla').value.trim() || null,
    temperatura: document.getElementById('atencion-temperatura').value.trim() || null,
    presion_arterial: document.getElementById('atencion-presion').value.trim() || null,
    frecuencia_cardiaca: document.getElementById('atencion-frecuencia').value.trim() || null,
    diagnostico: document.getElementById('atencion-diagnostico').value.trim(),
    notas: document.getElementById('atencion-notas').value.trim() || null
  };

  if (!payload.sintomas || !payload.diagnostico) {
    return Swal.fire('Error', 'Sintomas y diagnostico son requeridos', 'error');
  }

  try {
    await apiRequest(`/medico/consultas/${consultaActivaId}/atender`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Consulta atendida', 'success');
    document.getElementById('atencion-form').reset();
    consultaActivaId = null;
    const resumen = document.getElementById('atencion-resumen');
    if (resumen) {
      resumen.textContent = 'Selecciona una consulta desde la agenda.';
    }
    recetaDetalle = [];
    renderRecetaDetalle();
    setView('agendaMedico', 'Mi agenda');
    loadAgendaMedico();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

function renderRecetaDetalle() {
  const tbody = document.querySelector('#receta-detalle-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  recetaDetalle.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nombre}</td>
      <td>${item.dosis} ${item.unidad_dosis}</td>
      <td>${item.frecuencia}</td>
      <td>${item.duracion_dias}</td>
      <td><button class="ghost" data-index="${index}">Quitar</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => {
      recetaDetalle.splice(index, 1);
      renderRecetaDetalle();
    });
    tbody.appendChild(tr);
  });
}

async function handleRecetaAgregar(event) {
  event.preventDefault();

  const idMedicamento = parseInt(document.getElementById('receta-medicamento').value, 10);
  const dosis = document.getElementById('receta-dosis').value.trim();
  const unidad = document.getElementById('receta-unidad').value.trim();
  const frecuencia = document.getElementById('receta-frecuencia').value.trim();
  const duracion = parseInt(document.getElementById('receta-duracion').value, 10);
  const indicaciones = document.getElementById('receta-indicaciones').value.trim() || null;

  if (!idMedicamento || !dosis || !unidad || !frecuencia || !duracion) {
    return Swal.fire('Error', 'Completa el detalle del medicamento', 'error');
  }

  const medicamento = medicamentosCache.find((m) => m.id_medicamento === idMedicamento);
  recetaDetalle.push({
    id_medicamento: idMedicamento,
    nombre: medicamento ? (medicamento.nombre_comercial || medicamento.nombre_generico) : 'Medicamento',
    dosis,
    unidad_dosis: unidad,
    frecuencia,
    duracion_dias: duracion,
    indicaciones
  });

  renderRecetaDetalle();
  document.getElementById('receta-form').reset();
}

async function handleRecetaGuardar() {
  if (!consultaActivaId) {
    return Swal.fire('Error', 'Selecciona una consulta', 'error');
  }

  if (recetaDetalle.length === 0) {
    return Swal.fire('Error', 'Agrega al menos un medicamento', 'error');
  }

  try {
    await apiRequest(`/medico/consultas/${consultaActivaId}/recetas`, {
      method: 'POST',
      body: JSON.stringify({ detalles: recetaDetalle })
    });

    Swal.fire('Listo', 'Receta registrada', 'success');
    recetaDetalle = [];
    renderRecetaDetalle();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleLaboratorioSubmit(event) {
  event.preventDefault();

  if (!consultaActivaId) {
    return Swal.fire('Error', 'Selecciona una consulta', 'error');
  }

  const idLaboratorio = parseInt(document.getElementById('laboratorio-estudio').value, 10);
  const observaciones = document.getElementById('laboratorio-obs').value.trim() || null;
  if (!idLaboratorio) {
    return Swal.fire('Error', 'Selecciona un estudio', 'error');
  }

  try {
    await apiRequest(`/medico/consultas/${consultaActivaId}/estudios`, {
      method: 'POST',
      body: JSON.stringify({ id_laboratorio: idLaboratorio, observaciones })
    });

    Swal.fire('Listo', 'Estudio solicitado', 'success');
    document.getElementById('laboratorio-form').reset();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function loadHospitalizaciones() {
  try {
    const data = await apiRequest('/medico/hospitalizaciones');
    const tbody = document.querySelector('#hospitalizaciones-table tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
      return Swal.fire('Aviso', 'No hay hospitalizaciones activas', 'info');
    }

    data.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.nombre} ${row.apellido_paterno}</td>
        <td>${row.cama}</td>
        <td>${new Date(row.fecha_ingreso).toLocaleString()}</td>
        <td><button class="ghost" data-id="${row.id_hospitalizacion}">Dar de alta</button></td>
      `;
      tr.querySelector('button').addEventListener('click', async () => {
        const { value } = await Swal.fire({
          title: 'Diagnostico de egreso',
          input: 'textarea',
          inputPlaceholder: 'Diagnostico de egreso',
          showCancelButton: true
        });
        if (!value) return;
        try {
          await apiRequest(`/medico/hospitalizaciones/${row.id_hospitalizacion}/alta`, {
            method: 'PATCH',
            body: JSON.stringify({ diagnostico_egreso: value })
          });
          Swal.fire('Listo', 'Alta registrada', 'success');
          loadHospitalizaciones();
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      });
      tbody.appendChild(tr);
    });
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleHospitalizacionCreate(event) {
  event.preventDefault();

  const payload = {
    id_paciente: parseInt(document.getElementById('hosp-paciente').value, 10),
    cama: document.getElementById('hosp-cama').value.trim(),
    diagnostico_ingreso: document.getElementById('hosp-diag-ingreso').value.trim()
  };

  if (!payload.id_paciente || !payload.cama || !payload.diagnostico_ingreso) {
    return Swal.fire('Error', 'Completa los campos requeridos', 'error');
  }

  try {
    await apiRequest('/medico/hospitalizaciones', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    Swal.fire('Listo', 'Ingreso registrado', 'success');
    document.getElementById('hospitalizacion-form').reset();
    loadHospitalizaciones();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleMedicoUpdate(event) {
  event.preventDefault();

  const id = parseInt(document.getElementById('med-edit-id').value, 10);
  if (!id) {
    return Swal.fire('Error', 'Id invalido', 'error');
  }

  const payload = {
    nombre: document.getElementById('med-edit-nombre').value.trim() || undefined,
    apellido_paterno: document.getElementById('med-edit-apellido-paterno').value.trim() || undefined,
    cedula_profesional: document.getElementById('med-edit-cedula').value.trim() || undefined,
    id_especialidad: parseInt(document.getElementById('med-edit-especialidad').value, 10) || undefined,
    telefono: document.getElementById('med-edit-telefono').value.trim() || undefined,
    correo_electronico: document.getElementById('med-edit-correo').value.trim() || undefined,
    activo: document.getElementById('med-edit-activo').value
  };

  if (!payload.id_especialidad) {
    delete payload.id_especialidad;
  }

  if (payload.activo === '') {
    delete payload.activo;
  } else {
    payload.activo = payload.activo === 'true';
  }

  try {
    await apiRequest(`/medicos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Medico actualizado', 'success');
    hideMedicoEditForm();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleConsultaCreate(event) {
  event.preventDefault();

  const idPaciente = parseSearchResultId(consultaPacienteInput?.value);
  const idMedico = parseSearchResultId(consultaMedicoInput?.value);
  const payload = {
    id_pac: idPaciente,
    id_med: idMedico,
    id_est: null,
    fecha: document.getElementById('con-fecha').value,
    motivo: document.getElementById('con-motivo').value.trim()
  };

  const estadoNombre = document.getElementById('con-estado').value;
  if (estadoNombre) {
    const match = estadosConsultaCache.find((row) => row.nombre === estadoNombre);
    payload.id_est = match ? match.id_estado : null;
  }

  if (!payload.id_pac || !payload.id_med || !payload.id_est || !payload.fecha || !payload.motivo) {
    return Swal.fire('Error', 'Completa todos los campos.', 'error');
  }

  try {
    await apiRequest('/consultas', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Consulta registrada', 'success');
  } catch (err) {
    if (err.message.toLowerCase().includes('empalme')) {
      return Swal.fire('Atencion', err.message, 'warning');
    }
    Swal.fire('Error', err.message, 'error');
  }
}

function calculateAge(dateString) {
  if (!dateString) return '';
  const birth = new Date(dateString);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function setExpedienteTab(tab) {
  const fichaBtn = document.getElementById('exp-tab-ficha');
  const antecedentesBtn = document.getElementById('exp-tab-antecedentes');
  const historialBtn = document.getElementById('exp-tab-historial');
  const fichaPanel = document.getElementById('exp-tab-panel-ficha');
  const antecedentesPanel = document.getElementById('exp-tab-panel-antecedentes');
  const historialPanel = document.getElementById('exp-tab-panel-historial');

  if (!fichaBtn || !antecedentesBtn || !historialBtn) return;

  fichaBtn.classList.toggle('active', tab === 'ficha');
  antecedentesBtn.classList.toggle('active', tab === 'antecedentes');
  historialBtn.classList.toggle('active', tab === 'historial');

  if (fichaPanel) fichaPanel.classList.toggle('hidden', tab !== 'ficha');
  if (antecedentesPanel) antecedentesPanel.classList.toggle('hidden', tab !== 'antecedentes');
  if (historialPanel) historialPanel.classList.toggle('hidden', tab !== 'historial');
}

function parseNotas(notas) {
  if (!notas) return null;
  try {
    return JSON.parse(notas);
  } catch (err) {
    return null;
  }
}

function renderHistorial(items) {
  const container = document.getElementById('exp-historial');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = '<div class="muted">Sin consultas registradas.</div>';
    return;
  }

  items.forEach((item) => {
    const notas = parseNotas(item.notas);
    const wrapper = document.createElement('div');
    wrapper.className = 'timeline-item';

    const fecha = new Date(item.fecha_hora).toLocaleString();
    const medico = `${item.medico_nombre || ''} ${item.medico_apellido_paterno || ''}`.trim();

    wrapper.innerHTML = `
      <div class="timeline-header">
        <strong>${fecha}</strong> - ${medico}
      </div>
      <div><strong>Motivo:</strong> ${item.motivo || ''}</div>
      <div><strong>Diagnostico:</strong> ${item.diagnostico || ''}</div>
      <div><strong>Sintomas:</strong> ${notas && notas.sintomas ? notas.sintomas : ''}</div>
      <div class="grid">
        <div><strong>Peso:</strong> ${notas && notas.peso ? notas.peso : ''}</div>
        <div><strong>Talla:</strong> ${notas && notas.talla ? notas.talla : ''}</div>
        <div><strong>Temperatura:</strong> ${notas && notas.temperatura ? notas.temperatura : ''}</div>
        <div><strong>Presion:</strong> ${notas && notas.presion_arterial ? notas.presion_arterial : ''}</div>
        <div><strong>Frecuencia:</strong> ${notas && notas.frecuencia_cardiaca ? notas.frecuencia_cardiaca : ''}</div>
      </div>
      <div><strong>Notas:</strong> ${notas && notas.notas ? notas.notas : ''}</div>
    `;
    container.appendChild(wrapper);
  });
}

async function loadExpedienteDetalle(idPaciente) {
  const detailCard = document.getElementById('expediente-detalle-card');
  const permisoCard = document.getElementById('expediente-permiso');

  if (state.payload.role !== 'MEDICO') {
    if (detailCard) detailCard.classList.add('hidden');
    if (permisoCard) permisoCard.classList.remove('hidden');
    return;
  }

  try {
    const data = await apiRequest(`/expedientes/${idPaciente}`);
    const expediente = data.expediente || {};

    if (detailCard) {
      detailCard.dataset.idExpediente = expediente.id_expediente || '';
      detailCard.dataset.idPaciente = expediente.id_paciente || '';
      detailCard.classList.remove('hidden');
    }
    if (permisoCard) {
      permisoCard.classList.add('hidden');
    }

    const fullName = `${expediente.nombre || ''} ${expediente.apellido_paterno || ''} ${expediente.apellido_materno || ''}`.trim();
    const edad = calculateAge(expediente.fecha_nacimiento);

    const nombreEl = document.getElementById('exp-nombre');
    const edadEl = document.getElementById('exp-edad');
    const curpEl = document.getElementById('exp-curp');
    const tipoEl = document.getElementById('exp-tipo-sangre');
    const alergiasEl = document.getElementById('exp-alergias');

    if (nombreEl) nombreEl.textContent = fullName;
    if (edadEl) edadEl.textContent = edad;
    if (curpEl) curpEl.textContent = expediente.curp || '';
    if (tipoEl) tipoEl.textContent = expediente.tipo_sangre || '';
    if (alergiasEl) alergiasEl.textContent = expediente.alergias || '';

    const alergiasEdit = document.getElementById('exp-alergias-edit');
    const personales = document.getElementById('exp-antecedentes-personales');
    const heredo = document.getElementById('exp-antecedentes-heredo');
    const quirurgicos = document.getElementById('exp-antecedentes-quirurgicos');

    if (alergiasEdit) alergiasEdit.value = expediente.alergias || '';
    if (personales) personales.value = expediente.antecedentes_personales || '';
    if (heredo) heredo.value = expediente.antecedentes_heredo || '';
    if (quirurgicos) quirurgicos.value = expediente.antecedentes_quirurgicos || '';

    renderHistorial(data.historial || []);
    setExpedienteTab('ficha');
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleExpedienteBuscar() {
  const input = document.getElementById('exp-search-input');
  const term = input ? input.value.trim() : '';
  const table = document.getElementById('exp-search-table');
  const tbody = table ? table.querySelector('tbody') : null;
  const empty = document.getElementById('exp-search-empty');

  if (!term) {
    if (empty) empty.textContent = 'Ingresa un criterio para buscar.';
    if (table) table.classList.add('hidden');
    return;
  }

  try {
    const data = await apiRequest(`/expedientes/buscar?q=${encodeURIComponent(term)}`);

    if (table && tbody) {
      tbody.innerHTML = '';
      table.classList.remove('hidden');
    }
    if (empty) {
      empty.textContent = Array.isArray(data) && data.length > 0
        ? ''
        : 'Sin resultados.';
    }

    if (!Array.isArray(data) || data.length === 0 || !tbody) {
      return;
    }

    data.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.id_paciente}</td>
        <td>${row.nombre} ${row.apellido_paterno}</td>
        <td>${row.curp || ''}</td>
        <td>${row.tipo_sangre || ''}</td>
        <td>${row.alergias || ''}</td>
        <td><button class="ghost" data-id="${row.id_paciente}">Ver</button></td>
      `;

      tr.querySelector('button').addEventListener('click', () => {
        loadExpedienteDetalle(row.id_paciente);
      });

      tbody.appendChild(tr);
    });
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function handleAntecedentesGuardar(event) {
  event.preventDefault();

  const detailCard = document.getElementById('expediente-detalle-card');
  const idExpediente = detailCard ? Number(detailCard.dataset.idExpediente) : null;
  const idPaciente = detailCard ? Number(detailCard.dataset.idPaciente) : null;

  if (!idExpediente) {
    return Swal.fire('Error', 'Selecciona un expediente', 'error');
  }

  const payload = {
    alergias: document.getElementById('exp-alergias-edit').value.trim(),
    antecedentes_personales: document.getElementById('exp-antecedentes-personales').value.trim(),
    antecedentes_heredo: document.getElementById('exp-antecedentes-heredo').value.trim(),
    antecedentes_quirurgicos: document.getElementById('exp-antecedentes-quirurgicos').value.trim()
  };

  try {
    await apiRequest(`/expedientes/${idExpediente}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    Swal.fire('Listo', 'Antecedentes actualizados', 'success');
    if (idPaciente) {
      await loadExpedienteDetalle(idPaciente);
    }
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

async function loadReportes() {
  try {
    const [consultas, facturacion, ocupacion, inventario, historial] = await Promise.all([
      apiRequest('/reportes/consultas-mes'),
      apiRequest('/reportes/facturacion-mes'),
      apiRequest('/reportes/ocupacion-camas'),
      apiRequest('/reportes/inventario-farmacia'),
      apiRequest('/reportes/historial-consultas')
    ]);

    renderReportChart('reportes-consultas', consultas, 'Consultas');
    renderReportChart('reportes-facturacion', facturacion, 'Facturacion');
    renderOcupacionCamas(ocupacion || []);
    renderInventarioFarmacia(inventario || []);
    renderHistorialConsultas(historial || []);
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

function renderOcupacionCamas(rows) {
  const tbody = document.querySelector('#reportes-camas-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.cama}</td>
      <td>${row.nombre_paciente} ${row.apellido_paciente || ''}</td>
      <td>${row.nombre_medico} ${row.apellido_medico || ''}</td>
      <td>${new Date(row.fecha_ingreso).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderInventarioFarmacia(rows) {
  const tbody = document.querySelector('#reportes-inventario-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    const nombre = row.nombre_comercial || row.nombre_generico;
    tr.innerHTML = `
      <td>${nombre}</td>
      <td>${row.presentacion}</td>
      <td>${row.stock}</td>
      <td>${row.precio_unitario}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderHistorialConsultas(rows) {
  const tbody = document.querySelector('#reportes-historial-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(row.fecha_hora).toLocaleString()}</td>
      <td>${row.nombre_paciente} ${row.apellido_paciente || ''}</td>
      <td>${row.nombre_medico} ${row.apellido_medico || ''}</td>
      <td>${row.estado}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderReportChart(elementId, data, label) {
  const ctx = document.getElementById(elementId);
  if (!ctx) return;

  const labels = data.map((item) => `${item.mes}/${item.anio}`);
  const values = data.map((item) => Number(item.total || item.total_cobrado || 0));

  if (state.reportes[elementId]) {
    state.reportes[elementId].destroy();
  }

  state.reportes[elementId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: '#b94a2c',
        backgroundColor: 'rgba(185,74,44,0.2)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } }
    }
  });
}

function hydrateSession() {
  const token = sessionStorage.getItem('sigeh_token') || localStorage.getItem('sigeh_token');
  if (!token) {
    showLogin();
    return;
  }

  setAuth(token);
  if (localStorage.getItem('sigeh_token')) {
    localStorage.removeItem('sigeh_token');
  }
  if (!requireAuth()) {
    return;
  }

  userRole.textContent = state.payload.role || '';
  userInfo.textContent = state.payload.username || '';
  buildMenu(state.payload.role);
  showApp();
  setView('dashboard', 'Dashboard');
  drawDashboardChart();
  loadEstadosConsulta();
  if (state.payload.role === 'ADMIN' || state.payload.role === 'USUARIO_GENERAL') {
    loadMedicosCatalog();
    loadFacturacionCatalogs();
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
}

loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', logout);

const pacienteForm = document.getElementById('paciente-form');
const pacienteBuscarBtn = document.getElementById('paciente-buscar');
pacienteForm.addEventListener('submit', handlePacienteCreate);
pacienteBuscarBtn.addEventListener('click', handlePacienteBuscar);
pacienteEditForm.addEventListener('submit', handlePacienteUpdate);

if (pacienteEditCancel) {
  pacienteEditCancel.addEventListener('click', hidePacienteEditForm);
}

const medicoForm = document.getElementById('medico-form');
const medicoBuscarBtn = document.getElementById('medico-buscar');
medicoForm.addEventListener('submit', handleMedicoCreate);
medicoBuscarBtn.addEventListener('click', handleMedicoBuscar);
medicoEditForm.addEventListener('submit', handleMedicoUpdate);

const medicoBuscarInput = document.getElementById('medico-id-buscar');
if (medicoBuscarInput) {
  medicoBuscarInput.addEventListener('input', () => {
    if (medicoSearchTimer) {
      clearTimeout(medicoSearchTimer);
    }
    medicoSearchTimer = setTimeout(() => {
      handleMedicoBuscar();
    }, 250);
  });
}

if (medicoEditCancel) {
  medicoEditCancel.addEventListener('click', hideMedicoEditForm);
}

const consultaForm = document.getElementById('consulta-form');
consultaForm.addEventListener('submit', handleConsultaCreate);

const expSearchBtn = document.getElementById('exp-search-btn');
const expAntecedentesForm = document.getElementById('exp-antecedentes-form');
const expTabFicha = document.getElementById('exp-tab-ficha');
const expTabAntecedentes = document.getElementById('exp-tab-antecedentes');
const expTabHistorial = document.getElementById('exp-tab-historial');

if (expSearchBtn) {
  expSearchBtn.addEventListener('click', handleExpedienteBuscar);
}
if (expAntecedentesForm) {
  expAntecedentesForm.addEventListener('submit', handleAntecedentesGuardar);
}
if (expTabFicha) {
  expTabFicha.addEventListener('click', () => setExpedienteTab('ficha'));
}
if (expTabAntecedentes) {
  expTabAntecedentes.addEventListener('click', () => setExpedienteTab('antecedentes'));
}
if (expTabHistorial) {
  expTabHistorial.addEventListener('click', () => setExpedienteTab('historial'));
}

const usuarioForm = document.getElementById('usuario-form');
const usuarioBuscarBtn = document.getElementById('usuario-buscar');
if (usuarioForm) {
  usuarioForm.addEventListener('submit', handleUsuarioCreate);
}
if (usuarioBuscarBtn) {
  usuarioBuscarBtn.addEventListener('click', handleUsuarioBuscar);
}
if (usuarioEditForm) {
  usuarioEditForm.addEventListener('submit', handleUsuarioUpdate);
}
if (usuarioEditCancel) {
  usuarioEditCancel.addEventListener('click', hideUsuarioEditForm);
}

if (usuarioRolSelect) {
  usuarioRolSelect.addEventListener('change', (event) => {
    toggleUsuarioMedicoField(event.target.value, false);
  });
}

if (usuarioRolEditSelect) {
  usuarioRolEditSelect.addEventListener('change', (event) => {
    toggleUsuarioMedicoField(event.target.value, true);
  });
}

if (facturacionSubtotalInput) {
  facturacionSubtotalInput.addEventListener('input', updateFacturacionImportes);
}

if (facturacionPacienteInput) {
  facturacionPacienteInput.addEventListener('focus', () => {
    if ((facturacionPacienteInput.value || '').trim().length >= 2) {
      searchFacturacionPacientes(facturacionPacienteInput.value);
    }
  });
  facturacionPacienteInput.addEventListener('input', () => {
    if (facturacionPacienteSearchTimer) {
      clearTimeout(facturacionPacienteSearchTimer);
    }
    facturacionPacienteSearchTimer = setTimeout(() => {
      searchFacturacionPacientes(facturacionPacienteInput.value);
    }, 250);
  });
  facturacionPacienteInput.addEventListener('change', () => {
    const id = parseFacturacionPacienteId(facturacionPacienteInput.value);
    if (Number.isNaN(id)) {
      searchFacturacionPacientes(facturacionPacienteInput.value);
      return;
    }

    const seleccionado = facturacionPacientesCache.find((row) => Number(row.id_paciente) === id);
    if (seleccionado) {
      facturacionPacienteInput.value = getFacturacionPacienteLabel(seleccionado);
    }
    renderFacturacionPacienteResults(facturacionPacientesCache);
  });
}

if (consultaPacienteInput) {
  consultaPacienteInput.addEventListener('focus', () => {
    if ((consultaPacienteInput.value || '').trim().length >= 1) {
      searchConsultaPacientes(consultaPacienteInput.value);
    }
  });
  consultaPacienteInput.addEventListener('input', () => {
    if (consultaPacienteSearchTimer) {
      clearTimeout(consultaPacienteSearchTimer);
    }
    consultaPacienteSearchTimer = setTimeout(() => {
      searchConsultaPacientes(consultaPacienteInput.value);
    }, 250);
  });
}

if (consultaMedicoInput) {
  consultaMedicoInput.addEventListener('focus', () => {
    if ((consultaMedicoInput.value || '').trim().length >= 1) {
      searchConsultaMedicos(consultaMedicoInput.value);
    }
  });
  consultaMedicoInput.addEventListener('input', () => {
    if (consultaMedicoSearchTimer) {
      clearTimeout(consultaMedicoSearchTimer);
    }
    consultaMedicoSearchTimer = setTimeout(() => {
      searchConsultaMedicos(consultaMedicoInput.value);
    }, 250);
  });
}

if (pacienteNombreInput) {
  pacienteNombreInput.addEventListener('input', generateCurpPreview);
}
if (pacienteApellidoPaternoInput) {
  pacienteApellidoPaternoInput.addEventListener('input', generateCurpPreview);
}
if (pacienteApellidoMaternoInput) {
  pacienteApellidoMaternoInput.addEventListener('input', generateCurpPreview);
}
if (pacienteFechaInput) {
  pacienteFechaInput.addEventListener('change', generateCurpPreview);
}

if (facturacionPacienteResults) {
  facturacionPacienteResults.addEventListener('mousedown', (event) => {
    event.preventDefault();
  });
}

const auditoriaBtn = document.getElementById('auditoria-cargar');
if (auditoriaBtn) {
  auditoriaBtn.addEventListener('click', loadAuditoria);
}

const auditoriaTabAccesos = document.getElementById('auditoria-tab-accesos');
const auditoriaTabCambios = document.getElementById('auditoria-tab-cambios');
const auditoriaTabRespaldos = document.getElementById('auditoria-tab-respaldos');
const auditoriaTabMonitoreo = document.getElementById('auditoria-tab-monitoreo');
if (auditoriaTabAccesos) {
  auditoriaTabAccesos.addEventListener('click', () => setAuditoriaTab('accesos'));
}
if (auditoriaTabCambios) {
  auditoriaTabCambios.addEventListener('click', () => setAuditoriaTab('cambios'));
}
if (auditoriaTabRespaldos) {
  auditoriaTabRespaldos.addEventListener('click', () => setAuditoriaTab('respaldos'));
}
if (auditoriaTabMonitoreo) {
  auditoriaTabMonitoreo.addEventListener('click', () => {
    setAuditoriaTab('monitoreo');
    loadInfraMonitor();
  });
}

const auditoriaMonitorBtn = document.getElementById('auditoria-monitor-cargar');
if (auditoriaMonitorBtn) {
  auditoriaMonitorBtn.addEventListener('click', loadInfraMonitor);
}

const respaldoForm = document.getElementById('respaldo-form');
if (respaldoForm) {
  respaldoForm.addEventListener('submit', handleRespaldoCreate);
}

const facturacionForm = document.getElementById('facturacion-form');
if (facturacionForm) {
  facturacionForm.addEventListener('submit', handleFacturacion);
}

const agendaMedicoRefresh = document.getElementById('agenda-medico-refresh');
if (agendaMedicoRefresh) {
  agendaMedicoRefresh.addEventListener('click', loadAgendaMedico);
}

const atencionForm = document.getElementById('atencion-form');
if (atencionForm) {
  atencionForm.addEventListener('submit', handleAtencionSubmit);
}

const atencionCancel = document.getElementById('atencion-cancel');
if (atencionCancel) {
  atencionCancel.addEventListener('click', () => {
    consultaActivaId = null;
    const resumen = document.getElementById('atencion-resumen');
    if (resumen) {
      resumen.textContent = 'Selecciona una consulta desde la agenda.';
    }
    setView('agendaMedico', 'Mi agenda');
  });
}

const recetaForm = document.getElementById('receta-form');
if (recetaForm) {
  recetaForm.addEventListener('submit', handleRecetaAgregar);
}

const recetaGuardar = document.getElementById('receta-guardar');
if (recetaGuardar) {
  recetaGuardar.addEventListener('click', handleRecetaGuardar);
}

const laboratorioForm = document.getElementById('laboratorio-form');
if (laboratorioForm) {
  laboratorioForm.addEventListener('submit', handleLaboratorioSubmit);
}

const hospitalizacionesRefresh = document.getElementById('hospitalizaciones-refresh');
if (hospitalizacionesRefresh) {
  hospitalizacionesRefresh.addEventListener('click', loadHospitalizaciones);
}

const hospitalizacionForm = document.getElementById('hospitalizacion-form');
if (hospitalizacionForm) {
  hospitalizacionForm.addEventListener('submit', handleHospitalizacionCreate);
}

hydrateSession();

populateTipoSangreSelect('pac-tipo', true);
populateTipoSangreSelect('pac-edit-tipo', false);
