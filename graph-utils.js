/**
 * Graph utilities module for pathfinding and distance calculations
 * Pure functions with no side effects - all required data passed as parameters
 */

/**
 * Calculates the total distance in a chain of nodes using Euclidean distance
 * @param {Array<{x: number, y: number}>} chain - Array of node objects with x, y coordinates
 * @returns {number} Total distance in the chain, or 100 if chain is empty/invalid
 */
function calculateChainDistance(chain) {
    let d = 0;
    for (let i = 0; i < chain.length - 1; i++) {
        d += Math.hypot(chain[i+1].x - chain[i].x, chain[i+1].y - chain[i].y);
    }
    return d > 0 ? d : 100;
}

/**
 * Finds a path between two nodes in a graph
 * Currently returns a direct connection between start and end nodes
 * Future enhancement: implement A* or Dijkstra's algorithm for more complex pathfinding
 * @param {string} startId - ID of the starting node
 * @param {string} endId - ID of the ending node
 * @param {Object} graph - Graph object containing nodes array
 * @param {Array<{id: string, x: number, y: number}>} graph.nodes - Array of all nodes in the graph
 * @returns {Array<{x: number, y: number}>} Array of nodes representing the path from start to end
 */
function findSubPath(startId, endId, graph) {
    if (!graph || !graph.nodes) {
        return [];
    }
    
    const startNode = graph.nodes.find(n => n.id === startId);
    const endNode = graph.nodes.find(n => n.id === endId);
    
    if (!startNode || !endNode) {
        return [];
    }
    
    // Direct connection between start and end nodes
    return [startNode, endNode];
}

/**
 * Builds a complete path chain from multiple target points
 * @param {Array<string>} targetPoints - Array of node IDs representing waypoints
 * @param {Object} graph - Graph object containing nodes array
 * @param {Array<{id: string, x: number, y: number}>} graph.nodes - Array of all nodes in the graph
 * @returns {Array<{id: string, x: number, y: number}>} Chain of nodes forming the complete path
 */
function buildPathChain(targetPoints, graph) {
    if (!targetPoints || targetPoints.length === 0 || !graph || !graph.nodes) {
        return [];
    }
    
    let pathChain = [];
    
    for (let i = 0; i < targetPoints.length - 1; i++) {
        const subPath = findSubPath(targetPoints[i], targetPoints[i + 1], graph);
        
        if (subPath.length > 0) {
            // Remove duplicate node at junction point (except for first iteration)
            if (i > 0 && subPath.length > 0) {
                subPath.shift();
            }
            pathChain = pathChain.concat(subPath);
        }
    }
    
    // Fallback: if no path found, use direct node references
    if (pathChain.length === 0) {
        pathChain = targetPoints
            .map(id => graph.nodes.find(n => n.id === id))
            .filter(Boolean);
    }
    
    return pathChain;
}

/**
 * Calculates the distance between two nodes in 2D space
 * @param {Object} node1 - First node with x, y coordinates
 * @param {Object} node2 - Second node with x, y coordinates
 * @returns {number} Euclidean distance between the two nodes
 */
function calculateDistance(node1, node2) {
    if (!node1 || !node2) {
        return 0;
    }
    return Math.hypot(node2.x - node1.x, node2.y - node1.y);
}

/**
 * Finds all nodes within a given distance from a reference node
 * @param {Object} referenceNode - Node with x, y coordinates
 * @param {Array<Object>} nodes - Array of nodes to search within
 * @param {number} maxDistance - Maximum distance threshold
 * @returns {Array<Object>} Array of nodes within the specified distance
 */
function findNodesWithinDistance(referenceNode, nodes, maxDistance) {
    if (!referenceNode || !nodes || !Array.isArray(nodes)) {
        return [];
    }
    
    return nodes.filter(node => {
        if (node.id === referenceNode.id) {
            return false;
        }
        const distance = calculateDistance(referenceNode, node);
        return distance <= maxDistance;
    });
}

/**
 * Finds the nearest node to a reference node
 * @param {Object} referenceNode - Node with x, y coordinates
 * @param {Array<Object>} nodes - Array of nodes to search within
 * @returns {Object|null} The nearest node, or null if no nodes available
 */
function findNearestNode(referenceNode, nodes) {
    if (!referenceNode || !nodes || nodes.length === 0) {
        return null;
    }
    
    let nearest = null;
    let minDistance = Infinity;
    
    for (const node of nodes) {
        if (node.id === referenceNode.id) {
            continue;
        }
        const distance = calculateDistance(referenceNode, node);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = node;
        }
    }
    
    return nearest;
}
