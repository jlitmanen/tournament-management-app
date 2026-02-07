import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Spinner,
  Modal,
  Table,
  Badge,
} from "react-bootstrap";
import {
  openService,
  matchService,
  playerService,
} from "../../services/dataService";

const MatchRow = ({ match, players, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Local state for editing
  const [editData, setEditData] = useState({
    player1: match.player1,
    player2: match.player2,
    wins1: match.wins1,
    wins2: match.wins2,
    game_date: match.game_date || "",
    result: match.result || "", // For the "6-0, 6-3" details
  });

  const handleSave = async () => {
    await onSave(match.id, editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="table-info">
        <td colSpan="5" className="p-3">
          <Row className="g-2 align-items-center">
            {/* Top Row: Player 1, Wins 1, Date */}
            <Col md={5}>
              <Form.Select
                size="sm"
                value={editData.player1}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    player1: parseInt(e.target.value),
                  })
                }
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                size="sm"
                type="number"
                placeholder="Wins"
                value={editData.wins1}
                onChange={(e) =>
                  setEditData({ ...editData, wins1: parseInt(e.target.value) })
                }
              />
            </Col>
            <Col md={5}>
              <Form.Control
                size="sm"
                type="date"
                value={editData.game_date}
                onChange={(e) =>
                  setEditData({ ...editData, game_date: e.target.value })
                }
              />
            </Col>

            {/* Bottom Row: Player 2, Wins 2, Result Details */}
            <Col md={5}>
              <Form.Select
                size="sm"
                value={editData.player2}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    player2: parseInt(e.target.value),
                  })
                }
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                size="sm"
                type="number"
                placeholder="Wins"
                value={editData.wins2}
                onChange={(e) =>
                  setEditData({ ...editData, wins2: parseInt(e.target.value) })
                }
              />
            </Col>
            <Col md={3}>
              <Form.Control
                size="sm"
                type="text"
                placeholder="Esim. 6-0, 6-3"
                value={editData.result}
                onChange={(e) =>
                  setEditData({ ...editData, result: e.target.value })
                }
              />
            </Col>

            {/* Actions */}
            <Col md={2} className="text-end">
              <Button
                variant="success"
                size="sm"
                onClick={handleSave}
                className="me-1"
              >
                Tallenna
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                X
              </Button>
            </Col>
          </Row>
        </td>
      </tr>
    );
  }

  // Normal View Mode
  return (
    <tr>
      <td className="text-muted small" style={{ width: "120px" }}>
        {match.game_date}
      </td>
      <td className="fw-bold">
        {match.homename} <br />
        <span className="text-secondary fw-normal">{match.awayname}</span>
      </td>
      <td>
        <Badge bg="dark">{match.wins1}</Badge> <br />
        <Badge bg="light" text="dark">
          {match.wins2}
        </Badge>
      </td>
      <td className="small text-muted" style={{ fontSize: "0.8rem" }}>
        {match.result?.split("\\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </td>
      <td className="text-end">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Muokkaa
        </Button>
      </td>
    </tr>
  );
};

// --- MAIN COMPONENT ---
const AdminOpens = () => {
  const [opens, setOpens] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedOpenId, setSelectedOpenId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    year: 2025,
    active: false,
    ended: false,
  });
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [tournamentGames, setTournamentGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  const years = [2024, 2025, 2026, 2027];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [o, p] = await Promise.all([
        openService.getAll(),
        playerService.getAll(),
      ]);
      setOpens(o || []);
      setPlayers(p || []);
    } catch (err) {
      setError("Datan haku epäonnistui.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectedOpenId(val);
    const selected = opens.find((o) => o.id.toString() === val);
    if (selected) {
      setFormData({
        ...selected,
        active: !!selected.active,
        ended: !!selected.ended,
      });
    } else {
      setFormData({
        id: "",
        name: "",
        year: 2025,
        active: false,
        ended: false,
      });
    }
  };

  const fetchTournamentGames = async () => {
    if (!selectedOpenId) return;
    setGamesLoading(true);
    try {
      const data = await openService.getMatches(selectedOpenId);

      // The JSON you showed has matches inside a "matches" key
      const gamesArray = data.matches || [];

      setTournamentGames(gamesArray);
    } catch (err) {
      console.error("Haku epäonnistui:", err);
      setTournamentGames([]);
    } finally {
      setGamesLoading(false);
    }
  };

  const handleSaveMatch = async (matchId, updatedData) => {
    try {
      await matchService.update(matchId, updatedData);
      fetchTournamentGames();
    } catch (err) {
      alert("Tallennus epäonnistui.");
    }
  };

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Turnausten hallinta</h2>
        </Col>
      </Row>

      <Row>
        <Col md={5}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <Form.Label className="fw-bold">Valitse turnaus</Form.Label>
              <Form.Select value={selectedOpenId} onChange={handleSelectChange}>
                <option value="">+ Luo uusi...</option>
                {opens.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.year} - {o.name}
                  </option>
                ))}
              </Form.Select>
              {selectedOpenId && (
                <Button
                  variant="primary"
                  className="w-100 mt-3"
                  onClick={() => {
                    fetchTournamentGames();
                    setShowGamesModal(true);
                  }}
                >
                  Muokkaa ottelukaaviota
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={7}>
          <Card className="shadow-sm border-0">
            <Card.Header
              className={
                formData.id ? "bg-primary text-white" : "bg-success text-white"
              }
            >
              {formData.id ? "Muokkaa turnausta" : "Uusi turnaus"}
            </Card.Header>
            <Card.Body>
              <Form
                onSubmit={async (e) => {
                  e.preventDefault();
                  formData.id
                    ? await openService.update(formData.id, formData)
                    : await openService.create(formData);
                  fetchInitialData();
                }}
              >
                <Form.Group className="mb-3">
                  <Form.Label>Nimi</Form.Label>
                  <Form.Control
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Vuosi</Form.Label>
                  <Form.Select
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <div className="d-flex gap-3 mb-3">
                  <Form.Check
                    label="Käynnissä"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                  />
                  <Form.Check
                    label="Päätetty"
                    checked={formData.ended}
                    onChange={(e) =>
                      setFormData({ ...formData, ended: e.target.checked })
                    }
                  />
                </div>
                <Button type="submit" variant="success" className="w-100">
                  Tallenna turnaus
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal
        show={showGamesModal}
        onHide={() => setShowGamesModal(false)}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Ottelut: {formData.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {gamesLoading ? (
            <Spinner animation="border" />
          ) : (
            <Table responsive hover size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Pvm</th>
                  <th>Koti</th>
                  <th>Vieras</th>
                  <th>Tulos</th>
                  <th className="text-end">Toiminnot</th>
                </tr>
              </thead>
              <tbody>
                {tournamentGames?.map((g) => (
                  <MatchRow
                    key={g.id}
                    match={g}
                    players={players}
                    onSave={handleSaveMatch}
                  />
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminOpens;
