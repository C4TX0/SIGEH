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
