// Función serverless de Vercel.
// Recibe los datos calculados en el navegador y los guarda en Airtable.
// El token de Airtable vive SOLO acá, como variable de entorno en Vercel —
// nunca viaja al navegador del usuario ni queda visible en el repo de GitHub.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_ID = process.env.AIRTABLE_TABLE_ID;

  if (!TOKEN || !BASE_ID || !TABLE_ID) {
    console.error("Faltan variables de entorno de Airtable en Vercel");
    return res.status(500).json({ error: "Configuración del servidor incompleta" });
  }

  try {
    const d = req.body;

    if (!d || !d.superficie || !d.provincia) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const fields = {
      obra: d.obra || "",
      fecha: d.fecha,
      superficie: d.superficie,
      provincia: d.provincia,
      eu_elec_total: d.euElecTotal,
      eu_gas_total: d.euGasTotal,
      ep_elec_total: d.elecPrimTotal,
      ep_gas_total: d.gasPrimTotal,
      ep_total: d.epTotal,
      indicador: d.indicador
    };

    (d.elec || []).forEach((v, i) => { fields[`elec_${i + 1}`] = v; });
    (d.gas_m3 || []).forEach((v, i) => { fields[`gas_${i + 1}`] = v; });

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields })
      }
    );

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      console.error("Error de Airtable:", data);
      return res.status(airtableRes.status).json({ error: "Error al guardar en Airtable" });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error("Error interno:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
