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

