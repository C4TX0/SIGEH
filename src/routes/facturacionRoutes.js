const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { withRoleTransaction } = require('../config/db');

const router = express.Router();

router.post('/pago', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), async (req, res) => {
  const { id_paciente, folio, subtotal, iva, metodo_pago, monto } = req.body || {};

  if (!id_paciente || !folio || subtotal === undefined || iva === undefined || !metodo_pago || !monto) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  if (Number(subtotal) < 0 || Number(iva) < 0 || Number(monto) <= 0) {
    return res.status(400).json({ message: 'Montos invalidos' });
  }

  try {
    const result = await withRoleTransaction(req.user.dbRole, async (client) => {
      const total = Number(subtotal) + Number(iva);
      const factura = await client.query(
        `INSERT INTO facturas (id_paciente, folio, subtotal, iva, total, estado)
         VALUES ($1, $2, $3, $4, $5, 'Pendiente')
         RETURNING id_factura`,
        [id_paciente, folio, subtotal, iva, total]
      );

      const idFactura = factura.rows[0].id_factura;

      await client.query(
        `INSERT INTO pagos (id_factura, metodo_pago, monto, id_usuario)
         VALUES ($1, $2, $3, $4)`,
        [idFactura, metodo_pago, monto, req.user.id]
      );

      await client.query(
        `UPDATE facturas
         SET estado = 'Pagada', fecha_pago = NOW()
         WHERE id_factura = $1`,
        [idFactura]
      );

      return { id_factura: idFactura };
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Error al registrar facturacion' });
  }
});

module.exports = router;
