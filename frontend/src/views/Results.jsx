import React, { useState, useEffect } from "react";
import {
  Form,
  Table,
  Pagination,
  Container,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { matchService, playerService } from "../services/dataService";

const Results = () => {
  const { page } = useParams();
  const navigate = useNavigate();
  const currentPage = parseInt(page) || 1;

  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedPid, setSelectedPid] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await playerService.getAll();
        setPlayers(data || []);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await matchService.getResults(currentPage, selectedPid);
        // data is expected to have { items: [], totalPages: X }
        setResults(data.items || []);
        setTotalPages(data.totalPages || 1);
        setError(null);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Tulosten haku epäonnistui. Tarkista yhteys palvelimeen.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [currentPage, selectedPid]);

  const handlePlayerChange = (e) => {
    setSelectedPid(e.target.value);
    navigate("/results/1");
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber !== currentPage) {
      navigate(`/results/${pageNumber}`);
    }
  };

  const renderPagination = () => {
    let items = [];
    const startPage = Math.max(1, currentPage - 4);
    const endPage = Math.min(totalPages, currentPage + 4);

    items.push(
      <Pagination.First
        key="first"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(1)}
      />,
    );

    if (startPage > 1) {
      items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>,
      );
    }

    if (endPage < totalPages) {
      items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
    }

    items.push(
      <Pagination.Last
        key="last"
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(totalPages)}
      />,
    );

    return items;
  };

  if (loading && results.length === 0) {
    return (
      <Container className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Ladataan tuloksia...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="mb-4">Ottelutulokset</h1>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Form className="mb-4">
        <Form.Group controlId="playerSelect">
          <Form.Label>Suodata pelaajan mukaan:</Form.Label>
          <Form.Select value={selectedPid} onChange={handlePlayerChange}>
            <option value="">Kaikki pelaajat</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Form>

      <Table size="sm" hover responsive id="myTable" className="mb-4">
        <thead className="table-dark">
          <tr>
            <th>Päivämäärä</th>
            <th>Ottelu</th>
            <th>Tulos</th>
          </tr>
        </thead>
        <tbody className="table-group-divider">
          {results.length > 0 ? (
            results.map((c) => (
              <React.Fragment key={c.id}>
                <tr
                  className="clickable-row"
                  onClick={() => toggleRow(c.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{c.date || c.game_date}</td>
                  <td>
                    {c.homename} - {c.awayname}
                  </td>
                  <td>{c.res || `${c.wins1}-${c.wins2}`}</td>
                </tr>
                {expandedRow === c.id && (
                  <tr className="expanded-row fade-in">
                    <td colSpan="3" className="bg-light">
                      <div className="p-3">
                        <strong>Lisätiedot:</strong>
                        <div
                          className="mt-1"
                          dangerouslySetInnerHTML={{
                            __html: c.result || "Ei lisätietoja",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center p-4">
                Ei tuloksia löytynyt.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <Pagination className="justify-content-center">
          {renderPagination()}
        </Pagination>
      )}
    </Container>
  );
};

export default Results;
