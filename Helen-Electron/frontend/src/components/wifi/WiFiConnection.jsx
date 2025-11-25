/**
 * WiFi Component: WiFi connection interface with QR code generation
 * Supports QR-based WiFi sharing for easy connection
 * Optimized for performance with memoization and callback stability
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { GlassCard } from '../glass/GlassCard';
import { GlassButton } from '../glass/GlassButton';
import { wifiService } from '../../services/features/wifiService';
import './WiFiConnection.css';

// Memoized network item component to prevent unnecessary re-renders
const NetworkItem = memo(({ network, onSelect, getSignalIcon }) => (
    <GlassCard
        hoverable
        onClick={() => onSelect(network)}
        className="wifi-network-item"
    >
        <span className="material-icons-outlined wifi-network-item__signal">
            {getSignalIcon(network.signal)}
        </span>
        <div className="wifi-network-item__info">
            <h4>{network.ssid}</h4>
            <p>
                {network.security === 'nopass' ? 'Abierta' : network.security}
            </p>
        </div>
        <span className="material-icons-outlined wifi-network-item__arrow">
            chevron_right
        </span>
    </GlassCard>
));

NetworkItem.displayName = 'NetworkItem';

export const WiFiConnection = () => {
    const [availableNetworks, setAvailableNetworks] = useState([]);
    const [currentNetwork, setCurrentNetwork] = useState(null);
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [qrData, setQRData] = useState(null);
    const [view, setView] = useState('list'); // 'list', 'connect', 'qr'

    const loadNetworks = useCallback(async () => {
        try {
            setLoading(true);
            const networks = await wifiService.getAvailableNetworks();
            setAvailableNetworks(networks);
        } catch (err) {
            setError('Error al cargar redes WiFi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadStatus = useCallback(async () => {
        try {
            const status = await wifiService.getConnectionStatus();
            setCurrentNetwork(status.current_network);
        } catch (err) {
            console.error('Error loading WiFi status:', err);
        }
    }, []);

    // Run after callbacks are defined to avoid TDZ errors
    useEffect(() => {
        loadNetworks();
        loadStatus();
    }, [loadNetworks, loadStatus]);

    const handleNetworkSelect = useCallback((network) => {
        setSelectedNetwork(network);
        setPassword('');
        setError(null);
        setView('connect');
    }, []);

    const handleConnect = useCallback(async () => {
        if (!selectedNetwork) return;

        try {
            setLoading(true);
            setError(null);

            const result = await wifiService.connectToNetwork(
                selectedNetwork.ssid,
                password,
                selectedNetwork.security
            );

            if (result.success) {
                await loadStatus();
                setView('list');
                setSelectedNetwork(null);
                setPassword('');
            } else {
                setError(result.message || 'Error al conectar');
            }
        } catch (err) {
            setError('Error al conectar a la red');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedNetwork, password, loadStatus]);

    const handleGenerateQR = useCallback(async () => {
        if (!currentNetwork) return;

        try {
            setLoading(true);
            const qr = await wifiService.generateWiFiQR(
                currentNetwork.ssid,
                password || '', // You might want to store/retrieve the actual password
                currentNetwork.security
            );
            setQRData(qr);
            setView('qr');
        } catch (err) {
            setError('Error al generar código QR');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentNetwork, password]);

    // Memoize signal icon function to prevent recreation
    const getSignalIcon = useCallback((signal) => {
        if (signal >= 75) return 'wifi';
        if (signal >= 50) return 'wifi_2_bar';
        if (signal >= 25) return 'wifi_1_bar';
        return 'wifi_off';
    }, []);

    // Memoize network list to prevent re-renders when other state changes
    const networkList = useMemo(() => (
        availableNetworks.map((network, index) => (
            <NetworkItem
                key={`${network.ssid}-${index}`}
                network={network}
                onSelect={handleNetworkSelect}
                getSignalIcon={getSignalIcon}
            />
        ))
    ), [availableNetworks, handleNetworkSelect, getSignalIcon]);

    return (
        <div className="wifi-connection">
            {view === 'list' && (
                <>
                    {/* Current Connection */}
                    {currentNetwork && (
                        <GlassCard className="wifi-current">
                            <div className="wifi-current__header">
                                <span className="material-icons-outlined">wifi</span>
                                <div className="wifi-current__info">
                                    <h3>{currentNetwork.ssid}</h3>
                                    <p>Conectado · {currentNetwork.ip_address}</p>
                                </div>
                            </div>
                            <div className="wifi-current__actions">
                                <GlassButton
                                    onClick={handleGenerateQR}
                                    variant="secondary"
                                    size="small"
                                >
                                    <span className="material-icons-outlined">qr_code_2</span>
                                    Compartir QR
                                </GlassButton>
                            </div>
                        </GlassCard>
                    )}

                    {/* Available Networks */}
                    <div className="wifi-networks">
                        <h3 className="wifi-networks__title">Redes disponibles</h3>
                        {loading ? (
                            <p className="wifi-loading">Buscando redes...</p>
                        ) : (
                            <div className="wifi-networks__list">
                                {networkList}
                            </div>
                        )}
                    </div>

                    <GlassButton onClick={loadNetworks} variant="secondary" disabled={loading}>
                        <span className="material-icons-outlined">refresh</span>
                        Actualizar
                    </GlassButton>
                </>
            )}

            {view === 'connect' && selectedNetwork && (
                <div className="wifi-connect">
                    <GlassButton
                        variant="icon"
                        onClick={() => setView('list')}
                        className="wifi-back"
                    >
                        <span className="material-icons-outlined">arrow_back</span>
                    </GlassButton>

                    <h3 className="wifi-connect__title">{selectedNetwork.ssid}</h3>
                    <p className="wifi-connect__security">{selectedNetwork.security}</p>

                    {selectedNetwork.security !== 'nopass' && (
                        <div className="wifi-connect__password">
                            <label htmlFor="wifi-password">Contraseña</label>
                            <input
                                id="wifi-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingrese la contraseña"
                                className="wifi-input"
                            />
                        </div>
                    )}

                    {error && <p className="wifi-error">{error}</p>}

                    <div className="wifi-connect__actions">
                        <GlassButton
                            onClick={handleConnect}
                            disabled={loading || (selectedNetwork.security !== 'nopass' && !password)}
                            size="large"
                        >
                            {loading ? 'Conectando...' : 'Conectar'}
                        </GlassButton>
                        <GlassButton
                            onClick={() => setView('list')}
                            variant="secondary"
                        >
                            Cancelar
                        </GlassButton>
                    </div>
                </div>
            )}

            {view === 'qr' && qrData && (
                <div className="wifi-qr">
                    <GlassButton
                        variant="icon"
                        onClick={() => setView('list')}
                        className="wifi-back"
                    >
                        <span className="material-icons-outlined">arrow_back</span>
                    </GlassButton>

                    <h3 className="wifi-qr__title">Compartir WiFi</h3>
                    <p className="wifi-qr__description">
                        Escanea este código QR para conectarte a {currentNetwork?.ssid}
                    </p>

                    <div className="wifi-qr__code">
                        {qrData.format === 'svg' ? (
                            <img
                                src={qrData.qrCode}
                                alt="WiFi QR Code"
                                className="wifi-qr__image"
                            />
                        ) : (
                            <div className="wifi-qr__placeholder">
                                <span className="material-icons-outlined">qr_code_2</span>
                                <p>Código QR</p>
                            </div>
                        )}
                    </div>

                    <div className="wifi-qr__info">
                        <p className="wifi-qr__string">{qrData.wifiString}</p>
                    </div>

                    <GlassButton onClick={() => setView('list')} variant="secondary">
                        Cerrar
                    </GlassButton>
                </div>
            )}
        </div>
    );
};
