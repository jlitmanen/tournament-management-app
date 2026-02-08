import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Card,
  Container,
  Row,
  Col,
  Spinner,
  Alert,
} from "react-bootstrap";
import { playerService } from "../../services/dataService";

const AdminRanking = () => {
  const [players, setPlayers] = useState([]);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await playerService.getAll();
      setPlayers(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching players:", err);
      setError("Pelaajien haku epäonnistui.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = () => {
    setEditingPlayer({ name: "" });
    setIsEditing(true);
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer({ ...player });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingPlayer.id) {
        await playerService.update(editingPlayer.id, editingPlayer);
      } else {
        await playerService.create(editingPlayer);
      }
      setIsEditing(false);
      setEditingPlayer(null);
      fetchPlayers(); // Refresh list
    } catch (err) {
      console.error("Error saving player:", err);
      setError("Tallennus epäonnistui.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Haluatko varmasti poistaa pelaajan?")) {
      try {
        await playerService.delete(id);
        fetchPlayers();
      } catch (err) {
        console.error("Error deleting player:", err);
        setError("Poisto epäonnistui.");
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingPlayer(null);
  };

  if (loading && !isEditing) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <Container>
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <h3 className="mb-4">
                  {editingPlayer?.id ? "Muokkaa pelaajaa" : "Luo uusi pelaaja"}
                </h3>
                <Form onSubmit={handleSave}>
                  <Form.Group className="mb-3" controlId="playerName">
                    <Form.Label>Nimi:</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Syötä nimi"
                      value={editingPlayer?.name || ""}
                      onChange={(e) =>
                        setEditingPlayer({
                          ...editingPlayer,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </Form.Group>
                  <div className="d-grid gap-2">
                    <Button variant="success" type="submit" size="lg">
                      Tallenna
                    </Button>
                    <Button
                      variant="danger"
                      type="button"
                      size="lg"
                      onClick={handleCancel}
                    >
                      Peruuta
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      {error && <Alert variant="danger">{error}</Alert>}
      <div id="Player" className="bd-code-snippet">
        <Table size="sm" responsive bordered hover>
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th style={{ width: "150px" }}>
                <Button
                  variant="success"
                  size="sm"
                  className="w-100"
                  onClick={handleAddPlayer}
                >
                  Add
                </Button>
              </th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {players.length > 0 ? (
              players.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-grow-1"
                        onClick={() => handleEditPlayer(player)}
                      >
                        Muokkaa
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(player.id)}
                      >
                        <i className="fa fa-trash"></i>
                        Poista
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="text-center p-4">
                  Ei pelaajia.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};

export default AdminRanking;
