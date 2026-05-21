class MarketSystem {
  constructor() {
    this.catalog = {
      gear: [
        { id: 'rations', name: 'Дорожные рационы (на 4х)', cost: 5, desc: 'Запас пищи на день.' },
        { id: 'tent', name: 'Большая походная палатка', cost: 20, desc: 'Защита от суровых погодных условий.' },
        { id: 'potion', name: 'Целебное зелье Алхимика', cost: 50, desc: 'Мгновенно снимает эффекты ран.' }
      ],
      mounts: [
        { id: 'draft_horse', name: 'Лошадь-тяжеловоз', cost: 75, desc: 'Повышает грузоподъемность отряда.' },
        { id: 'riding_horse', name: 'Ездовой боевой конь', cost: 150, desc: 'Увеличивает скорость движения на 25%.' },
        { id: 'wagon', name: 'Укрепленная повозка', cost: 35, desc: 'Позволяет перевозить раненых.' }
      ],
      mercenaries: [
        { id: 'guide', name: 'Проводник Следопыт', cost: 5, desc: 'Снижает шанс опасных столкновений в симуляции.' },
        { id: 'guard', name: 'Наёмный мечник-ветеран', cost: 12, desc: 'Повышает боевой потенциал отряда при атаке.' },
        { id: 'healer', name: 'Полевой лекарь', cost: 15, desc: 'Автоматически лечит отряд во время отдыха.' }
      ]
    };
  }

  getCatalog(category = null) {
    if (category) return this.catalog[category] || [];
    return this.catalog;
  }

  getItem(itemId, category) {
    const items = this.catalog[category] || [];
    return items.find(i => i.id === itemId);
  }

  canAfford(squad, cost) {
    return squad && squad.gold >= cost;
  }

  buyItem(squad, itemId, category) {
    if (!squad) return { success: false, error: 'Squad not found' };
    
    const item = this.getItem(itemId, category);
    if (!item) return { success: false, error: 'Item not found' };
    
    if (!this.canAfford(squad, item.cost)) {
      return { success: false, error: 'Недостаточно золота' };
    }

    squad.gold -= item.cost;

    if (category === 'mercenaries') {
      squad.hiredPersonnel.push({ id: item.id, name: item.name });
      return { 
        success: true, 
        message: `Отряд нанял: ${item.name}`,
        type: 'hire'
      };
    } else {
      squad.inventory.push(item.name);
      return { 
        success: true, 
        message: `Отряд приобрел: ${item.name}`,
        type: 'purchase'
      };
    }
  }

  getSquadInventoryValue(squad) {
    let value = 0;
    Object.values(this.catalog).forEach(category => {
      squad.inventory.forEach(invItem => {
        const item = category.find(i => i.name === invItem);
        if (item) value += item.cost;
      });
    });
    return value;
  }
}

module.exports = MarketSystem;
