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
    document.getElementById('paciente-form').reset();
    handlePacienteBuscar();
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
    handlePacienteBuscar();
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
    document.getElementById('medico-form').reset();
    handleMedicoBuscar();
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

  const requestSeq = ++medicoSearchSeq;
  tbody.innerHTML = '<tr><td colspan="4">Cargando medicos...</td></tr>';

  try {
    const data = term.length < 1
      ? await apiRequest('/medicos')
      : await apiRequest(`/catalogos/medicos/buscar?q=${encodeURIComponent(term)}`);
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
      row.querySelector('button').addEventListener('click', async () => {
        try {
          const fullData = await apiRequest(`/medicos/${rowData.id_medico}`);
          fillMedicoEditForm(fullData);
        } catch (err) {
          fillMedicoEditForm(rowData);
        }
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
    document.getElementById('usuario-form').reset();
    handleUsuarioBuscar();
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
    handleUsuarioBuscar();
  } catch (err) {
    Swal.fire('Error', err.message, 'error');
  }
}

