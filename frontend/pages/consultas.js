window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['consultas'] = String.raw`        <section id="consultas-view" class="view hidden">
          <div class="card">
            <h3>Nueva consulta</h3>
            <form id="consulta-form">
              <div class="form-row">
                <label>Paciente
                  <input id="con-paciente" placeholder="Busca por id, nombre o CURP" autocomplete="off" required />
                  <div id="con-paciente-results" class="search-results"></div>
                </label>
                <label>Medico
                  <input id="con-medico" placeholder="Busca por id o nombre" autocomplete="off" required />
                  <div id="con-medico-results" class="search-results"></div>
                </label>
                <label>Estado
                  <select id="con-estado" required>
                    <option value="">Selecciona</option>
                  </select>
                </label>
                <label>Fecha y hora<input id="con-fecha" type="datetime-local" required /></label>
              </div>
              <label>Motivo<textarea id="con-motivo" required></textarea></label>
              <button type="submit" class="primary">Registrar</button>
            </form>
          </div>
        </section>`;

