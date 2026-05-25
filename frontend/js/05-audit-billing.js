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

