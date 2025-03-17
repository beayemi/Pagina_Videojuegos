import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Card,
  ListGroup,
  Button,
  Row,
  Col,
  Carousel,
  ProgressBar
} from 'react-bootstrap';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { FaPlay } from 'react-icons/fa';
import './gamedetail.css';

// Variables de entorno
const RAWG_API_KEY = process.env.REACT_APP_RAWG_API_KEY || "13bc08315e3a4757ad7407884c68b1c1";
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || "AIzaSyBBZ_gCljRXU4PjJ0jDketduuNCbUTOl_w";
const GOOGLE_TRANSLATE_API_KEY = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY || "AIzaSyDPOsZQqiaB6x8rmtV-_yhHnUwldUoD2Dk";

const GameDetail = () => {
  const { id } = useParams();

  const [game, setGame] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [recommendedGames, setRecommendedGames] = useState([]);
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [isTranslated, setIsTranslated] = useState(false);
  const [youtubeTrailerId, setYoutubeTrailerId] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Obtener detalles del juego
  const fetchGameDetail = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`https://api.rawg.io/api/games/${id}?key=${RAWG_API_KEY}`);
      const data = await resp.json();
      setGame(data);
    } catch (error) {
      console.error("Error al obtener detalles del juego:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 2. Obtener tráiler desde YouTube (si RAWG no provee clip)
  const fetchTrailerFromYouTube = useCallback(async (gameName) => {
    try {
      const query = encodeURIComponent(`${gameName} tráiler`);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video&videoEmbeddable=true`;
      const resp = await fetch(url);
      const data = await resp.json();
      console.log("YouTube API response:", data); // Revisa la respuesta en la consola
      if (data.items && data.items.length > 0) {
        setYoutubeTrailerId(data.items[0].id.videoId);
      } else {
        setYoutubeTrailerId(null);
      }
    } catch (error) {
      console.error("Error al obtener tráiler de YouTube:", error);
      setYoutubeTrailerId(null);
    }
  }, []);

  // 3. Obtener capturas
  const fetchGameScreenshots = useCallback(async () => {
    try {
      const resp = await fetch(`https://api.rawg.io/api/games/${id}/screenshots?key=${RAWG_API_KEY}`);
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        setScreenshots(data.results);
      }
    } catch (error) {
      console.error("Error al obtener capturas:", error);
    }
  }, [id]);

  // 4. Obtener juegos recomendados filtrados por género (fallback general)
  const fetchRecommendedGames = useCallback(async () => {
    try {
      if (game && game.genres && game.genres.length > 0) {
        const genreSlug = game.genres[0].slug;
        const resp = await fetch(`https://api.rawg.io/api/games?genres=${genreSlug}&ordering=-rating&page_size=10&key=${RAWG_API_KEY}`);
        const data = await resp.json();
        if (data.results) {
          const filtered = data.results.filter(g => g.id !== game.id);
          setRecommendedGames(filtered);
        }
      } else {
        const resp = await fetch(`https://api.rawg.io/api/games?ordering=-rating&page_size=10&key=${RAWG_API_KEY}`);
        const data = await resp.json();
        if (data.results) {
          const filtered = data.results.filter(g => g.id !== game.id);
          setRecommendedGames(filtered);
        }
      }
    } catch (error) {
      console.error("Error al obtener juegos recomendados:", error);
    }
  }, [game]);

  // 5. Traducción de descripción
  const translateDescription = async (text) => {
    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}&q=${encodeURIComponent(text)}&target=es`;
      const response = await fetch(url);
      const json = await response.json();
      return json.data.translations[0].translatedText;
    } catch (error) {
      console.error("Error al traducir la descripción:", error);
      return text;
    }
  };

  useEffect(() => {
    fetchGameDetail();
  }, [fetchGameDetail]);

  useEffect(() => {
    if (game) {
      if (!game.clip) {
        fetchTrailerFromYouTube(game.name);
      }
      if (!game.short_screenshots || game.short_screenshots.length === 0) {
        fetchGameScreenshots();
      }
      fetchRecommendedGames();
    }
  }, [game, fetchTrailerFromYouTube, fetchGameScreenshots, fetchRecommendedGames]);

  const handleToggleTranslation = async () => {
    if (!isTranslated && game?.description) {
      const translated = await translateDescription(game.description);
      setTranslatedDescription(translated);
      setIsTranslated(true);
    } else {
      setIsTranslated(false);
    }
  };

  if (loading) {
    return <p className="text-center my-5">Cargando detalles del juego...</p>;
  }
  if (!game) {
    return <p className="text-center my-5">No se encontró información del juego.</p>;
  }

  // Trailer: Si game.clip existe, usarlo; si no, usar YouTube
  const trailerUrl = game.clip?.clip
    ? game.clip.clip
    : youtubeTrailerId
      ? `https://www.youtube.com/embed/${youtubeTrailerId}`
      : null;
  const externalTrailerUrl = game.clip?.clip
    ? game.clip.clip
    : youtubeTrailerId
      ? `https://www.youtube.com/watch?v=${youtubeTrailerId}`
      : null;

  const esrbRating = game.esrb_rating ? game.esrb_rating.name : null;
  const tags = game.tags ? game.tags.map(t => t.name).join(', ') : null;
  const playtime = game.playtime ? `${game.playtime} horas` : null;
  const userRatings = game.ratings || [];
  const heroBg = {
    backgroundImage: game.background_image ? `url(${game.background_image})` : 'linear-gradient(to right, #444, #666)'
  };
  const finalScreenshots = game.short_screenshots && game.short_screenshots.length > 0 ? game.short_screenshots : screenshots;

  return (
    <div className="gamedetail-container">
      {/* Hero */}
      <div
        className="hero-detail"
        style={{
          ...heroBg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          minHeight: '60vh',
          margin: 0,
          padding: 0
        }}
      >
        <div className="hero-overlay">
          <div className="hero-content text-white py-5 position-relative" style={{ width: '100%', minHeight: '60vh' }}>
            <Button
              as={Link}
              to="/"
              className="hero-back-btn-pro d-flex align-items-center"
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <AiOutlineArrowLeft className="hero-back-icon" />
              Volver
            </Button>
            <h1 className="fw-bold hero-title" style={{ marginLeft: '1rem' }}>
              {game.name}
            </h1>
          </div>
        </div>
      </div>

      <Container fluid className="mt-4" style={{ padding: '2rem' }}>
        {/* Primera fila: Información, Descripción y Valoraciones */}
        <Row className="g-5 mb-5">
          {/* Columna Izquierda: Información */}
          <Col md={4}>
            <Card className="mb-3">
              <Card.Header as="h6" className="bg-info text-white">
                Información
              </Card.Header>
              <ListGroup variant="flush">
                {game.released && (
                  <ListGroup.Item>
                    <strong>Lanzamiento:</strong> {game.released}
                  </ListGroup.Item>
                )}
                {game.metacritic && (
                  <ListGroup.Item>
                    <strong>Metacritic:</strong> {game.metacritic}
                  </ListGroup.Item>
                )}
                {playtime && (
                  <ListGroup.Item>
                    <strong>Duración:</strong> {playtime}
                  </ListGroup.Item>
                )}
                <ListGroup.Item>
                  <strong>Plataformas:</strong>{' '}
                  {game.platforms ? game.platforms.map(p => p.platform.name).join(', ') : 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Géneros:</strong>{' '}
                  {game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Desarrolladores:</strong>{' '}
                  {game.developers ? game.developers.map(d => d.name).join(', ') : 'N/A'}
                </ListGroup.Item>
                {esrbRating && (
                  <ListGroup.Item>
                    <strong>Clasificación ESRB:</strong> {esrbRating}
                  </ListGroup.Item>
                )}
                {tags && (
                  <ListGroup.Item>
                    <strong>Etiquetas:</strong> {tags}
                  </ListGroup.Item>
                )}
                {game.website && (
                  <ListGroup.Item>
                    <strong>Sitio web oficial:</strong>{' '}
                    <a href={game.website} target="_blank" rel="noopener noreferrer">
                      {game.website}
                    </a>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card>
          </Col>

          {/* Columna Central: Descripción con scroll */}
          <Col md={4}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Descripción</h4>
              <Button
                className="translate-btn-pro"
                style={{
                  background: 'rgba(0,123,255,0.9)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
                onClick={handleToggleTranslation}
              >
                {isTranslated ? 'Ver original' : 'Traducir'}
              </Button>
            </div>
            <div className="description-box" dangerouslySetInnerHTML={{ __html: isTranslated ? translatedDescription : game.description }} />
          </Col>

          {/* Columna Derecha: Valoraciones */}
          <Col md={4}>
            {userRatings.length > 0 && (
              <Card>
                <Card.Header as="h6" className="bg-secondary text-white">
                  Valoraciones de usuarios
                </Card.Header>
                <Card.Body>
                  {userRatings.map((r) => (
                    <div key={r.id} className="mb-2">
                      <strong>{r.title}</strong> ({r.count})
                      <ProgressBar now={r.percent} label={`${r.percent.toFixed(1)}%`} className="mt-1" />
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Segunda fila: Capturas y Tráiler */}
        <Row className="g-5 mb-5">
          <Col md={6}>
            {finalScreenshots && finalScreenshots.length > 0 && (
              <Card className="mb-4">
                <Card.Header as="h6" className="bg-secondary text-white">
                  Capturas de pantalla
                </Card.Header>
                <Card.Body className="p-0">
                  <Carousel variant="dark" interval={3000} className="game-detail-carousel px-2 pb-3">
                    {finalScreenshots.map((shot) => (
                      <Carousel.Item key={shot.id}>
                        <img
                          className="d-block w-100"
                          src={shot.image}
                          alt={`Captura ${shot.id}`}
                          style={{ height: '350px', objectFit: 'cover' }}
                        />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                </Card.Body>
              </Card>
            )}
          </Col>
          <Col md={6}>
            {trailerUrl ? (
              <Card className="mb-4">
                <Card.Header as="h6" className="bg-secondary text-white">
                  Tráiler
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="video-container">
                    <iframe
                      src={trailerUrl}
                      title="Tráiler de Videojuego"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </Card.Body>
                <Card.Footer className="text-center">
                  <Button variant="outline-primary" as="a" href={externalTrailerUrl} target="_blank" rel="noopener noreferrer">
                    Ver Tráiler en Nueva Pestaña
                  </Button>
                </Card.Footer>
              </Card>
            ) : (
              <Card className="mb-4">
                <Card.Header as="h6" className="bg-secondary text-white">
                  Tráiler
                </Card.Header>
                <Card.Body className="p-3 text-center">
                  <p>Tráiler no disponible</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Sección de Juegos Recomendados */}
      <Container fluid className="mb-5 mt-4 px-4">
        {recommendedGames.length > 0 ? (
          <>
            <h2 className="mb-4">Juegos recomendados</h2>
            <Row xs={1} sm={2} md={3} lg={4} xxl={5} className="g-4">
              {recommendedGames.map((rg) => (
                <Col key={rg.id}>
                  <div className="similar-card">
                    <div className="similar-card-bg" style={{ backgroundImage: `url(${rg.background_image})` }}>
                      {rg.clip && (
                        <div className="similar-card-play">
                          <FaPlay />
                        </div>
                      )}
                      <div className="similar-card-overlay">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          {rg.metacritic && (
                            <span className="badge bg-danger me-2">MC {rg.metacritic}</span>
                          )}
                          {rg.rating_top && (
                            <span className="badge bg-secondary">{rg.rating_top}★</span>
                          )}
                        </div>
                        <h6 className="similar-card-title">{rg.name}</h6>
                        <Link to={`/game/${rg.id}`} className="btn btn-sm btn-light mt-2">
                          Ver Detalle
                        </Link>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </>
        ) : (
          <h5 className="text-center">No se encontraron juegos recomendados.</h5>
        )}
      </Container>

      <Card className="mt-4">
        <Card.Footer className="text-muted fst-italic text-center">
          Datos proporcionados por RAWG.io
        </Card.Footer>
      </Card>
    </div>
  );
};

export default GameDetail;
