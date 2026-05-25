window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['pacientes'] = String.raw`        <section id="pacientes-view" class="view hidden">
          <div class="grid">
            <div class="card">
              <h3>Alta de paciente</h3>
              <form id="paciente-form">
                <div class="form-row">
                  <label>Nombre<input id="pac-nombre" required /></label>
                  <label>Apellido paterno<input id="pac-apellido-paterno" required /></label>
                  <label>Apellido materno<input id="pac-apellido-materno" /></label>
                </div>
                <div class="form-row">
                  <label>Fecha nacimiento<input id="pac-fecha" type="date" required /></label>
                  <label>CURP<input id="pac-curp" maxlength="18" readonly /></label>
                  <label>Telefono<input id="pac-telefono" /></label>
                </div>
                <p class="muted">La CURP se genera automaticamente y solo se muestra para verificarla.</p>
                <div class="form-row">
                  <label>Correo<input id="pac-correo" type="email" /></label>
                  <label>Tipo sangre
                    <select id="pac-tipo">
                      <option value="">Selecciona</option>
                    </select>
                  </label>
                  <label>Alergias<input id="pac-alergias" /></label>
                </div>
                <button type="submit" class="primary">Guardar</button>
              </form>
            </div>
            <div class="card">
              <h3>Consulta de pacientes</h3>
              <div class="toolbar">
                <input id="paciente-id-buscar" type="number" min="1" placeholder="Id paciente" />
                <button id="paciente-buscar" class="ghost">Buscar</button>
              </div>
              <table id="pacientes-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Nombre</th>
                    <th>CURP</th>
                    <th>Telefono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
          <div id="paciente-edit-card" class="card hidden">
            <h3>Editar paciente</h3>
            <form id="paciente-edit-form">
              <div class="form-row">
                <label>Id<input id="pac-edit-id" type="number" min="1" required readonly /></label>
                <label>Nombre<input id="pac-edit-nombre" /></label>
                <label>Apellido paterno<input id="pac-edit-apellido-paterno" /></label>
                <label>CURP<input id="pac-edit-curp" maxlength="18" /></label>
              </div>
              <div class="form-row">
                <label>Telefono<input id="pac-edit-telefono" /></label>
                <label>Correo<input id="pac-edit-correo" type="email" /></label>
                <label>Tipo sangre
                  <select id="pac-edit-tipo">
                    <option value="">Sin cambio</option>
                  </select>
                </label>
                <label>Activo
                  <select id="pac-edit-activo">
                    <option value="">Sin cambio</option>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>
              </div>
              <div class="form-actions">
                <button type="submit" class="primary">Actualizar</button>
                <button type="button" id="paciente-edit-cancel" class="ghost">Cancelar</button>
              </div>
            </form>
          </div>
        </section>`;

