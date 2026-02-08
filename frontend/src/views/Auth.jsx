import React, { useState } from "react";
import { Form, Button, Container, Card, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/dataService";

export const Login = ({ setAuth }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login({ username, password });
      setAuth(true);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Kirjautuminen epäonnistui. Tarkista käyttäjätunnus ja salasana.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "70vh" }}
    >
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card className="shadow border-0">
          <Card.Body className="p-4">
            <h2 className="text-center mb-4">Kirjaudu sisään</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group id="username" className="mb-3">
                <Form.Label>Käyttäjätunnus</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="Käyttäjätunnus"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </Form.Group>
              <Form.Group id="password" className="mb-4">
                <Form.Label>Salasana</Form.Label>
                <Form.Control
                  type="password"
                  required
                  placeholder="Salasana"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </Form.Group>
              <Button
                className="w-100 btn-lg btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Kirjaudu"
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-3">
          Tarvitsetko tunnukset? <Link to="/signup">Rekisteröidy</Link>
        </div>
      </div>
    </Container>
  );
};

export const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Salasanat eivät täsmää");
      return;
    }

    setLoading(true);
    try {
      await authService.signup({ username, password });
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        "Rekisteröityminen epäonnistui. Käyttäjätunnus saattaa olla varattu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "70vh" }}
    >
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card className="shadow border-0">
          <Card.Body className="p-4">
            <h2 className="text-center mb-4">Rekisteröidy</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group id="username" className="mb-3">
                <Form.Label>Käyttäjätunnus</Form.Label>
                <Form.Control
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </Form.Group>
              <Form.Group id="password" className="mb-3">
                <Form.Label>Salasana</Form.Label>
                <Form.Control
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </Form.Group>
              <Form.Group id="password-confirm" className="mb-4">
                <Form.Label>Salasanan vahvistus</Form.Label>
                <Form.Control
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </Form.Group>
              <Button
                className="w-100 btn-lg btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Rekisteröidy"
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-3">
          Onko sinulla jo tili? <Link to="/login">Kirjaudu sisään</Link>
        </div>
      </div>
    </Container>
  );
};
