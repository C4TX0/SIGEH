window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['medicos'] = String.raw`        <section id="medicos-view" class="view hidden">
          <div class="grid">
            <div class="card">
              <h3>Alta de medico</h3>
              <form id="medico-form">
                <div class="form-row">
                  <label>Nombre<input id="med-nombre" required /></label>
                  <label>Apellido paterno<input id="med-apellido-paterno" required /></label>
                  <label>Apellido materno<input id="med-apellido-materno" /></label>
                </div>
                <div class="form-row">
                  <label>Cedula<input id="med-cedula" maxlength="10" required /></label>
                  <label>Especialidad
                    <select id="med-especialidad" required>
                      <option value="">Selecciona</option>
                    </select>
                  </label>
                  <label>Telefono<input id="med-telefono" /></label>
                </div>
                <div class="form-row">
                  <label>Correo<input id="med-correo" type="email" /></label>
                </div>
                <button type="submit" class="primary">Guardar</button>
              </form>
            </div>
            <div class="card">
              <h3>Consulta de medicos</h3>
              <div class="toolbar">
                <input id="medico-id-buscar" type="text" placeholder="Busca por id o nombre" autocomplete="off" />
                <button id="medico-buscar" class="ghost">Buscar</button>
              </div>
              <table id="medicos-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Nombre</th>
                    <th>Cedula</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
            <div id="medico-edit-card" class="card hidden">
            <h3>Editar medico</h3>
            <form id="medico-edit-form">
              <div class="form-row">
                <label>Id<input id="med-edit-id" type="number" min="1" required readonly /></label>
                <label>Nombre<input id="med-edit-nombre" /></label>
                <label>Apellido paterno<input id="med-edit-apellido-paterno" /></label>
                <label>Cedula<input id="med-edit-cedula" maxlength="10" /></label>
              </div>
              <div class="form-row">
                <label>Especialidad
                  <select id="med-edit-especialidad">
                    <option value="">Sin cambio</option>
                  </select>
                </label>
                <label>Telefono<input id="med-edit-telefono" /></label>
                <label>Correo<input id="med-edit-correo" type="email" /></label>
                <label>Activo
                  <select id="med-edit-activo">
                    <option value="">Sin cambio</option>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>
              </div>
              <div class="form-actions">
                <button type="submit" class="primary">Actualizar</button>
                <button type="button" id="medico-edit-cancel" class="ghost">Cancelar</button>
              </div>
            </form>
          </div>
        </section>`;

