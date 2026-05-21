class SquadManager {
  constructor(initialSquads = []) {
    this.squads = initialSquads || [];
  }

  createSquad(name, size = 4, gold = 150, posX = 630, posY = 1425) {
    return {
      id: `squad-${Date.now()}`,
      name: name,
      size: Math.max(1, size),
      gold: Math.max(0, gold),
      inventory: [],
      hiredPersonnel: [],
      route: [],
      currentRouteNodeIdx: 0,
      progressToNextNode: 0,
      status: 'Отдых',
      posX: posX,
      posY: posY
    };
  }

  addSquad(squad) {
    if (!squad.id) squad.id = `squad-${Date.now()}`;
    this.squads.push(squad);
    return squad;
  }

  getSquad(squadId) {
    return this.squads.find(s => s.id === squadId);
  }

  updateSquadSize(squadId, newSize) {
    const sq = this.getSquad(squadId);
    if (sq) sq.size = Math.max(1, parseInt(newSize) || 4);
    return sq;
  }

  splitSquad(squadId, splitSize) {
    const parent = this.getSquad(squadId);
    if (!parent || parent.size <= splitSize) return null;

    parent.size -= splitSize;
    const sharedGold = Math.floor(parent.gold / 2);
    parent.gold -= sharedGold;

    const newSquad = this.createSquad(
      `Отколовшиеся от ${parent.name.split(' ')[0]}`,
      splitSize,
      sharedGold,
      parent.posX,
      parent.posY
    );
    
    this.addSquad(newSquad);
    return newSquad;
  }

  deleteSquad(squadId) {
    const idx = this.squads.findIndex(s => s.id === squadId);
    if (idx > -1) {
      this.squads.splice(idx, 1);
      return true;
    }
    return false;
  }

  getAllSquads() {
    return this.squads;
  }

  initDefault() {
    this.squads = [
      this.createSquad('Искатели Зари (Основной)', 4, 500, 630, 1425),
      this.createSquad('Ночные Призраки', 4, 320, 823, 1955)
    ];
    this.squads[0].inventory = ['Вяленое мясо x10', 'Старая карта местности'];
    this.squads[1].inventory = ['Факелы x5'];
    return this.squads;
  }
}

module.exports = SquadManager;
