// ==============================
// Archivo: Home.js
// ==============================

// ----- Importaciones: Librerías y componentes básicos -----
// Importamos React y hooks necesarios para el manejo de estado y efectos
import React, { useState, useEffect, useCallback } from 'react';
// Link de react-router-dom para la navegación entre páginas
import { Link } from 'react-router-dom';
// Importamos varios componentes de React-Bootstrap para armar la interfaz (contenedores, filas, columnas, formularios, botones, tarjetas, paginación y spinners)
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
// Importamos iconos de estrellas para mostrar la calificación (rellenas y sin rellenar)
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
// Importamos los estilos personalizados para esta página
import './home.css';


// ==============================
// ----- Funciones Auxiliares -----
// ==============================

// Función que calcula la cantidad de estrellas a partir de la puntuación de Metacritic
function getStarRating(metacritic) {
  if (!metacritic) return 0; // Si no hay puntuación, retorna 0 estrellas
  return Math.round(metacritic / 20);
}

// Función para mapear nombres de plataformas a identificadores de la API RAWG
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
  // Si no se encuentra en el mapping, se devuelve el mismo valor de entrada
  return mapping[lower] || input;
}

// Función para mapear nombres de géneros a slugs utilizados en la API RAWG
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
  // Se retorna el slug mapeado o el mismo texto en minúsculas si no hay coincidencia
  return mapping[lower] || lower;
}

// ==============================
// ----- Configuración de la API -----
// ==============================
// Se define la API key, que se puede obtener de las variables de entorno o usar una key por defecto
const API_KEY = process.env.REACT_APP_RAWG_API_KEY || "377c3c7305d144a0b1d12c7816c1054c";

