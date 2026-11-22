import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Download, ImagePlus, Loader2, RefreshCw, Share2, SwitchCamera, X, AlertTriangle } from 'lucide-react';
import {
  DEFAULT_OVERLAY,
  MAX_SIZE,
  MIN_SIZE,
  buildCaption,
  cameraErrorMessage,
  clampOverlay,
  composePhoto,
  loadImage,
} from '../utils/photoComposer.js';
import { usePrefersReducedMotion } from '../utils/theme.js';

const COUNTDOWN_FROM = 3;

/**
 * Modal photo booth: live camera (or an uploaded photo) with the matched
 * Pokémon's official artwork on top. The user can drag and resize the
 * Pokémon, capture, then download or share. Photos never leave the device.
 */
export default function PhotoBooth({ pokemonName, artwork, percent, theme, onClose }) {
  const dialogRef = useRef(null);
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragRef = useRef(null);
  const requestRef = useRef(0); // invalidates in-flight camera requests

  // phase: starting | live | countdown | capturing | review | error
  const [phase, setPhase] = useState('starting');
  const [error, setError] = useState('');
  const [facing, setFacing] = useState('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 4, height: 3 });
  const [uploaded, setUploaded] = useState(null); // { img, url, width, height }
  const [overlay, setOverlay] = useState(DEFAULT_OVERLAY);
  const [artImage, setArtImage] = useState(null);
  const [artError, setArtError] = useState(false);
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [result, setResult] = useState(null); // { blob, url }
  const [status, setStatus] = useState('');
  const reducedMotion = usePrefersReducedMotion();

  const stopCamera = useCallback(() => {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(
    async (facingMode) => {
      stopCamera();
      const requestId = requestRef.current;
      setError('');
      setPhase('starting');
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setError(cameraErrorMessage({ name: window.isSecureContext ? 'NotFoundError' : 'InsecureContext' }));
        setPhase('error');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        const video = videoRef.current;
        if (requestId !== requestRef.current || !video) {
          // A newer request (or close) superseded this one: release it.
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await new Promise((resolve) => {
          if (video.readyState >= 1) resolve();
          else video.onloadedmetadata = () => resolve();
        });
        await video.play().catch(() => {});
        setFrameSize({ width: video.videoWidth || 4, height: video.videoHeight || 3 });
        setPhase('live');
        navigator.mediaDevices
          .enumerateDevices?.()
          .then((devices) => setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1))
          .catch(() => {});
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setError(cameraErrorMessage(err));
        setPhase('error');
      }
    },
    [stopCamera],
  );

  // Open as a native modal dialog (focus trap + Esc handled by the browser).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const handleClose = () => onClose();
    dialog?.addEventListener('close', handleClose);
    return () => dialog?.removeEventListener('close', handleClose);
  }, [onClose]);

  // Load the artwork in CORS mode so the canvas stays exportable.
  useEffect(() => {
    let active = true;
    loadImage(artwork)
      .then((img) => active && setArtImage(img))
      .catch(() => active && setArtError(true));
    return () => {
      active = false;
    };
  }, [artwork]);

  useEffect(() => {
    startCamera('user');
    return stopCamera;
  }, [startCamera, stopCamera]);

  // Release object URLs when they are replaced or the booth closes.
  useEffect(() => () => uploaded && URL.revokeObjectURL(uploaded.url), [uploaded]);
  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);

  const usingUpload = Boolean(uploaded);
  const mirror = !usingUpload && facing === 'user';

  const capture = useCallback(async () => {
    if (!artImage) return;
    setPhase('capturing');
    try {
      const source = usingUpload ? uploaded.img : videoRef.current;
      const blob = await composePhoto({
        source,
        sourceWidth: usingUpload ? uploaded.width : source.videoWidth,
        sourceHeight: usingUpload ? uploaded.height : source.videoHeight,
        mirror,
        artwork: artImage,
        overlay,
        caption: buildCaption(pokemonName, percent),
        theme,
      });
      stopCamera(); // turn the camera light off while reviewing
      setResult({ blob, url: URL.createObjectURL(blob) });
      setPhase('review');
      setStatus('Photo ready! Download or share it below.');
    } catch {
      setError("We couldn't create your photo. Please try again.");
      setPhase('error');
    }
  }, [artImage, usingUpload, uploaded, mirror, overlay, pokemonName, percent, theme, stopCamera]);

  // Countdown: 3 → 2 → 1 → capture.
  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    if (count === 0) {
      capture();
      return undefined;
    }
    const t = setTimeout(() => setCount((c) => c - 1), reducedMotion ? 700 : 1000);
    return () => clearTimeout(t);
  }, [phase, count, capture, reducedMotion]);

  const startCountdown = () => {
    setStatus('');
    if (usingUpload) {
      capture();
      return;
    }
    setCount(COUNTDOWN_FROM);
    setPhase('countdown');
  };

  const retake = () => {
    setResult(null);
    setStatus('');
    if (usingUpload) setPhase('live');
    else startCamera(facing);
  };

  const switchCamera = () => {
    const next = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    startCamera(next);
  };

  const useCameraInstead = () => {
    setUploaded(null);
    setResult(null);
    startCamera(facing);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      setPhase('error');
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url, { crossOrigin: null });
      stopCamera();
      setResult(null);
      setUploaded({ img, url, width: img.naturalWidth, height: img.naturalHeight });
      setFrameSize({ width: img.naturalWidth, height: img.naturalHeight });
      setError('');
      setPhase('live');
    } catch {
      URL.revokeObjectURL(url);
      setError("We couldn't open that image. Please try a different photo.");
      setPhase('error');
    }
  };

  // ----- Dragging & keyboard positioning of the Pokémon -----
  const onPointerDown = (e) => {
    const frame = frameRef.current?.getBoundingClientRect();
    if (!frame) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const px = (e.clientX - frame.left) / frame.width;
    const py = (e.clientY - frame.top) / frame.height;
    dragRef.current = { dx: px - overlay.x, dy: py - overlay.y };
  };
  const onPointerMove = (e) => {
    const drag = dragRef.current;
    const frameEl = frameRef.current;
    if (!drag || !frameEl) return;
    const frame = frameEl.getBoundingClientRect();
    // Compute now: the state updater may run after pointerup has cleared dragRef.
    const x = (e.clientX - frame.left) / frame.width - drag.dx;
    const y = (e.clientY - frame.top) / frame.height - drag.dy;
    setOverlay((o) => clampOverlay({ ...o, x, y }));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };
  const onOverlayKey = (e) => {
    const step = e.shiftKey ? 0.08 : 0.03;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setOverlay((o) => clampOverlay({ ...o, x: o.x + dx, y: o.y + dy }));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setOverlay((o) => clampOverlay({ ...o, size: o.size + 0.05 }));
    } else if (e.key === '-') {
      e.preventDefault();
      setOverlay((o) => clampOverlay({ ...o, size: o.size - 0.05 }));
    }
  };

  // ----- Save / share -----
  const fileName = `pokematch-${pokemonName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`;
  const shareFile = result ? new File([result.blob], fileName, { type: 'image/jpeg' }) : null;
  const canShareFile = Boolean(shareFile && navigator.canShare?.({ files: [shareFile] }));

  const share = async () => {
    try {
      await navigator.share({ files: [shareFile], title: 'My PokéMatch photo', text: `Me & ${pokemonName} on PokéMatch!` });
      setStatus('Thanks for sharing!');
    } catch (err) {
      if (err?.name !== 'AbortError') setStatus("Sharing isn't available right now. Try Download instead.");
    }
  };

  const showFrame = phase === 'live' || phase === 'countdown' || phase === 'capturing' || phase === 'starting';
  const frameStyle = {
    aspectRatio: `${frameSize.width} / ${frameSize.height}`,
    width: `min(100%, calc(58vh * ${frameSize.width / frameSize.height}))`,
  };

  return (
    <dialog ref={dialogRef} className="booth" aria-labelledby="booth-title" style={{ '--theme': theme }}>
      <div className="booth__header">
        <h2 id="booth-title">
          <Camera size={20} aria-hidden="true" /> Photo with {pokemonName}
        </h2>
        <button type="button" className="booth__close" onClick={() => dialogRef.current?.close()} aria-label="Close photo booth">
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      {artError && (
        <p className="booth__error" role="alert">
          <AlertTriangle size={18} aria-hidden="true" /> We couldn&apos;t load {pokemonName}&apos;s artwork for the photo. Please
          close and try again.
        </p>
      )}

      {/* Live camera / uploaded photo with draggable Pokémon */}
      <div className="booth__stage" hidden={!showFrame}>
        <div className="booth__frame" ref={frameRef} style={frameStyle}>
          <video
            ref={videoRef}
            className={`booth__video${mirror ? ' is-mirrored' : ''}`}
            playsInline
            muted
            autoPlay
            hidden={usingUpload}
            aria-label="Camera preview"
          />
          {usingUpload && <img className="booth__video" src={uploaded.url} alt="Your uploaded photo" />}

          {phase === 'starting' && (
            <div className="booth__overlay-msg" role="status">
              <Loader2 className="spin" size={32} aria-hidden="true" />
              Starting camera…
            </div>
          )}

          {phase !== 'starting' && (
            <img
              src={artwork}
              crossOrigin="anonymous"
              alt=""
              draggable={false}
              className="booth__pokemon"
              style={{ left: `${overlay.x * 100}%`, top: `${overlay.y * 100}%`, width: `${overlay.size * 100}%` }}
              tabIndex={0}
              role="img"
              aria-label={`${pokemonName}. Drag, or use the arrow keys to move it and + or − to resize it.`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={onOverlayKey}
            />
          )}

          {phase === 'countdown' && count > 0 && (
            <div className="booth__countdown" aria-live="assertive" key={count}>
              {count}
            </div>
          )}
          {phase === 'capturing' && <div className="booth__flash" aria-hidden="true" />}
        </div>

        <div className="booth__controls">
          <label className="booth__size">
            <span>Size</span>
            <input
              type="range"
              min={MIN_SIZE * 100}
              max={MAX_SIZE * 100}
              value={Math.round(overlay.size * 100)}
              onChange={(e) => setOverlay((o) => clampOverlay({ ...o, size: Number(e.target.value) / 100 }))}
              aria-label={`${pokemonName} size`}
            />
          </label>
          <p className="booth__hint">Drag {pokemonName} to place it.</p>
        </div>

        <div className="booth__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={startCountdown}
            disabled={phase !== 'live' || !artImage}
          >
            <Camera size={18} aria-hidden="true" /> {usingUpload ? 'Create Photo' : 'Take Photo'}
          </button>
          {!usingUpload && hasMultipleCameras && (
            <button type="button" className="btn btn--secondary" onClick={switchCamera} disabled={phase !== 'live'}>
              <SwitchCamera size={18} aria-hidden="true" /> Flip
            </button>
          )}
          {usingUpload ? (
            <button type="button" className="btn btn--ghost" onClick={useCameraInstead}>
              <Camera size={18} aria-hidden="true" /> Use Camera
            </button>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus size={18} aria-hidden="true" /> Upload Photo
            </button>
          )}
        </div>
      </div>

      {phase === 'error' && (
        <div className="booth__message" role="alert">
          <AlertTriangle size={36} aria-hidden="true" />
          <p>{error}</p>
          <div className="booth__actions">
            <button type="button" className="btn btn--primary" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus size={18} aria-hidden="true" /> Upload a Photo
            </button>
            <button type="button" className="btn btn--secondary" onClick={useCameraInstead}>
              <RefreshCw size={18} aria-hidden="true" /> Try Camera Again
            </button>
          </div>
        </div>
      )}

      {phase === 'review' && result && (
        <div className="booth__review">
          <img src={result.url} alt={`Your photo with ${pokemonName}`} className="booth__result" />
          <div className="booth__actions">
            <a className="btn btn--primary" href={result.url} download={fileName}>
              <Download size={18} aria-hidden="true" /> Download
            </a>
            {canShareFile && (
              <button type="button" className="btn btn--secondary" onClick={share}>
                <Share2 size={18} aria-hidden="true" /> Share
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={retake}>
              <RefreshCw size={18} aria-hidden="true" /> Retake
            </button>
          </div>
        </div>
      )}

      <p className="booth__status" role="status" aria-live="polite">
        {status}
      </p>
      <p className="booth__privacy">🔒 Your photo is created on your device and is never uploaded.</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleUpload}
      />
    </dialog>
  );
}
