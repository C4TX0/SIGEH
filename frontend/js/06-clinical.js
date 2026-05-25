async function loadAgendaMedico() {
  try {
    const data = await apiRequest('/medico/agenda');
    const tbody = document.querySelector('#agenda-medico-table tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="muted">No hay consultas programadas para hoy.</td></tr>';
      return;
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
      tbody.innerHTML = '<tr><td colspan="4" class="muted">No hay hospitalizaciones activas.</td></tr>';
      return;
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

