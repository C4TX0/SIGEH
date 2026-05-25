const express = require('express');
const { randomUUID } = require('crypto');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { withRoleTransaction } = require('../config/db');

const router = express.Router();

const IVA_RATE = 0.16;
const METODOS_PAGO = ['Efectivo', 'Tarjeta De Debito', 'Tarjeta de Credito'];

function generarFolioFactura() {
  return `FAC-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

router.get('/metodos-pago', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), async (req, res) => {
  return res.status(200).json(METODOS_PAGO);
});

router.post('/pago', auth, authorize(['ADMIN', 'USUARIO_GENERAL']), async (req, res) => {
  const { id_paciente, subtotal, metodo_pago, monto } = req.body || {};
  const idPacienteValue = Number(id_paciente);
  const subtotalValue = Number(subtotal);
  const montoValue = Number(monto);
  const metodoPagoValue = typeof metodo_pago === 'string' ? metodo_pago.trim() : '';
  const folio = generarFolioFactura();
  const iva = Number((subtotalValue * IVA_RATE).toFixed(2));

  if (!Number.isInteger(idPacienteValue) || idPacienteValue <= 0 || Number.isNaN(subtotalValue) || !metodoPagoValue || Number.isNaN(montoValue)) {
    return res.status(400).json({ message: 'Datos requeridos incompletos' });
  }

  if (subtotalValue <= 0 || montoValue <= 0) {
    return res.status(400).json({ message: 'Montos invalidos' });
  }

  if (!METODOS_PAGO.includes(metodoPagoValue)) {
    return res.status(400).json({ message: 'Metodo de pago invalido' });
  }

  try {
    const result = await withRoleTransaction(req.user.dbRole, async (client) => {
      await client.query(
        'CALL generar_factura_consulta($1, $2, $3, $4)',
        [idPacienteValue, folio, subtotalValue, iva]
      );

      const factura = await client.query(
        `SELECT id_factura, folio, subtotal, iva, total
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
        [idFactura, metodoPagoValue, montoValue, req.user.id]
      );

      return {
        id_factura: idFactura,
        folio: factura.rows[0].folio,
        subtotal: factura.rows[0].subtotal,
        iva: factura.rows[0].iva,
        total: factura.rows[0].total
      };
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
