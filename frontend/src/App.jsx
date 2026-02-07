import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import { Spinner, Container } from "react-bootstrap";

// Public Views
import Home from "./views/Home";
import Ranking from "./views/Ranking";
import Results from "./views/Results";
import Open from "./views/Open";
import About from "./views/About";
import { Login, Signup } from "./views/Auth";

// Admin Views
import AdminDashboard from "./views/admin/Dashboard";
import AdminRanking from "./views/admin/Ranking";
import AdminResults from "./views/admin/Results";
import AdminOpens from "./views/admin/Opens";
import AdminContent from "./views/admin/Content";

// Services
import { authService } from "./services/dataService";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await authService.checkStatus();
        setIsAuthenticated(status.isAuthenticated);
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Router>
      <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/results/:page" element={<Results />} />
          <Route path="/open" element={<Open />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" />
              ) : (
                <Login setAuth={setIsAuthenticated} />
              )
            }
          />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Routes */}
          {isAuthenticated ? (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/ranking" element={<AdminRanking />} />
              <Route path="/admin/results" element={<AdminResults />} />
              <Route path="/admin/opens" element={<AdminOpens />} />
              <Route path="/admin/about" element={<AdminContent />} />
            </>
          ) : (
            /* Redirect any admin attempts to login if not authenticated */
            <Route path="/admin/*" element={<Navigate to="/login" />} />
          )}

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
