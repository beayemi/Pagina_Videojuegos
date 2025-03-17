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
  Spinner
} from 'react-bootstrap';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import './home.css';

/**
 * Convierte un puntaje Metacritic (0..100) a un rating de 0..5 estrellas
 */
function getStarRating(metacritic) {
  if (!metacritic) return 0;
  return Math.round(metacritic / 20);
}

/**
 * Mapea nombres de plataforma a su identificador en la API RAWG
 */
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

/**
 * Mapea nombres de género a su slug en la API RAWG
 */
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

const API_KEY = process.env.REACT_APP_RAWG_API_KEY || "377c3c7305d144a0b1d12c7816c1054c";

const Home = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [tag, setTag] = useState('');
  const [developer, setDeveloper] = useState('');
  const [ordering, setOrdering] = useState('-metacritic');
  const [minRating, setMinRating] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [totalPages, setTotalPages] = useState(0);

  // Juego destacado para el hero (solo juegos con metacritic >= 80)
  const [heroGame, setHeroGame] = useState(null);

  // ================================
  // 1. Obtener juego aleatorio para el Hero con Metacritic >= 80
  // ================================
  const fetchRandomHeroGame = useCallback(async () => {
    try {
      // Usamos la API RAWG filtrando por metacritic (80 a 100)
      const randomPage = Math.floor(Math.random() * 3) + 1; // Página 1 a 3
      let url = `https://api.rawg.io/api/games?key=${API_KEY}&ordering=-rating&page_size=20&page=${randomPage}&metacritic=80,100`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (data.results && data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        setHeroGame(data.results[randomIndex]);
      } else {
        // Fallback: Si no se encuentran juegos, asignamos un juego por defecto
        setHeroGame({
          id: 3328,
          name: "The Witcher 3: Wild Hunt",
          metacritic: 92,
          background_image: "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg"
        });
      }
    } catch (error) {
      console.error("Error al obtener juego destacado:", error);
      // Fallback a un juego por defecto
      setHeroGame({
        id: 3328,
        name: "The Witcher 3: Wild Hunt",
        metacritic: 92,
        background_image: "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg"
      });
    }
  }, []);

  // ================================
  // 2. Obtener lista de juegos según filtros
  // ================================
  const fetchGames = async (page = currentPage) => {
    setLoading(true);
    try {
      let url = `https://api.rawg.io/api/games?key=${API_KEY}&ordering=${ordering}&page_size=${itemsPerPage}&page=${page}`;
      if (search)    url += `&search=${encodeURIComponent(search)}`;
      if (year)      url += `&dates=${year}-01-01,${year}-12-31`;
      if (genre)     url += `&genres=${getGenreSlug(genre)}`;
      if (platform)  url += `&platforms=${getPlatformId(platform)}`;
      if (tag)       url += `&tags=${tag}`;
      if (developer) url += `&developers=${developer}`;

      const resp = await fetch(url);
      const data = await resp.json();
      let results = data.results || [];

      // Filtros locales
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
      const maxPages = 500;
      setTotalPages(Math.min(computedTotalPages, maxPages));
    } catch (error) {
      console.error("Error al obtener juegos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Al montar, obtener el juego destacado para el hero
  useEffect(() => {
    fetchRandomHeroGame();
  }, [fetchRandomHeroGame]);

  // Al cambiar currentPage u ordering, obtener la lista de juegos
  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line
  }, [currentPage, ordering]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGames(1);
  };

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  const getPaginationRange = (currentPage, totalPages, delta = 2) => {
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }
    return range;
  };

  // Hero background
  const heroBgStyle = heroGame && heroGame.background_image
    ? {
        background: `url(${heroGame.background_image}) no-repeat center center`,
        backgroundSize: 'cover'
      }
    : {
        background: 'linear-gradient(to right, #666, #444)'
      };

  return (
    <div className="home-wrapper">
      {/* Hero */}
      <div className="hero-home" style={heroBgStyle}>
        <div className="hero-home-overlay">
          <Container className="hero-home-content text-white py-5">
            <h1 className="hero-home-title mb-3">Bienvenido/a al Catálogo de Videojuegos</h1>
            <p className="hero-home-subtitle">
              Explora, filtra y descubre los mejores títulos según Metacritic.
            </p>

            {heroGame && (
              <div className="hero-featured mt-4 p-3">
                <h4 className="text-info mb-2">Juego destacado (Metacritic ≥ 80)</h4>
                <h2 className="hero-highlighted-title">
                  {heroGame.name}
                </h2>
                <p className="mb-2" style={{ fontSize: '1rem' }}>
                  Metacritic: <span className="text-warning fw-semibold">{heroGame.metacritic || 'N/A'}</span>
                </p>
                <Button
                  as={Link}
                  to={`/game/${heroGame.id}`}
                  variant="warning"
                  className="btn-sm fw-bold"
                >
                  Ver Detalle
                </Button>
              </div>
            )}
          </Container>
        </div>
      </div>

      <Container className="py-5">
        {/* Filtros */}
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

        {/* Resultados */}
        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" role="status" className="spinner-grow" />
            <p className="mt-2">Obteniendo juegos...</p>
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
                            <div className="card-img-wrapper">
                              <Card.Img variant="top" src={game.background_image} alt={game.name} />
                            </div>
                          )}
                          <Card.Body className="d-flex flex-column">
                            <Card.Title className="fs-6 mt-1 game-title">
                              {game.name}
                            </Card.Title>
                            <div className="mb-2 star-rating">
                              {Array.from({ length: 5 }, (_, i) =>
                                i < stars ? (
                                  <AiFillStar key={i} className="text-warning" />
                                ) : (
                                  <AiOutlineStar key={i} className="text-warning" />
                                )
                              )}
                            </div>
                            <p className="text-muted mb-3">
                              Metacritic: {game.metacritic || "N/A"}
                            </p>
                            <div className="mt-auto">
                              <Link
                                to={`/game/${game.id}`}
                                className="btn btn-warning btn-sm fw-bold"
                              >
                                Ver Detalle
                              </Link>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>

                {/* Paginación */}
                {totalPages > 1 && (
                  <Pagination className="justify-content-center mt-4">
                    <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                    <Pagination.Item
                      active={currentPage === 1}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </Pagination.Item>
                    {getPaginationRange(currentPage, totalPages, 2).map((page, idx) =>
                      page === "..." ? (
                        <Pagination.Ellipsis key={idx} disabled />
                      ) : (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Pagination.Item>
                      )
                    )}
                    <Pagination.Next
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                )}
              </>
            ) : (
              <p className="text-center my-5">
                No se encontraron juegos.
              </p>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default Home;
