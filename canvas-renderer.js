/**
 * Canvas Renderer Module
 * Handles all canvas drawing and interaction for the D&D map visualization
 */

/**
 * Initialize canvas pointer and touch event listeners
 * @param {HTMLCanvasElement} canvas - The canvas element to attach listeners to
 * @param {Object} mapState - State object containing map transformation data
 * @param {number} mapState.translateX - Horizontal translation
 * @param {number} mapState.translateY - Vertical translation
 * @param {number} mapState.mapScale - Current zoom scale
 * @param {Array} mapState.evCache - Pointer event cache
 * @param {number} mapState.prevDiff - Previous touch distance for pinch detection
 */
function setupCanvasInteraction(canvas, mapState) {
  let startX = 0;
  let startY = 0;

  // Support for mouse and touchscreen via Pointer Events
  canvas.addEventListener('pointerdown', e => {
    mapState.evCache.push(e);
    mapState.isDragging = true;
    startX = e.clientX - mapState.translateX;
    startY = e.clientY - mapState.translateY;
  });

  canvas.addEventListener('pointermove', e => {
    const idx = mapState.evCache.findIndex(ev => ev.pointerId === e.pointerId);
    if (idx > -1) mapState.evCache[idx] = e;

    // Handle Pinch-to-Zoom (two-finger touch on tablet)
    if (mapState.evCache.length === 2) {
      const curDiff = Math.hypot(
        mapState.evCache[0].clientX - mapState.evCache[1].clientX,
        mapState.evCache[0].clientY - mapState.evCache[1].clientY
      );
      if (mapState.prevDiff > 0) {
        const delta = curDiff / mapState.prevDiff;
        const midX = (mapState.evCache[0].clientX + mapState.evCache[1].clientX) / 2;
        const midY = (mapState.evCache[0].clientY + mapState.evCache[1].clientY) / 2;
        zoomMapAtPoint(midX, midY, delta, mapState, canvas);
      }
      mapState.prevDiff = curDiff;
    }
    // Standard dragging (single finger or mouse)
    else if (mapState.isDragging && mapState.evCache.length === 1) {
      mapState.translateX = e.clientX - startX;
      mapState.translateY = e.clientY - startY;
    }
  });

  const stopDrag = e => {
    const idx = mapState.evCache.findIndex(ev => ev.pointerId === e.pointerId);
    if (idx > -1) mapState.evCache.splice(idx, 1);
    if (mapState.evCache.length < 2) mapState.prevDiff = -1;
    if (mapState.evCache.length === 0) mapState.isDragging = false;
  };

  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('pointerleave', stopDrag);

  // Mouse wheel zoom
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoomMapAtPoint(e.clientX, e.clientY, factor, mapState, canvas);
  }, { passive: false });
}

/**
 * Zoom the map at a specific point with bounds checking
 * @param {number} clientX - Client X coordinate
 * @param {number} clientY - Client Y coordinate
 * @param {number} factor - Zoom factor (>1 for zoom in, <1 for zoom out)
 * @param {Object} mapState - Map state object
 * @param {HTMLCanvasElement} canvas - Canvas element for bounds calculation
 */
function zoomMapAtPoint(clientX, clientY, factor, mapState, canvas) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;

  const mapX = (mouseX - mapState.translateX) / mapState.mapScale;
  const mapY = (mouseY - mapState.translateY) / mapState.mapScale;

  mapState.mapScale *= factor;
  mapState.mapScale = Math.max(0.05, Math.min(mapState.mapScale, 4.0));

  mapState.translateX = mouseX - mapX * mapState.mapScale;
  mapState.translateY = mouseY - mapY * mapState.mapScale;
}

/**
 * Main draw function for the map canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} mapState - Map state with translation and scale
 * @param {Object} graph - Graph object with nodes array
 * @param {Array} squads - Array of squad objects with posX, posY, status, name
 * @param {Array} activeRouteVariants - Array of active route variants
 * @param {number} selectedVariantIndex - Index of selected route variant
 */
function drawMap(canvas, ctx, mapState, graph, squads, activeRouteVariants, selectedVariantIndex) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(mapState.translateX, mapState.translateY);
  ctx.scale(mapState.mapScale, mapState.mapScale);

  // 1. Draw background grid of graph coordinates
  ctx.strokeStyle = '#141923';
  ctx.lineWidth = 1;
  const gridSize = 200;
  for (let x = -2000; x < 6000; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, -2000);
    ctx.lineTo(x, 6000);
    ctx.stroke();
  }
  for (let y = -2000; y < 6000; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(-2000, y);
    ctx.lineTo(6000, y);
    ctx.stroke();
  }

  // 2. Draw active route lines of selected variant
  if (activeRouteVariants.length > 0 && activeRouteVariants[selectedVariantIndex]) {
    const routeNodes = activeRouteVariants[selectedVariantIndex].nodes;
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.setLineDash([12, 8]);
    for (let i = 0; i < routeNodes.length; i++) {
      if (i === 0) ctx.moveTo(routeNodes[i].x, routeNodes[i].y);
      else ctx.lineTo(routeNodes[i].x, routeNodes[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 3. Draw graph nodes
  graph.nodes.forEach(node => {
    if (node.type === 'city') {
      // Large hub cities
      ctx.beginPath();
      ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.fill();
      ctx.stroke();

      // Text labels
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(node.name, node.x + 24, node.y + 8);
    } else {
      // Waypoints
      ctx.beginPath();
      ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#475569';
      ctx.fill();
    }
  });

  // 4. Draw squad markers in real-time
  squads.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.posX, s.posY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = s.status === 'Столкновение' ? '#e11d48' : '#10b981';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    // Squad name above avatar
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px font-mono';
    ctx.fillText(`[${s.name.split(' ')[0]}]`, s.posX - 40, s.posY - 28);
  });

  ctx.restore();
}
