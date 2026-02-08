import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Pagination,
  Badge,
} from "react-bootstrap";
import {
  matchService,
  playerService,
  openService,
} from "../../services/dataService";

// --- SUB-COMPONENT: INLINE EDITOR ---
const ResultRow = ({ result, players, opens, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...result });

  // Sync internal state if props change
  useEffect(() => {
    setEditData({
      ...result,
      home: result.player1 || result.home_id || result.home,
      away: result.player2 || result.away_id || result.away,
      game_date:
        result.game_date?.substring(0, 10) ||
        result.date?.substring(0, 10) ||
        "",
    });
  }, [result]);

  const handleLocalSave = async () => {
    await onSave(editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="table-info">
        <td colSpan="6" className="p-3 shadow-sm">
          <Row className="g-2 align-items-center">
            {/* Row 1: Player 1 | Wins 1 | Date */}
            <Col md={4}>
              <Form.Select
                size="sm"
                value={editData.home}
                onChange={(e) =>
                  setEditData({ ...editData, home: e.target.value })
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
                value={editData.wins1}
                onChange={(e) =>
                  setEditData({ ...editData, wins1: e.target.value })
                }
              />
            </Col>
            <Col md={4}>
              <Form.Control
                size="sm"
                type="date"
                value={editData.game_date}
                onChange={(e) =>
                  setEditData({ ...editData, game_date: e.target.value })
                }
              />
            </Col>
            <Col md={2} className="text-end">
              <Button
                variant="success"
                size="sm"
                onClick={handleLocalSave}
                className="w-100"
              >
                OK
              </Button>
            </Col>

            {/* Row 2: Player 2 | Wins 2 | Details */}
            <Col md={4}>
              <Form.Select
                size="sm"
                value={editData.away}
                onChange={(e) =>
                  setEditData({ ...editData, away: e.target.value })
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
                value={editData.wins2}
                onChange={(e) =>
                  setEditData({ ...editData, wins2: e.target.value })
                }
              />
            </Col>
            <Col md={4}>
              <Form.Control
                size="sm"
                type="text"
                placeholder="Details (6-0, 6-2)"
                value={editData.result}
                onChange={(e) =>
                  setEditData({ ...editData, result: e.target.value })
                }
              />
            </Col>
            <Col md={2} className="text-end">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="w-100"
              >
                Peruuta
              </Button>
            </Col>
          </Row>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="small">
        {result.game_date?.substring(0, 10) || result.date}
      </td>
      <td className="fw-bold">{result.homename || result.home}</td>
      <td className="fw-bold">{result.awayname || result.away}</td>
      <td className="text-center">
        <Badge bg="dark">
          {result.wins1} - {result.wins2}
        </Badge>
      </td>
      <td className="small text-muted">
        {result.tournament_name || "Ranking"}
      </td>
      <td>
        <div className="d-flex gap-1">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onDelete(result.id)}
          >
            X
          </Button>
        </div>
      </td>
    </tr>
  );
};

const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [players, setPlayers] = useState([]);
  const [opens, setOpens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- NEW STATE FOR ADDING ---
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState({
    home: "",
    away: "",
    wins1: 0,
    wins2: 0,
    game_date: new Date().toISOString().split("T")[0],
    result: "",
    tournament_id: "",
  });

  useEffect(() => {
    fetchStaticData();
  }, []);
  useEffect(() => {
    fetchResults(currentPage);
  }, [currentPage]);

  const fetchStaticData = async () => {
    try {
      const [p, o] = await Promise.all([
        playerService.getAll(),
        openService.getAll(),
      ]);
      setPlayers(p || []);
      setOpens(o || []);
    } catch (err) {
      setError("Datan haku epäonnistui.");
    }
  };

  const fetchResults = async (page) => {
    try {
      setLoading(true);
      const data = await matchService.getResults(page);
      setResults(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError("Tulosten haku epäonnistui.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!newData.home || !newData.away) return alert("Valitse pelaajat!");
    try {
      const payload = {
        ...newData,
        player1: newData.home,
        player2: newData.away,
        wins1: parseInt(newData.wins1),
        wins2: parseInt(newData.wins2),
        played: 1,
        reported: 1,
      };
      await matchService.create(payload);
      setIsAdding(false);
      fetchResults(1); // Back to first page to see the new entry
    } catch (err) {
      setError("Lisäys epäonnistui.");
    }
  };

  const handleSaveResult = async (data) => {
    try {
      const payload = {
        ...data,
        wins1: parseInt(data.wins1),
        wins2: parseInt(data.wins2),
        player1: data.home,
        player2: data.away,
      };
      await matchService.update(data.id, payload);
      fetchResults(currentPage);
    } catch (err) {
      setError("Tallennus epäonnistui.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Poistetaanko ottelu?")) {
      await matchService.delete(id);
      fetchResults(currentPage);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Ottelut</h2>
        {!isAdding && (
          <Button variant="success" onClick={() => setIsAdding(true)}>
            + Lisää uusi ottelu
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <Table
            responsive
            hover
            size="sm"
            className="align-middle border shadow-sm bg-white"
          >
            <thead className="table-dark">
              <tr>
                <th>Pvm</th>
                <th>Koti</th>
                <th>Vieras</th>
                <th className="text-center">Tulos</th>
                <th>Turnaus</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* --- NEW MATCH INLINE FORM --- */}
              {isAdding && (
                <tr className="table-success">
                  <td colSpan="6" className="p-3">
                    <h6 className="mb-3 text-success">Uusi ottelu</h6>
                    <Row className="g-2 align-items-center">
                      <Col md={4}>
                        <Form.Label className="small mb-0">Koti</Form.Label>
                        <Form.Select
                          size="sm"
                          value={newData.home}
                          onChange={(e) =>
                            setNewData({ ...newData, home: e.target.value })
                          }
                        >
                          <option value="">Valitse...</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={1}>
                        <Form.Label className="small mb-0">W1</Form.Label>
                        <Form.Control
                          size="sm"
                          type="number"
                          value={newData.wins1}
                          onChange={(e) =>
                            setNewData({ ...newData, wins1: e.target.value })
                          }
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small mb-0">Pvm</Form.Label>
                        <Form.Control
                          size="sm"
                          type="date"
                          value={newData.game_date}
                          onChange={(e) =>
                            setNewData({
                              ...newData,
                              game_date: e.target.value,
                            })
                          }
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Label className="small mb-0">Turnaus</Form.Label>
                        <Form.Select
                          size="sm"
                          value={newData.tournament_id}
                          onChange={(e) =>
                            setNewData({
                              ...newData,
                              tournament_id: e.target.value,
                            })
                          }
                        >
                          <option value="">Ranking</option>
                          {opens.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>

                      <Col md={4}>
                        <Form.Label className="small mb-0">Vieras</Form.Label>
                        <Form.Select
                          size="sm"
                          value={newData.away}
                          onChange={(e) =>
                            setNewData({ ...newData, away: e.target.value })
                          }
                        >
                          <option value="">Valitse...</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={1}>
                        <Form.Label className="small mb-0">W2</Form.Label>
                        <Form.Control
                          size="sm"
                          type="number"
                          value={newData.wins2}
                          onChange={(e) =>
                            setNewData({ ...newData, wins2: e.target.value })
                          }
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small mb-0">
                          Tulos (erät)
                        </Form.Label>
                        <Form.Control
                          size="sm"
                          type="text"
                          placeholder="6-0, 6-2"
                          value={newData.result}
                          onChange={(e) =>
                            setNewData({ ...newData, result: e.target.value })
                          }
                        />
                      </Col>
                      <Col md={3} className="pt-3">
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            className="w-100"
                            onClick={handleCreateMatch}
                          >
                            Tallenna
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="w-100"
                            onClick={() => setIsAdding(false)}
                          >
                            X
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </td>
                </tr>
              )}

              {/* --- EXISTING RESULTS --- */}
              {results.map((r) => (
                <ResultRow
                  key={r.id}
                  result={r}
                  players={players}
                  opens={opens}
                  onSave={handleSaveResult}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </Table>

          {/* Pagination stays the same */}
          <Pagination className="justify-content-center mt-4">
            {[...Array(totalPages).keys()].map((page) => (
              <Pagination.Item
                key={page + 1}
                active={page + 1 === currentPage}
                onClick={() => setCurrentPage(page + 1)}
              >
                {page + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </>
      )}
    </Container>
  );
};

export default AdminResults;
