import React from 'react';
import { Container } from 'react-bootstrap';

const Home = () => {
  return (
    <Container className="text-center">
      <div>
        <img
          src="/img/dennis.jpg"
          alt="Dennis"
          className="img-fluid rounded shadow-sm"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </Container>
  );
};

export default Home;
