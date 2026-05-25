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

