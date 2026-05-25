window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['expediente'] = String.raw`        <section id="expediente-view" class="view hidden">
          <div class="card">
            <h3>Buscador de expedientes</h3>
            <div class="toolbar">
              <input id="exp-search-input" placeholder="CURP, nombre o apellido" />
              <button id="exp-search-btn" class="ghost">Buscar</button>
            </div>
            <table id="exp-search-table" class="hidden">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Paciente</th>
                  <th>CURP</th>
                  <th>Tipo sangre</th>
                  <th>Alergias</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
            <div id="exp-search-empty" class="muted">Ingresa un criterio para buscar.</div>
          </div>

          <div id="expediente-detalle-card" class="card hidden">
            <h3>Detalle del expediente</h3>
            <div class="tabs">
              <button id="exp-tab-ficha" class="tab-button active">Ficha</button>
              <button id="exp-tab-antecedentes" class="tab-button">Antecedentes</button>
              <button id="exp-tab-historial" class="tab-button">Historial clinico</button>
            </div>

            <div id="exp-tab-panel-ficha" class="tab-panel">
              <div class="grid">
                <div>
                  <div><strong>Paciente:</strong> <span id="exp-nombre"></span></div>
                  <div><strong>Edad:</strong> <span id="exp-edad"></span></div>
                  <div><strong>CURP:</strong> <span id="exp-curp"></span></div>
                </div>
                <div>
                  <div><strong>Tipo sangre:</strong> <span id="exp-tipo-sangre"></span></div>
                  <div><strong>Alergias:</strong> <span id="exp-alergias"></span></div>
                </div>
              </div>
            </div>

            <div id="exp-tab-panel-antecedentes" class="tab-panel hidden">
              <form id="exp-antecedentes-form">
                <label>Alergias<textarea id="exp-alergias-edit"></textarea></label>
                <label>Antecedentes personales<textarea id="exp-antecedentes-personales"></textarea></label>
                <label>Antecedentes heredo-familiares<textarea id="exp-antecedentes-heredo"></textarea></label>
                <label>Antecedentes quirurgicos<textarea id="exp-antecedentes-quirurgicos"></textarea></label>
                <button type="submit" id="exp-antecedentes-guardar" class="primary">Guardar cambios</button>
              </form>
            </div>

            <div id="exp-tab-panel-historial" class="tab-panel hidden">
              <div id="exp-historial" class="timeline"></div>
            </div>
          </div>
          <div id="expediente-permiso" class="card hidden">
            <h3>Detalle del expediente</h3>
            <p class="muted">Solo el personal medico puede ver contenido clinico.</p>
          </div>
        </section>`;

