import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Inicio = () => {
    const [releases, setReleases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/releases/');
                setReleases(response.data);
            } catch (err) {
                setFetchError('Error al cargar las actualizaciones.');
                console.error('Error fetching releases:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReleases();
    }, []);

    if (isLoading) {
        return <div className="loading-message">Cargando actualizaciones...</div>;
    }

    if (fetchError) {
        return <div className="error-message">{fetchError}</div>;
    }

    return (
        <div className="inicio-container">
            <h1 className="inicio-title">¡Bienvenido a CardTrack!</h1>
            <p className="inicio-welcome-text">
                Mantente al día con las últimas mejoras y características de CardTrack.
            </p>

            <h2 className="updates-subtitle">Últimas Actualizaciones</h2>
            {releases.length > 0 ? (
                <div className="updates-grid">
                    {releases.map((release) => (
                        <div key={release.id} className="update-card">
                            <h3 className="update-card-title">{release.release_title}</h3>
                            <p className="update-card-date">
                                {new Date(release.release_date).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            <p>{release.release_description}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-updates-message">No hay actualizaciones disponibles en este momento.</p>
            )}
        </div>
    );
};

export default Inicio;
