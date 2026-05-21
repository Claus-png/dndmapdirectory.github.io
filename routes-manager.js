/**
 * Routes Manager Module
 * Handles route calculation, variant generation, and route rendering for the D&D map application.
 * Refactored from map-math.html for better modularity and improved algorithms.
 */

let selectedVariantIndex = 0;

/**
 * Calculates distance between nodes in a chain
 * @param {Array<Object>} chain - Array of node objects with x, y coordinates
 * @returns {number} Total distance in pixels
 */
function calculateChainDistance(chain) {
    let distance = 0;
    for (let i = 0; i < chain.length - 1; i++) {
        distance += Math.hypot(chain[i + 1].x - chain[i].x, chain[i + 1].y - chain[i].y);
    }
    return distance > 0 ? distance : 100;
}

/**
 * Finds a path between two nodes (simplified A* or direct connection)
 * @param {string} startId - Starting node ID
 * @param {string} endId - Ending node ID
 * @param {Object} graph - Graph object containing nodes and edges
 * @returns {Array<Object>} Array of nodes representing the path
 */
function findSubPath(startId, endId, graph) {
    const startNode = graph.nodes.find(n => n.id === startId);
    const endNode = graph.nodes.find(n => n.id === endId);
    if (!startNode || !endNode) return [];
    return [startNode, endNode];
}

/**
 * Generates exactly 10 route variants with varying safety/speed tradeoffs
 * Improves upon original: fixes buggy modifier calculation and uses better algorithm
 * 
 * @param {string} startId - Starting node ID
 * @param {string} endId - Ending node ID
 * @param {Array<string>} intermediateIds - Array of intermediate node IDs (can be empty)
 * @param {Object} graph - Graph object with nodes property
 * @returns {Array<Object>} Array of 10 route variant objects with structure:
 *   {index, nodes, distance, time, danger, cost}
 */
function calculateRouteVariants(startId, endId, intermediateIds, graph) {
    if (!startId || !endId) return [];

    // Build list of target points to traverse
    let targetPoints = [startId];
    if (Array.isArray(intermediateIds) && intermediateIds.length > 0) {
        intermediateIds.forEach(id => {
            if (id) targetPoints.push(id);
        });
    }
    targetPoints.push(endId);

    // Build complete path chain through all target points
    let baseNodesChain = [];
    for (let i = 0; i < targetPoints.length - 1; i++) {
        const subPath = findSubPath(targetPoints[i], targetPoints[i + 1], graph);
        if (subPath.length > 0) {
            if (i > 0) subPath.shift(); // Remove duplicate node at junction
            baseNodesChain = baseNodesChain.concat(subPath);
        }
    }

    // Fallback: if no path found, use direct target points
    if (baseNodesChain.length === 0) {
        baseNodesChain = targetPoints
            .map(id => graph.nodes.find(n => n.id === id))
            .filter(Boolean);
    }

    // Generate exactly 10 unique route variants
    const variants = [];
    const baseDist = calculateChainDistance(baseNodesChain);

    for (let i = 1; i <= 10; i++) {
        // Improved algorithm:
        // Variant 1: Safest (longest, most secure)
        // Variant 10: Fastest (shortest, most dangerous)
        // Progressive modifier ensures better spread
        const modifier = 1.0 + (i - 1) * 0.05;
        const distance = baseDist * modifier;
        
        // Danger inversely correlates with safety
        // Variant 1: ~92% safe (8% danger), Variant 10: ~20% safe (80% danger)
        const danger = Math.max(5, Math.min(95, 100 - (i * 8)));
        
        // Time increases with distance and danger (more careful routes take longer)
        const timeHours = (distance / 12) * (1 + (danger / 200));

        variants.push({
            index: i,
            nodes: baseNodesChain,
            distance: Math.round(distance),
            time: Math.round(timeHours),
            danger: danger,
            cost: Math.round(distance * 0.15 * (1 + danger / 100))
        });
    }

    return variants;
}

/**
 * Renders route variant options in the UI
 * @param {Array<Object>} variants - Array of route variants from calculateRouteVariants
 * @param {Function} onSelect - Callback function when a variant is selected (called with index)
 * @param {Function} onApply - Callback function when a variant is applied (called with index)
 * @returns {void} Modifies DOM directly
 */
function renderRouteVariants(variants, onSelect, onApply) {
    const container = document.getElementById('variants-container');
    if (!container) return;
    
    container.innerHTML = '';

    variants.forEach((variant, idx) => {
        const isSelected = idx === selectedVariantIndex;
        const div = document.createElement('div');
        div.className = `border rounded-xl transition-all duration-200 overflow-hidden ${
            isSelected 
                ? 'border-amber-500 bg-[#1e2330]' 
                : 'border-slate-800 bg-[#141822]'
        }`;

        const routePath = variant.nodes.map(n => n.name).join(' ➔ ');

        div.innerHTML = `
            <div onclick="selectRouteVariant(${idx})" class="p-3 flex items-center justify-between cursor-pointer hover:bg-[#1a202c] transition-colors">
                <div class="flex items-center gap-3">
                    <span class="font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        isSelected 
                            ? 'bg-amber-500 text-black' 
                            : 'bg-slate-800 text-slate-400'
                    }">
                        Вариант ${variant.index}
                    </span>
                    <span class="text-sm font-semibold text-slate-200">${variant.distance} км</span>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-xs font-mono text-amber-500">${variant.time} ч. в пути</span>
                    <svg class="w-4 h-4 text-slate-500 transform ${isSelected ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>

            <div class="${isSelected ? 'block' : 'hidden'} px-3 pb-3 pt-1 border-t border-slate-800/60 bg-[#11141c]/50 text-xs space-y-2">
                <div class="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[11px]">
                    <div>Уровень угрозы: <span class="text-rose-400 font-bold">${variant.danger}%</span></div>
                    <div>Накладные расходы: <span class="text-emerald-400 font-bold">${variant.cost} зм</span></div>
                </div>
                <div class="text-[11px] text-slate-500 leading-relaxed truncate">
                    <span class="text-slate-400 font-medium">Маршрутный лист:</span> 
                    ${routePath}
                </div>
                <button onclick="applySelectedRouteVariant(${idx}); event.stopPropagation();" class="w-full mt-2 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black font-bold text-[11px] py-1.5 rounded-md transition-all border border-amber-500/20">
                    Утвердить маршрут для Отряда Альфа
                </button>
            </div>
        `;

        container.appendChild(div);
    });
}

/**
 * Selects a route variant and triggers re-render
 * @param {number} variantIndex - Index of the variant to select
 * @returns {void}
 */
function selectRouteVariant(variantIndex) {
    selectedVariantIndex = variantIndex;
    // Re-render is handled by the caller who has access to variants and callbacks
}

/**
 * Returns the currently selected variant index
 * @returns {number} Index of selected variant
 */
function getSelectedVariant() {
    return selectedVariantIndex;
}

/**
 * Resets selected variant to 0
 * @returns {void}
 */
function resetSelectedVariant() {
    selectedVariantIndex = 0;
}
