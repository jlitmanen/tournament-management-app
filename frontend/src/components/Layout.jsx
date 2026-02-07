import React, { useState, useEffect } from "react";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Row,
  Col,
  Button,
} from "react-bootstrap";
import { Link } from "react-router-dom";

const Layout = ({ children, isAuthenticated, onLogout }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <>
      <Navbar
        bg={theme}
        data-bs-theme={theme}
        expand="md"
        fixed="top"
        className={
          theme === "light"
            ? "bg-white border-bottom shadow-sm"
            : "bg-dark-subtle shadow-sm"
        }
      >
        <Container fluid>
          <Navbar.Brand as={Link} to="/">
            KTP - {new Date().getFullYear()}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/ranking">
                Ranking
              </Nav.Link>
              <Nav.Link as={Link} to="/results/1">
                Matches
              </Nav.Link>
              <Nav.Link as={Link} to="/open">
                Opens
              </Nav.Link>
              <Nav.Link as={Link} to="/about">
                About
              </Nav.Link>
              {isAuthenticated && (
                <NavDropdown title="Admin tools" id="admin-nav-dropdown">
                  <NavDropdown.Item as={Link} to="/admin/ranking">
                    Edit players
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/results">
                    Edit results
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/opens">
                    Edit opens
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/about">
                    Edit content
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={onLogout}>Logout</NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
            <Nav className="ms-auto">
              <Button variant="link" className="nav-link" onClick={toggleTheme}>
                <i
                  className={`fa ${theme === "light" ? "fa-moon-o" : "fa-sun-o"}`}
                ></i>
                {theme === "light" ? " 🌙" : " ☀️"}
              </Button>
              {!isAuthenticated ? (
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
              ) : null}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="mt-5 pt-4">
        <Row>
          <Col md={2}></Col>
          <Col md={8} className="shadow-lg p-4 rounded bg-body">
            {children}
          </Col>
          <Col md={2}></Col>
        </Row>
      </Container>

      <footer className="text-center py-4 mt-auto">
        <Container>
          <p className="text-muted">
            &copy; {new Date().getFullYear()} ktp (ei se kotkalainen)
          </p>
        </Container>
      </footer>
    </>
  );
};

export default Layout;
