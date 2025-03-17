// Archivo: Home.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Pagination,
} from 'react-bootstrap';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import './home.css';

// Calcula la cantidad de estrellas a partir del puntaje de Metacritic
function getStarRating(metacritic) {
  return metacritic ? Math.round(metacritic / 20) : 0;
}

// Mapea el nombre de la plataforma a su ID
function getPlatformId(input) {
  const lower = input.trim().toLowerCase();
  const mapping = {
    "ps2": 15, "playstation 2": 15,
    "ps3": 16, "playstation 3": 16,
    "ps4": 18, "playstation 4": 18,
    "ps5": 187, "playstation 5": 187,
    "xbox 360": 14,
    "xbox one": 1,
    "xbox series x": 186,
    "xbox series s": 186,
    "pc": 4,
    "nintendo switch": 7,
    "wii u": 8,
    "wii": 11,
    "ds": 9,
    "3ds": 10
  };
  return mapping[lower] || input;
}

// Mapea el nombre del género a su slug
function getGenreSlug(input) {
  const lower = input.trim().toLowerCase();
  const mapping = {
    "rpg": "role-playing-games-rpg",
    "action": "action",
    "adventure": "adventure",
    "strategy": "strategy",
    "sports": "sports",
    "shooter": "shooter",
    "racing": "racing",
    "puzzle": "puzzle"
  };
  return mapping[lower] || lower;
}

// API Key para RAWG (de variables de entorno o por defecto)
const API_KEY = process.env.REACT_APP_RAWG_API_KEY || "377c3c7305d144a0b1d12c7816c1054c";

