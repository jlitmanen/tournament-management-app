import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  ListGroup,
  Tab,
  Card,
  Spinner,
  Alert,
} from "react-bootstrap";
import { contentService } from "../services/dataService";

const About = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await contentService.getAll();
        setContent(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Sisällön haku epäonnistui.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <Container className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Ladataan tietoja...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (content.length === 0) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Ei näytettävää sisältöä.</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Tab.Container id="list-group-tabs-about" defaultActiveKey="#content-0">
        <Row>
          <Col md={4}>
            <ListGroup className="shadow-sm">
              {content.map((c, index) => (
                <ListGroup.Item
                  key={c.id || index}
                  action
                  href={`#content-${index}`}
                  className="py-3"
                >
                  {c.title}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col md={8}>
            <Card className="shadow-sm" style={{ minHeight: "30em" }}>
              <Card.Body className="p-4">
                <Tab.Content>
                  {content.map((c, index) => (
                    <Tab.Pane
                      key={c.id || index}
                      eventKey={`#content-${index}`}
                      className="fade-in"
                    >
                      <h2 className="border-bottom pb-3 mb-4">{c.title}</h2>
                      <div
                        className="content-body"
                        dangerouslySetInnerHTML={{ __html: c.text }}
                      />
                    </Tab.Pane>
                  ))}
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default About;
