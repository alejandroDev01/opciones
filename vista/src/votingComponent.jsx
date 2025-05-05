import { useState, useEffect } from "react";

const VotingComponent = () => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [publicIp, setPublicIp] = useState(null);

  // Obtener la IP pública al cargar el componente
  useEffect(() => {
    const fetchPublicIp = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        setPublicIp(data.ip);
        console.log("IP Pública:", data.ip);
      } catch (err) {
        console.error("Error al obtener la IP pública:", err);
      }
    };

    fetchPublicIp();
  }, []);

  // Valores fijos
  const formData = {
    pais: "Bolivia",
    ciudad: "Cochabamba",
    candidato: "Manfred Reyes Villa",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const params = new URLSearchParams();
      params.append("pais", formData.pais);
      params.append("ciudad", formData.ciudad);
      params.append("candidato", formData.candidato.replace(/ /g, "+"));

      // Log de lo que se enviará
      console.log("Enviando solicitud con los siguientes datos:");
      console.log(
        "URL:",
        "https://segunda-votacion-daebgzdjhfc5fjbd.centralus-01.azurewebsites.net/enviar_voto_modificado_final"
      );
      console.log("Método:", "POST");
      console.log("Encabezados:", {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Forwarded-For": publicIp || "No disponible",
      });
      console.log("Cuerpo:", params.toString());

      const result = await fetch(
        "https://segunda-votacion-daebgzdjhfc5fjbd.centralus-01.azurewebsites.net/enviar_voto_modificado_final",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Forwarded-For": publicIp || "No disponible", // Agregar la IP pública
          },
          body: params.toString(),
        }
      );

      // Log de la respuesta
      console.log("Estado de la respuesta:", result.status);
      console.log("Encabezados de la respuesta:", result.headers);

      const data = await result.text(); // Leer la respuesta como texto (HTML)
      console.log("Cuerpo de la respuesta (HTML):", data);

      setResponse(data);
    } catch (err) {
      console.error("Error al enviar la solicitud:", err);
      setError("Error al enviar el voto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="voting-container">
      <h1>2da Votación Primaria Bolivia 2025</h1>
      <h1>{publicIp}</h1>

      <div className="voting-description">
        <p>
          Participa en la 2da votación primaria y elige al candidato único de
          oposición, que nos representará en las elecciones 2025. Tu voz cuenta,
          tu voto decide el futuro de Bolivia.
        </p>
        <p className="voting-warning">
          Un celular un voto, si usted de su celular o su computador vota más de
          una vez, todos sus votos serán anulados.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="voting-form">
        <div className="form-group">
          <label>País:</label>
          <input
            type="text"
            value={formData.pais}
            readOnly
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Ciudad:</label>
          <input
            type="text"
            value={formData.ciudad}
            readOnly
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label>Candidato:</label>
          <input
            type="text"
            value={formData.candidato}
            readOnly
            className="form-control"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? "Enviando voto..." : "Enviar Voto"}
        </button>
      </form>

      {/* Mostrar resultados */}
      {loading && <p>Enviando tu voto, por favor espera...</p>}
      {error && <p className="error-message">{error}</p>}
      {response && (
        <div className="response-container">
          <h3>Respuesta del servidor:</h3>
          <pre>{response}</pre>
        </div>
      )}
    </div>
  );
};

export default VotingComponent;
