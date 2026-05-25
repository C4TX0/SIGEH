window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['usuarios'] = String.raw`        <section id="usuarios-view" class="view hidden">
          <div class="grid">
            <div class="card">
              <h3>Crear usuario</h3>
              <form id="usuario-form">
                <div class="form-row">
                  <label>Username<input id="usr-username" required /></label>
                  <label>Password<input id="usr-password" type="password" required /></label>
                  <label>Rol
                    <select id="usr-rol" required>
                      <option value="">Selecciona</option>
                    </select>
                  </label>
                </div>
                <div class="form-row">
                  <label id="usr-medico-field" class="hidden">Medico
                    <select id="usr-medico">
                      <option value="">Selecciona</option>
                    </select>
                  </label>
                </div>
                <button type="submit" class="primary">Guardar</button>
              </form>
            </div>
            <div class="card">
              <h3>Consulta de usuarios</h3>
              <div class="toolbar">
                <input id="usuario-id-buscar" type="number" min="1" placeholder="Id usuario" />
                <button id="usuario-buscar" class="ghost">Buscar</button>
              </div>
              <table id="usuarios-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
          <div id="usuario-edit-card" class="card hidden">
            <h3>Editar usuario</h3>
            <form id="usuario-edit-form">
              <div class="form-row">
                <label>Id<input id="usr-edit-id" type="number" min="1" required readonly /></label>
                <label>Username<input id="usr-edit-username" /></label>
                <label>Password<input id="usr-edit-password" type="password" placeholder="(opcional)" /></label>
              </div>
              <div class="form-row">
                <label>Rol
                  <select id="usr-edit-rol">
                    <option value="">Sin cambio</option>
                  </select>
                </label>
                <label id="usr-edit-medico-field" class="hidden">Medico
                  <select id="usr-edit-medico">
                    <option value="">Sin cambio</option>
                  </select>
                </label>
                <label>Activo
                  <select id="usr-edit-activo">
                    <option value="">Sin cambio</option>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>
                <label>Bloqueado
                  <select id="usr-edit-bloqueado">
                    <option value="">Sin cambio</option>
                    <option value="true">Si</option>
                    <option value="false">No</option>
                  </select>
                </label>
              </div>
              <div class="form-actions">
                <button type="submit" class="primary">Actualizar</button>
                <button type="button" id="usuario-edit-cancel" class="ghost">Cancelar</button>
              </div>
            </form>
          </div>
        </section>`;

