import React, { useState, useEffect } from "react";
import {
  Form,
  Container,
  Row,
  Col,
  Alert,
  InputGroup,
  Spinner,
  Card,
} from "react-bootstrap";
import { openService } from "../services/dataService";

const Match = ({ match }) => {
  const homeName = match.home || "N/A";
  const awayName = match.away || "N/A";

  return (
    <div className="match p-2">
      <div>
        <InputGroup className="mb-1">
          <Form.Control type="text" disabled value={homeName} />
          <InputGroup.Text>{match.wins1 ?? 0}</InputGroup.Text>
        </InputGroup>
      </div>
      <div>
        <InputGroup>
          <Form.Control type="text" disabled value={awayName} />
          <InputGroup.Text>{match.wins2 ?? 0}</InputGroup.Text>
        </InputGroup>
      </div>
    </div>
  );
};

const Open = () => {
  const [opens, setOpens] = useState([]);
  const [selectedOpenId, setSelectedOpenId] = useState("");
  const [currentOpen, setCurrentOpen] = useState(null);
  const [openMatches, setOpenMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOpens = async () => {
      try {
        setLoading(true);
        const data = await openService.getAll();
        setOpens(data || []);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
        setError("Turnausten haku epäonnistui.");
      } finally {
        setLoading(false);
      }
    };
    fetchOpens();
  }, []);

  useEffect(() => {
    const fetchTournamentData = async () => {
      if (!selectedOpenId) {
        setCurrentOpen(null);
        setOpenMatches([]);
        return;
      }

      try {
        setMatchesLoading(true);
        const data = await openService.getMatches(selectedOpenId);
        setCurrentOpen(data.tournament);
        setOpenMatches(data.matches || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching tournament matches:", err);
        setError("Turnauksen tietojen haku epäonnistui.");
      } finally {
        setMatchesLoading(false);
      }
    };

    fetchTournamentData();
  }, [selectedOpenId]);

  const handleOpenChange = (e) => {
    setSelectedOpenId(e.target.value);
  };

  const years = [2026, 2025, 2024, 2023, 2022];

  const getRounds = () => {
    const rounds = {
      1: [], // 1/4 Final (matches 0-3)
      2: [], // Semifinal (matches 4-5)
      3: [], // Final (matches 6+)
    };

    openMatches.forEach((match, idx) => {
      if (idx < 4) rounds[1].push(match);
      else if (idx < 6) rounds[2].push(match);
      else rounds[3].push(match);
    });

    return rounds;
  };

  const rounds = getRounds();

  if (loading) {
    return (
      <Container className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Ladataan turnauksia...</p>
      </Container>
    );
  }

  return (
    <Container>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Form className="mb-4">
        <Form.Select
          className="my-1 mr-sm-2"
          value={selectedOpenId}
          onChange={handleOpenChange}
        >
          <option value="" disabled={selectedOpenId !== ""}>
            Valitse turnaus...
          </option>
          {years.map((year) => {
            const yearOpens = opens.filter((open) => open.year === year);
            if (yearOpens.length === 0) return null;
            return (
              <optgroup key={year} label={year.toString()}>
                {yearOpens.map((open) => (
                  <option key={open.id} value={open.id}>
                    {open.name} {open.year}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </Form.Select>
      </Form>

      {matchesLoading ? (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Ladataan kaaviota...</p>
        </div>
      ) : openMatches.length > 0 ? (
        <div className="container align-content-start p-2">
          <h1 className="mb-4">
            {currentOpen?.name} {currentOpen?.year}
          </h1>
          <Row className="justify-content-between g-3">
            {Object.keys(rounds).map((roundKey) => (
              <Col key={roundKey} md={4} className="bracket-column">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="bg-dark text-white text-center py-2">
                    <h2 className="h5 mb-0">
                      {roundKey === "1" && "1/4 Finaali"}
                      {roundKey === "2" && "Semifinaali"}
                      {roundKey === "3" && "Finaali"}
                    </h2>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column justify-content-around bg-light-subtle">
                    {rounds[roundKey].length > 0 ? (
                      rounds[roundKey].map((match) => (
                        <Match key={match.id} match={match} />
                      ))
                    ) : (
                      <div className="text-center text-muted p-3 small">
                        Ei otteluita tässä vaiheessa
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : selectedOpenId === "" ? (
        <Alert variant="info">Valitse turnaus nähdäksesi kaavion.</Alert>
      ) : (
        <Alert variant="warning">
          Turnaus ei ole vielä alkanut tai otteluita ei ole asetettu.
        </Alert>
      )}
    </Container>
  );
};

export default Open;
