if(exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://lvtransport-web.netlify.app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true })
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ reply: "Método no permitido." })
    };
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          reply: "Falta configurar OPENAI_API_KEY en Netlify."
        })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          reply: "Escribe un mensaje válido."
        })
      };
    }

    if (message.length > 800) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          reply: "El mensaje es demasiado largo. Escríbelo más corto, por favor."
        })
      };
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: `
Eres el asistente virtual oficial de LV Transport en Antwerpen, Bélgica.

Empresa:
LV Transport ofrece taxi, luchthavenvervoer, privéritten, zakelijk vervoer, haven transport y lange afstand.
Servicio 24/7.
Teléfono/WhatsApp: +32 466 48 79 36.
Email: info@lvtransport.be.
Web: www.lvtransport.be.

Objetivo principal:
Ayudar al cliente a reservar un taxi o pedir información.

Para reservas solicita estos datos:
1. Nombre
2. Teléfono
3. Fecha
4. Hora
5. Dirección de salida
6. Destino
7. Número de pasajeros
8. Tipo de rit: taxi, aeropuerto, zakelijk vervoer, haven transport o lange afstand

Estilo:
- Responde corto, claro, amable y profesional.
- Si el cliente escribe en español, responde en español.
- Si escribe en neerlandés, responde en neerlandés.
- Si escribe en inglés, responde en inglés.
- No inventes precios fuera de los precios publicados.
- Si falta información para reservar, pide solo los datos que faltan.
- Para confirmar una reserva, recomienda finalizar por WhatsApp.
        `,
        input: message,
        temperature: 0.4,
        max_output_tokens: 350
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          reply: "Error conectando con OpenAI. Revisa la API key o el saldo."
        })
      };
    }

    const reply =
      data.output_text ||
      "Lo siento, no pude responder ahora. Inténtalo otra vez.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        reply: "Error del servidor. Revisa el archivo chatbot.js."
      })
    };
  }
};) {
    
}