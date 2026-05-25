window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['atencion'] = String.raw`        <section id="atencion-view" class="view hidden">
          <div class="card">
            <h3>Sala de atencion</h3>
            <div id="atencion-resumen" class="muted">Selecciona una consulta desde la agenda.</div>
            <form id="atencion-form">
              <div class="form-row">
                <label>Sintomas<textarea id="atencion-sintomas" required></textarea></label>
                <label>Diagnostico<textarea id="atencion-diagnostico" required></textarea></label>
              </div>
              <div class="form-row">
                <label>Peso (kg)<input id="atencion-peso" type="number" step="0.1" /></label>
                <label>Talla (cm)<input id="atencion-talla" type="number" step="0.1" /></label>
                <label>Temperatura (C)<input id="atencion-temperatura" type="number" step="0.1" /></label>
                <label>Presion arterial<input id="atencion-presion" placeholder="120/80" /></label>
                <label>Frecuencia cardiaca<input id="atencion-frecuencia" type="number" step="1" /></label>
              </div>
              <label>Notas<textarea id="atencion-notas"></textarea></label>
              <div class="form-actions">
                <button type="submit" class="primary">Finalizar consulta</button>
                <button type="button" id="atencion-cancel" class="ghost">Volver a agenda</button>
              </div>
            </form>
          </div>
          <div class="grid">
            <div class="card">
              <h3>Recetas</h3>
              <form id="receta-form">
                <div class="form-row">
                  <label>Medicamento
                    <select id="receta-medicamento" required>
                      <option value="">Selecciona</option>
                    </select>
                  </label>
                  <label>Dosis<input id="receta-dosis" required /></label>
                  <label>Unidad dosis<input id="receta-unidad" required /></label>
                </div>
                <div class="form-row">
                  <label>Frecuencia<input id="receta-frecuencia" required /></label>
                  <label>Duracion (dias)<input id="receta-duracion" type="number" min="1" required /></label>
                </div>
                <label>Indicaciones<textarea id="receta-indicaciones"></textarea></label>
                <button type="submit" class="ghost">Agregar medicamento</button>
              </form>
              <table id="receta-detalle-table">
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Dosis</th>
                    <th>Frecuencia</th>
                    <th>Duracion</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
              <button id="receta-guardar" class="primary">Guardar receta</button>
            </div>
            <div class="card">
              <h3>Laboratorio</h3>
              <form id="laboratorio-form">
                <label>Estudio
                  <select id="laboratorio-estudio" required>
                    <option value="">Selecciona</option>
                  </select>
                </label>
                <label>Observaciones<textarea id="laboratorio-obs"></textarea></label>
                <button type="submit" class="primary">Solicitar estudio</button>
              </form>
            </div>
          </div>
        </section>`;

