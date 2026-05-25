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
      await client.query(
        'CALL generar_factura_consulta($1, $2, $3, $4)',
        [id_paciente, folio, subtotal, iva]
      );

      const factura = await client.query(
        `SELECT id_factura
         FROM facturas
         WHERE folio = $1
         ORDER BY id_factura DESC
         LIMIT 1`,
        [folio]
      );

      if (factura.rowCount === 0) {
        throw new Error('Factura no encontrada tras su creacion');
      }

      const idFactura = factura.rows[0].id_factura;

      await client.query(
        'CALL registrar_pago_factura($1, $2, $3, $4)',
        [idFactura, metodo_pago, monto, req.user.id]
      );

      return { id_factura: idFactura };
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err.code === 'P0001' || err.code === '23505') {
      return res.status(409).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Error al registrar facturacion' });
  }
});

module.exports = router;
