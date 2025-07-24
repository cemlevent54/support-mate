import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { userApproveOrRejectTask } from "../../api/taskApi";

const FeedbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const taskId = params.get("taskId");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // JWT kontrolü ve yönlendirme
  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      navigate(`/login?redirect=/feedback?taskId=${taskId}`, { replace: true });
    }
  }, [navigate, taskId]);

  const handleFeedback = async (feedbackStatus) => {
    setLoading(true);
    try {
      const jwt = localStorage.getItem("jwt");
      const response = await userApproveOrRejectTask(taskId, feedbackStatus, jwt);
      setStatus(feedbackStatus);
      setMessage(response.data.message || "İşlem başarılı!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Bir hata oluştu.");
    }
    setLoading(false);
  };

  if (!taskId) {
    return <div>Geçersiz bağlantı.</div>;
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 32, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
      <h2>Görev Çözüm Geri Bildirimi</h2>
      <p>Bu görevin çözüldüğünü düşünüyor musunuz?</p>
      <div style={{ display: "flex", gap: 16, margin: "24px 0" }}>
        <button
          onClick={() => handleFeedback("APPROVED")}
          disabled={loading || status === "APPROVED"}
          style={{ padding: "12px 24px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600 }}
        >
          Evet, Çözüldü
        </button>
        <button
          onClick={() => handleFeedback("REJECTED")}
          disabled={loading || status === "REJECTED"}
          style={{ padding: "12px 24px", background: "#d32f2f", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600 }}
        >
          Hayır, Çözülmedi
        </button>
      </div>
      {message && <div style={{ marginTop: 16, color: status === "APPROVED" ? "#1976d2" : "#d32f2f" }}>{message}</div>}
    </div>
  );
};

export default FeedbackPage; 