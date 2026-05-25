window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['hospitalizaciones'] = String.raw`        <section id="hospitalizaciones-view" class="view hidden">
          <div class="grid">
            <div class="card">
              <h3>Pacientes hospitalizados</h3>
              <button id="hospitalizaciones-refresh" class="ghost">Actualizar</button>
              <table id="hospitalizaciones-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Cama</th>
                    <th>Ingreso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
            <div class="card">
              <h3>Registrar ingreso</h3>
              <form id="hospitalizacion-form">
                <div class="form-row">
                  <label>Paciente (id)<input id="hosp-paciente" type="number" min="1" required /></label>
                  <label>Cama<input id="hosp-cama" required /></label>
                </div>
                <label>Diagnostico ingreso<textarea id="hosp-diag-ingreso" required></textarea></label>
                <button type="submit" class="primary">Registrar ingreso</button>
              </form>
            </div>
          </div>
        </section>`;

