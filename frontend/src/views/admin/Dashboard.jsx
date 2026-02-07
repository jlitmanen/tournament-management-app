import React from 'react';
import { Alert, ListGroup, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <Container>
      <Alert variant="success">
        <Alert.Heading>Well done!</Alert.Heading>
        <p>
          Aww yeah, you successfully read this important alert message. This example text is going to run a bit longer so that you can see how spacing within an alert works with this kind of content.
        </p>
        <hr />
        <p className="mb-0">
          Whenever you need to, be sure to use margin utilities to keep things nice and tidy.
        </p>
      </Alert>
      <div>
        <ListGroup>
          <ListGroup.Item action as={Link} to="/admin/ranking">
            Edit players
          </ListGroup.Item>
          <ListGroup.Item action as={Link} to="/admin/results">
            Edit results
          </ListGroup.Item>
          <ListGroup.Item action as={Link} to="/admin/opens">
            Edit opens
          </ListGroup.Item>
          <ListGroup.Item action as={Link} to="/admin/about">
            Edit content
          </ListGroup.Item>
        </ListGroup>
      </div>
    </Container>
  );
};

export default AdminDashboard;
