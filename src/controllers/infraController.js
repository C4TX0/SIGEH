const { getSystemOverview, getReplicationStatus } = require('../services/monitorService');

async function monitorOverview(req, res) {
  try {
    const data = await getSystemOverview();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Error al obtener monitoreo', detail: err.message });
  }
}

async function replicationStatus(req, res) {
  try {
    const data = await getReplicationStatus();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Error al obtener estado de replica', detail: err.message });
  }
}

module.exports = {
  monitorOverview,
  replicationStatus
};
