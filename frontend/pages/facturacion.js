window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['facturacion'] = String.raw`        <section id="facturacion-view" class="view hidden">
          <div class="card">
            <h3>Facturacion (transaccion)</h3>
            <form id="facturacion-form">
              <div class="form-row">
                <label>Paciente (id o nombre)
                  <input id="fac-paciente" placeholder="Busca por id o nombre" autocomplete="off" required />
                  <div id="fac-paciente-results" class="search-results"></div>
                </label>
                <label>Subtotal<input id="fac-subtotal" type="number" min="0" step="0.01" required /></label>
                <label>IVA<input id="fac-iva" type="number" min="0" step="0.01" readonly /></label>
              </div>
              <div class="form-row">
                <label>Metodo pago
                  <select id="fac-metodo" required>
                    <option value="">Selecciona un metodo</option>
                  </select>
                </label>
                <label>Monto<input id="fac-monto" type="number" min="0.01" step="0.01" required /></label>
              </div>
              <p class="muted">El folio se genera automaticamente al guardar la factura.</p>
              <button type="submit" class="primary">Guardar factura y pago</button>
            </form>
          </div>
        </section>`;

