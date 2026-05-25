window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['reportes'] = String.raw`        <section id="reportes-view" class="view hidden">
          <div class="grid">
            <div class="card">
              <h3>Consultas por mes</h3>
              <canvas id="reportes-consultas" height="120"></canvas>
            </div>
            <div class="card">
              <h3>Facturacion mensual</h3>
              <canvas id="reportes-facturacion" height="120"></canvas>
            </div>
            <div class="card">
              <h3>Ocupacion de camas</h3>
              <div class="table-container">
                <table id="reportes-camas-table">
                  <thead>
                    <tr>
                      <th>Cama</th>
                      <th>Paciente</th>
                      <th>Medico</th>
                      <th>Ingreso</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
            <div class="card">
              <h3>Inventario farmacia</h3>
              <div class="table-container">
                <table id="reportes-inventario-table">
                  <thead>
                    <tr>
                      <th>Medicamento</th>
                      <th>Presentacion</th>
                      <th>Stock</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
            <div class="card">
              <h3>Historial de consultas (reciente)</h3>
              <div class="table-container">
                <table id="reportes-historial-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Paciente</th>
                      <th>Medico</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
        </section>`;

