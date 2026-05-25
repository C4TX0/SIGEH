window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['auditoria'] = String.raw`        <section id="auditoria-view" class="view hidden">
          <div class="card">
            <h3>Auditoria</h3>
            <div class="tabs">
              <button id="auditoria-tab-accesos" class="tab-button active">Inicios de sesion</button>
              <button id="auditoria-tab-cambios" class="tab-button">Cambios</button>
              <button id="auditoria-tab-respaldos" class="tab-button">Respaldos</button>
              <button id="auditoria-tab-monitoreo" class="tab-button">Monitoreo</button>
              <button id="auditoria-cargar" class="ghost">Actualizar</button>
            </div>
            <div id="auditoria-accesos" class="table-container">
              <table id="auditoria-accesos-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>IP</th>
                    <th>Fecha</th>
                    <th>Evento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
            <div id="auditoria-cambios" class="table-container hidden">
              <table id="auditoria-cambios-table">
                <thead>
                  <tr>
                    <th>Tabla</th>
                    <th>Campo</th>
                    <th>Antes</th>
                    <th>Despues</th>
                    <th>Operacion</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
            <div id="auditoria-respaldos" class="hidden">
              <form id="respaldo-form">
                <div class="form-row">
                  <label>Tipo
                    <select id="respaldo-tipo" required>
                      <option value="">Selecciona</option>
                      <option value="completo">completo</option>
                    </select>
                  </label>
                  <label>Directorio salida (opcional)<input id="respaldo-directorio" placeholder="./backups" /></label>
                </div>
                <button type="submit" class="primary">Generar respaldo real</button>
              </form>
              <div class="table-container">
                <table id="auditoria-respaldos-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Ruta</th>
                      <th>Estado</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Tamano MB</th>
                      <th>Archivo existe</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
            <div id="auditoria-monitoreo" class="hidden">
              <div class="form-actions" style="margin-bottom: 12px;">
                <button type="button" id="auditoria-monitor-cargar" class="ghost">Cargar estado servidor</button>
              </div>
              <div class="grid">
                <div class="card">
                  <h3>Overview servidor</h3>
                  <pre id="monitor-overview-output" class="muted">Sin datos</pre>
                </div>
                <div class="card">
                  <h3>Estado de continuidad</h3>
                  <pre id="monitor-replica-output" class="muted">Sin datos</pre>
                </div>
              </div>
            </div>
          </div>
        </section>`;