// Componente principal Home
const Home = () => {
  // Estados para juegos, filtros, paginación y juego destacado
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [tag, setTag] = useState('');
  const [developer, setDeveloper] = useState('');
  const [ordering, setOrdering] = useState('-metacritic');
  const [minRating, setMinRating] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [totalPages, setTotalPages] = useState(0);
  const [heroGame, setHeroGame] = useState(null);

  // Obtiene un juego aleatorio para la sección "hero"
  const fetchRandomHeroGame = useCallback(async () => {
    try {
      const randomPage = Math.floor(Math.random() * 3) + 1;
      let url = `https://api.rawg.io/api/games?key=${API_KEY}&ordering=-rating&page_size=20&page=${randomPage}&metacritic=85,100`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        setHeroGame(data.results[randomIndex]);
      } else {
        setHeroGame({
          id: 3328,
          name: "The Witcher 3: Wild Hunt",
          metacritic: 92,
          background_image: "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg"
        });
      }
    } catch (error) {
      console.error("Error al obtener juego destacado:", error);
      setHeroGame({
        id: 3328,
        name: "The Witcher 3: Wild Hunt",
        metacritic: 92,
        background_image: "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg"
      });
    }
  }, []);

  // Obtiene la lista de juegos según filtros y paginación
  const fetchGames = async (page = currentPage) => {
    setLoading(true);
    try {
      let url = `https://api.rawg.io/api/games?key=${API_KEY}&ordering=${ordering}&page_size=${itemsPerPage}&page=${page}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (year) url += `&dates=${year}-01-01,${year}-12-31`;
      if (genre) url += `&genres=${getGenreSlug(genre)}`;
      if (platform) url += `&platforms=${getPlatformId(platform)}`;
      if (tag) url += `&tags=${tag}`;
      if (developer) url += `&developers=${developer}`;
      const resp = await fetch(url);
      const data = await resp.json();
      let results = data.results || [];
      if (search.trim() !== "") {
        const lowerSearch = search.trim().toLowerCase();
        results = results.filter(g => g.name.toLowerCase().includes(lowerSearch));
      }
      if (minRating.trim() !== "") {
        const min = parseInt(minRating, 10);
        results = results.filter(g => g.metacritic && g.metacritic >= min);
      }
      setGames(results);
      const computedTotalPages = Math.ceil(data.count / itemsPerPage);
      setTotalPages(Math.min(computedTotalPages, 500));
    } catch (error) {
      console.error("Error al obtener juegos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carga datos al montar el componente
  useEffect(() => { fetchRandomHeroGame(); }, [fetchRandomHeroGame]);
  useEffect(() => { fetchGames(); }, [currentPage, ordering, fetchGames]);

  // Maneja el envío del formulario de filtros
  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGames(1);
  };

  // Cambia la página en la paginación
  const handlePageChange = (pageNum) => setCurrentPage(pageNum);

  // Genera el rango de números para la paginación
  const getPaginationRange = (currentPage, totalPages, delta = 2) => {
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");
    return range;
  };

  // Define el estilo de fondo para la sección hero
  const heroBgStyle = heroGame && heroGame.background_image
    ? { background: `url(${heroGame.background_image}) no-repeat center center`, backgroundSize: 'cover' }
    : { background: 'linear-gradient(to right, #666, #444)' };

  return (
    <div className="home-wrapper">
      <div className="hero-home" style={heroBgStyle}>
        <div className="hero-home-overlay">
          <Container className="hero-home-content text-white py-5">
            <h1 className="hero-home-title mb-3">Bienvenido/a al Catálogo de Videojuegos</h1>
            <p className="hero-home-subtitle">
              Explora, filtra y descubre los mejores títulos según Metacritic.
            </p>
            {heroGame && (
              <div className="hero-featured mt-4 p-3">
                <h4 className="text-info mb-2">Juego destacado</h4>
                <h2 className="hero-highlighted-title">
                  <Link to={`/game/${heroGame.id}`} className="text-decoration-none text-gold">
                    {heroGame.name}
                  </Link>
                </h2>
                <p className="mb-2" style={{ fontSize: '1rem' }}>
                  Metacritic: <span className="text-warning fw-semibold">{heroGame.metacritic || 'N/A'}</span>
                </p>
                <Button as={Link} to={`/game/${heroGame.id}`} variant="warning" className="btn-sm fw-bold">
                  Ver Detalle
                </Button>
              </div>
            )}
          </Container>
        </div>
      </div>
      <Container className="py-5">
        <Card className="mb-4 shadow-sm filter-card">
          <Card.Header as="h5" className="bg-primary text-white">
            Filtros de Búsqueda
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row className="gy-3">
                <Col lg={4}>
                  <Form.Group>
                    <Form.Label>Buscar juego</Form.Label>
                    <Form.Control
                      placeholder="Ej: The Witcher..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col lg={2}>
                  <Form.Group>
                    <Form.Label>Año</Form.Label>
                    <Form.Control
                      placeholder="Ej: 2020"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col lg={2}>
                  <Form.Group>
                    <Form.Label>Género (slug)</Form.Label>
                    <Form.Control
                      placeholder="Ej: rpg"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col lg={2}>
                  <Form.Group>
                    <Form.Label>Plataforma</Form.Label>
                    <Form.Control
                      placeholder="Ej: ps4, pc..."
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col lg={2}>
                  <Form.Group>
                    <Form.Label>Tag (slug)</Form.Label>
                    <Form.Control
                      placeholder="Ej: anime"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col lg={2}>
                  <Form.Group>
                    <Form.Label>Desarrollador</Form.Label>
                    <Form.Control
                      placeholder="Ej: cd-projekt-red"
                      value={developer}
                      onChange={(e) => setDeveloper(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col lg={2}>
                  <Form.Group>
                    <Form.Label>Ordenar por</Form.Label>
                    <Form.Select
                      value={ordering}
                      onChange={(e) => {
                        setOrdering(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="-metacritic">Mejores Puntuados</option>
                      <option value="-released">Más Recientes</option>
                      <option value="name">Alfabético (A-Z)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col lg={2}>
                  <Form.Group>
                    <Form.Label>Metacritic Mínimo</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Ej: 70"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} className="text-end">
                  <Button type="submit" variant="success" className="animate-pulse">
                    Filtrar
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {games.length > 0 ? (
              <>
                <Row xs={1} sm={2} md={3} lg={4} xxl={5} className="g-4">
                  {games.map((game) => {
                    const stars = getStarRating(game.metacritic);
                    return (
                      <Col key={game.id}>
                        <Card className="h-100 shadow-sm border-0 animate-zoom game-card-dark">
                          {game.background_image && (
                            <Link to={`/game/${game.id}`}>
                              <div className="card-img-wrapper">
                                <Card.Img variant="top" src={game.background_image} alt={game.name} />
                              </div>
                            </Link>
                          )}
                          <Card.Body className="d-flex flex-column">
                            <Card.Title className="fs-6 mt-1 game-title">
                              <Link to={`/game/${game.id}`} className="text-decoration-none text-black">
                                {game.name}
                              </Link>
                            </Card.Title>
                            <div className="mb-2 star-rating">
                              {Array.from({ length: 5 }, (_, i) =>
                                i < stars ? <AiFillStar key={i} className="text-warning" /> : <AiOutlineStar key={i} className="text-warning" />
                              )}
                            </div>
                            <p className="text-muted mb-3">
                              Metacritic: {game.metacritic || "N/A"}
                            </p>
                            <div className="mt-auto">
                              <Link to={`/game/${game.id}`} className="btn btn-warning btn-sm fw-bold">
                                Ver Detalle
                              </Link>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
                {totalPages > 1 && (
                  <Pagination className="justify-content-center mt-4">
                    <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                    <Pagination.Item active={currentPage === 1} onClick={() => handlePageChange(1)}>1</Pagination.Item>
                    {getPaginationRange(currentPage, totalPages, 2).map((page, idx) =>
                      page === "..." ? (
                        <Pagination.Ellipsis key={idx} disabled />
                      ) : (
                        <Pagination.Item key={page} active={page === currentPage} onClick={() => handlePageChange(page)}>
                          {page}
                        </Pagination.Item>
                      )
                    )}
                    <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                )}
              </>
            ) : (
              <p className="text-center my-5">No se encontraron juegos.</p>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default Home;
