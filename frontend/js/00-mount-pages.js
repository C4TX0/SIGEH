(function mountPages() {
  const pages = window.SIGEH_PAGES || {};
  const loginRoot = document.getElementById('login-root');
  const viewsRoot = document.getElementById('views-root');

  if (loginRoot) {
    loginRoot.innerHTML = pages.login || '';
  }

  if (viewsRoot) {
    const order = [
      'dashboard',
      'pacientes',
      'medicos',
      'consultas',
      'agenda-medico',
      'atencion',
      'hospitalizaciones',
      'expediente',
      'reportes',
      'usuarios',
      'auditoria',
      'facturacion'
    ];

    viewsRoot.innerHTML = order
      .map((name) => pages[name] || '')
      .join('\n');
  }
}());
