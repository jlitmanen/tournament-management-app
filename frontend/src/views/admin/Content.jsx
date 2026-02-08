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
import { contentService } from "../../services/dataService";

const AdminContent = () => {
  const [contentList, setContentList] = useState([]);
  const [editingContent, setEditingContent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const data = await contentService.getAll();
      setContentList(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching content:", err);
      setError("Sisältöjen haku epäonnistui.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingContent({ title: "", text: "" });
    setIsEditing(true);
  };

  const handleEdit = (content) => {
    setEditingContent({ ...content });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingContent.id) {
        await contentService.update(editingContent.id, editingContent);
      } else {
        await contentService.create(editingContent);
      }
      setIsEditing(false);
      setEditingContent(null);
      fetchContent(); // Refresh list
    } catch (err) {
      console.error("Error saving content:", err);
      setError("Tallennus epäonnistui.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Haluatko varmasti poistaa tämän sisällön?")) {
      try {
        await contentService.delete(id);
        fetchContent();
      } catch (err) {
        console.error("Error deleting content:", err);
        setError("Poisto epäonnistui.");
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingContent(null);
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
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <h3 className="mb-4">
                  {editingContent?.id
                    ? "Muokkaa sisältöä"
                    : "Lisää uusi sisältö"}
                </h3>
                <Form onSubmit={handleSave}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Otsikko</Form.Label>
                    <Form.Control
                      type="text"
                      size="lg"
                      value={editingContent?.title || ""}
                      onChange={(e) =>
                        setEditingContent({
                          ...editingContent,
                          title: e.target.value,
                        })
                      }
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Sisältö (HTML)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={10}
                      style={{ fontSize: "1.1rem" }}
                      value={editingContent?.text || ""}
                      onChange={(e) =>
                        setEditingContent({
                          ...editingContent,
                          text: e.target.value,
                        })
                      }
                      placeholder="Kirjoita sisältö tähän (voit käyttää HTML-tageja)..."
                    />
                  </Form.Group>

                  <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                    <Button
                      variant="outline-secondary"
                      className="px-4"
                      onClick={handleCancel}
                    >
                      Peruuta
                    </Button>
                    <Button variant="success" type="submit" className="px-5">
                      Tallenna muutokset
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Sivun sisältöjen hallinta</h2>
        <Button variant="success" onClick={handleAdd}>
          Lisää uusi osio
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Table bordered hover responsive size="sm">
        <thead className="table-dark">
          <tr>
            <th>Otsikko</th>
            <th style={{ width: "120px" }}>Toiminnot</th>
          </tr>
        </thead>
        <tbody className="table-group-divider">
          {contentList.length > 0 ? (
            contentList.map((c) => (
              <tr key={c.id}>
                <td className="align-middle">{c.title}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEdit(c)}
                    >
                      <i className="fa fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(c.id)}
                    >
                      <i className="fa fa-trash"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="text-center p-4">
                Ei sisältöjä löytynyt.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default AdminContent;
