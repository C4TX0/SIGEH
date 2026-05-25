window.SIGEH_PAGES = window.SIGEH_PAGES || {};
window.SIGEH_PAGES['login'] = String.raw`    <section id="login-view" class="view">
      <div class="login-card">
        <h1>SIGEH</h1>
        <p class="muted">Ingreso al sistema</p>
        <form id="login-form">
          <label>
            Usuario
            <input type="text" id="login-username" autocomplete="username" required />
          </label>
          <label>
            Contrasena
            <input type="password" id="login-password" autocomplete="current-password" required />
          </label>
          <button type="submit" class="primary">Entrar</button>
        </form>
        <div id="login-error" class="error"></div>
      </div>
    </section>`;

