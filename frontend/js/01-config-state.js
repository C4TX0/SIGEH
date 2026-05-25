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
