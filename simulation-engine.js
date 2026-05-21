class SimulationEngine {
  constructor(options = {}) {
    this.collisionChance = options.collisionChance || 15;
    this.eventLog = [];
    this.paused = false;
  }

  step(squads, graph) {
    if (this.paused) return [];
    if (!squads || !Array.isArray(squads)) return [];

    const events = [];

    squads.forEach(s => {
      if (s.status === 'В пути' && s.route && s.route.length > 0) {
        s.progressToNextNode += 0.25;

        const curr = s.route[s.currentRouteNodeIdx];
        const next = s.route[s.currentRouteNodeIdx + 1];
        if (next) {
          s.posX = curr.x + (next.x - curr.x) * s.progressToNextNode;
          s.posY = curr.y + (next.y - curr.y) * s.progressToNextNode;
        }

        if (Math.random() * 100 < this.collisionChance) {
          s.status = 'Столкновение';
          const event = {
            type: 'collision',
            message: `⚠️ Отряд [${s.name}] попал в засаду!`,
            squad: s.id,
            timestamp: Date.now()
          };
          events.push(event);
          this.logEvent(event);
        }

        if (s.progressToNextNode >= 1.0) {
          s.progressToNextNode = 0;
          s.currentRouteNodeIdx++;

          if (s.currentRouteNodeIdx >= s.route.length - 1) {
            s.status = 'Отдых';
            s.route = [];
            const event = {
              type: 'arrival',
              message: `🏁 Отряд [${s.name}] завершил маршрут!`,
              squad: s.id,
              timestamp: Date.now()
            };
            events.push(event);
            this.logEvent(event);
          } else {
            const event = {
              type: 'progress',
              message: `📍 Отряд [${s.name}] достиг чекпоинта: ${s.route[s.currentRouteNodeIdx].name}`,
              squad: s.id,
              timestamp: Date.now()
            };
            events.push(event);
            this.logEvent(event);
          }
        }
      }
    });

    return events;
  }

  setCollisionChance(chance) {
    this.collisionChance = Math.max(0, Math.min(100, chance));
  }

  logEvent(event) {
    if (!event.timestamp) event.timestamp = Date.now();
    this.eventLog.push(event);
    if (this.eventLog.length > 1000) this.eventLog.shift();
  }

  getEventLog() {
    return [...this.eventLog];
  }

  clearLog() {
    this.eventLog = [];
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  isPaused() {
    return this.paused;
  }
}

module.exports = SimulationEngine;
