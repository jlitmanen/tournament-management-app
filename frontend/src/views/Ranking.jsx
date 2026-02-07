import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert } from "react-bootstrap";
import { playerService } from "../services/dataService";

const Ranking = () => {
  const [players, setPlayers] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const data = await playerService.getRanking();

        const sorted = (data || []).sort((a, b) => {
          const groupA = a.Ryhma || 0;
          const groupB = b.Ryhma || 0;
          if (groupA !== groupB) return groupA - groupB;
          return (b.Pisteet || 0) - (a.Pisteet || 0);
        });

        setPlayers(sorted);
        setError(null);
      } catch (err) {
        setError("Haku epäonnistui.");
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  let lastRyhma = null;

  return (
    <div className="container mt-3">
      {error && <Alert variant="danger">{error}</Alert>}

      <Table size="sm" hover className="align-middle border-top">
        <thead>
          <tr className="text-muted small text-uppercase">
            <th className="ps-3" style={{ width: "50px" }}>
              #
            </th>
            <th>Nimi</th>
            <th className="text-end pe-3">Pisteet</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => {
            const currentRyhma = player.Ryhma || 0;
            const isNewGroup = lastRyhma !== null && lastRyhma !== currentRyhma;
            lastRyhma = currentRyhma;

            return (
              <React.Fragment key={player.id}>
                {/* Minimalist Divider */}
                {isNewGroup && (
                  <tr>
                    <td
                      colSpan="3"
                      className="bg-light py-1 ps-3 border-top border-bottom"
                    >
                      <small className="fw-bold text-muted">
                        Ryhmä {currentRyhma}
                      </small>
                    </td>
                  </tr>
                )}

                <tr
                  onClick={() => toggleRow(player.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="ps-3 text-muted">{index + 1}.</td>
                  <td>{player.Nimi || player.name}</td>
                  <td className="text-end pe-3">{player.Pisteet || 0}</td>
                </tr>

                {expandedRow === player.id && (
                  <tr>
                    <td colSpan="3" className="p-0 border-0">
                      <div className="bg-light px-5 py-2 small text-muted border-bottom">
                        Pelatut ottelut:{" "}
                        <strong>{player.Pelatut_Ottelut || 0}</strong>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default Ranking;
