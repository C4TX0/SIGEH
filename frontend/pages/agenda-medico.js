window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['agenda-medico'] = String.raw`        <section id="agenda-medico-view" class="view hidden">
          <div class="card">
            <h3>Mi agenda (hoy)</h3>
            <button id="agenda-medico-refresh" class="ghost">Actualizar</button>
            <table id="agenda-medico-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Motivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </section>`;