// ==============================
// ----- Componente Principal: Home -----
// ==============================
// Este componente se encarga de obtener y mostrar una lista de videojuegos, incluyendo un juego destacado (hero)
const Home = () => {
  // ---- Variables de estado ----
  // Lista de juegos y estado de carga (spinner mientras se obtienen los datos)
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  // Variables de estado para almacenar los filtros de búsqueda
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [tag, setTag] = useState('');
  const [developer, setDeveloper] = useState('');
  const [ordering, setOrdering] = useState('-metacritic');
  const [minRating, setMinRating] = useState('');
  // Variables de estado para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [totalPages, setTotalPages] = useState(0);
  // Estado para almacenar el juego destacado (hero)
  const [heroGame, setHeroGame] = useState(null);

  // ---- Obtener un Juego Aleatorio para el Hero (Metacritic >= 85) ----
  // Usamos useCallback para memorizar esta función y evitar ejecuciones innecesarias
  const fetchRandomHeroGame = useCallback(async () => {
    try {
      // Seleccionamos una página aleatoria entre 1 y 3 para obtener resultados variados
      const randomPage = Math.floor(Math.random() * 3) + 1;
      // Construimos la URL de la API, solicitando juegos con Metacritic entre 85 y 100 y ordenados por rating
      let url = `https://api.rawg.io/api/games?key=${API_KEY}&ordering=-rating&page_size=20&page=${randomPage}&metacritic=85,100`;
      const resp = await fetch(url);
      const data = await resp.json();

      // Si hay resultados, seleccionamos uno de ellos al azar
      if (data.results && data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        setHeroGame(data.results[randomIndex]);
      } else {
        // En caso de no obtener resultados, usamos un juego por defecto
        setHeroGame({
          id: 3328,
          name: "The Witcher 3: Wild Hunt",
          metacritic: 92,
          background_image: "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg"
        });
      }
    } catch (error) {
      console.error("Error al obtener juego destacado:", error);
      // Fallback en caso de error: asignamos el juego por defecto
      setHeroGame({
        id: 3328,
        name: "The Witcher 3: Wild Hunt",
        metacritic: 92,
        background_image: "https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg"
      });
    }
  }, []);

  // ---- Obtener Lista de Juegos según Filtros y Paginación ----
  const fetchGames = async (page = currentPage) => {
    setLoading(true); // Activamos el spinner de carga
    try {
      // Construimos la URL base para la petición
      let url = `https://api.rawg.io/api/games?key=${API_KEY}&ordering=${ordering}&page_size=${itemsPerPage}&page=${page}`;
      // Agregamos los parámetros de búsqueda según los filtros
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (year) url += `&dates=${year}-01-01,${year}-12-31`;
      if (genre) url += `&genres=${getGenreSlug(genre)}`;
      if (platform) url += `&platforms=${getPlatformId(platform)}`;
      if (tag) url += `&tags=${tag}`;
      if (developer) url += `&developers=${developer}`;

      const resp = await fetch(url);
      const data = await resp.json();
      let results = data.results || [];

      // Filtrado local adicional: por texto en el nombre (para afinar la búsqueda)
      if (search.trim() !== "") {
        const lowerSearch = search.trim().toLowerCase();
        results = results.filter(g => g.name.toLowerCase().includes(lowerSearch));
      }
      // Filtrado local adicional: por calificación mínima de Metacritic
      if (minRating.trim() !== "") {
        const min = parseInt(minRating, 10);
        results = results.filter(g => g.metacritic && g.metacritic >= min);
      }

      // Actualizamos el estado con los juegos filtrados
      setGames(results);
      // Calculamos el total de páginas a partir de la cantidad total de juegos
      const computedTotalPages = Math.ceil(data.count / itemsPerPage);
      // Limitamos el número máximo de páginas a 500 para evitar sobrecarga
      const maxPages = 500;
      setTotalPages(Math.min(computedTotalPages, maxPages));
    } catch (error) {
      console.error("Error al obtener juegos:", error);
    } finally {
      setLoading(false); // Desactivamos el spinner de carga
    }
  };

  // ---- useEffect: Obtener datos iniciales al montar el componente ----
  useEffect(() => {
    // Al iniciar, obtenemos el juego destacado para el "hero"
    fetchRandomHeroGame();
  }, [fetchRandomHeroGame]);

  useEffect(() => {
    // Cada vez que se cambia la página o el orden, se actualiza la lista de juegos
    fetchGames();
  }, [currentPage, ordering]);

  // ---- Manejadores de Eventos ----

  // Maneja el envío del formulario de filtros
  const handleSubmit = (e) => {
    e.preventDefault(); // Evitamos que se recargue la página
    setCurrentPage(1); // Reiniciamos a la primera página
    fetchGames(1); // Solicitamos la lista de juegos con los nuevos filtros
  };

  // Maneja el cambio de página en la paginación
  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  // Función para generar un rango de páginas con elipses (para no mostrar todos los números de página)
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

  // ---- Preparar el estilo de fondo para la sección Hero -----  
  // Si el juego destacado tiene imagen, se usa esa imagen como fondo; de lo contrario, se muestra un degradado
  const heroBgStyle = heroGame && heroGame.background_image
    ? {
        background: `url(${heroGame.background_image}) no-repeat center center`,
        backgroundSize: 'cover'
      }
    : {
        background: 'linear-gradient(to right, #666, #444)'
      };

  // ==============================
  // ----- Renderizado del Componente -----
  // ==============================
  return (
    <div className="home-wrapper">
      {/* Sección Hero: Banner principal con el juego destacado */}
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
                  {/* Al hacer clic en el nombre del juego, redirigimos a la página de detalles */}
                  <Link to={`/game/${heroGame.id}`} className="text-decoration-none text-gold">
                    {heroGame.name}
                  </Link>
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

      {/* Sección de Filtros y Lista de Juegos */}
      <Container className="py-5">
        {/* Tarjeta de Filtros de Búsqueda */}
        <Card className="mb-4 shadow-sm filter-card">
          <Card.Header as="h5" className="bg-primary text-white">
            Filtros de Búsqueda
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row className="gy-3">
                {/* Campo para buscar por nombre del juego */}
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
                {/* Campo para filtrar por año */}
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
                {/* Campo para filtrar por género */}
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
                {/* Campo para filtrar por plataforma */}
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
                {/* Campo para filtrar por tag */}
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
                {/* Campo para filtrar por desarrollador */}
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
                {/* Selector para elegir el ordenamiento */}
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
                {/* Campo para filtrar por calificación mínima de Metacritic */}
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
                {/* Botón para aplicar los filtros */}
                <Col xs={12} className="text-end">
                  <Button type="submit" variant="success" className="animate-pulse">
                    Filtrar
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Sección de Resultados: Lista de Juegos */}
        {loading ? (
          // Mostramos una rueda giratoria mientras se cargan los juegos
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {games.length > 0 ? (
              <>
                {/* Grid de tarjetas para cada juego */}
                <Row xs={1} sm={2} md={3} lg={4} xxl={5} className="g-4">
                  {games.map((game) => {
                    // Calculamos cuántas estrellas se deben mostrar basado en Metacritic
                    const stars = getStarRating(game.metacritic);
                    return (
                      <Col key={game.id}>
                        <Card className="h-100 shadow-sm border-0 animate-zoom game-card-dark">
                          {/* Si existe imagen de fondo, la mostramos envuelta en un Link para que al hacer clic redirija al detalle */}
                          {game.background_image && (
                            <Link to={`/game/${game.id}`}>
                              <div className="card-img-wrapper">
                                <Card.Img variant="top" src={game.background_image} alt={game.name} />
                              </div>
                            </Link>
                          )}
                          <Card.Body className="d-flex flex-column">
                            {/* El título del juego también se envuelve en un Link para navegar a la página de detalle */}
                            <Card.Title className="fs-6 mt-1 game-title">
                              <Link to={`/game/${game.id}`} className="text-decoration-none text-black">
                                {game.name}
                              </Link>
                            </Card.Title>
                            {/* Se muestra la valoración en estrellas */}
                            <div className="mb-2 star-rating">
                              {Array.from({ length: 5 }, (_, i) =>
                                i < stars ? (
                                  <AiFillStar key={i} className="text-warning" />
                                ) : (
                                  <AiOutlineStar key={i} className="text-warning" />
                                )
                              )}
                            </div>
                            {/* Se muestra la puntuación de Metacritic */}
                            <p className="text-muted mb-3">
                              Metacritic: {game.metacritic || "N/A"}
                            </p>
                            {/* Botón para ver el detalle del juego */}
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

                {/* Sección de Paginación */}
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
              // Si no se encontraron juegos, mostramos un mensaje informativo
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

// Exportamos el componente Home para poder usarlo en otras partes de la aplicación
export default Home;
