export function shuffle(values) {
  const result = [...values];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function categoryKey(category) {
  return encodeURIComponent(category).replaceAll(".", "%2E");
}

export function getCategories(cards) {
  return [...new Set(cards.map((card) => card.category).filter(Boolean))];
}

export function makeCardOrder(cards, category) {
  const indexes = [];

  cards.forEach((card, index) => {
    if (card.category === category) indexes.push(index);
  });

  return shuffle(indexes);
}

export function makeAllDecks(cards, categories) {
  const decks = {};

  categories.forEach((category) => {
    decks[categoryKey(category)] = {
      category,
      order: makeCardOrder(cards, category),
      position: 0
    };
  });

  return decks;
}

export function getCurrentCategory(game) {
  const order = Array.isArray(game.categoryOrder) ? game.categoryOrder : [];
  if (order.length === 0) return "";
  return order[Number(game.categoryPosition ?? 0)] ?? order[0];
}

export function getCurrentCardIndex(game) {
  const category = getCurrentCategory(game);
  const deck = game.decks?.[categoryKey(category)];
  if (!deck?.order?.length) return -1;
  return deck.order[Number(deck.position ?? 0)] ?? -1;
}

export function advanceCard(game, cards) {
  const category = getCurrentCategory(game);
  const key = categoryKey(category);
  const decks = structuredClone(game.decks ?? {});
  let deck = decks[key];

  if (!deck?.order?.length) {
    deck = { category, order: makeCardOrder(cards, category), position: 0 };
  } else {
    let position = Number(deck.position ?? 0) + 1;

    if (position >= deck.order.length) {
      deck.order = makeCardOrder(cards, category);
      position = 0;
    }

    deck.position = position;
  }

  decks[key] = deck;
  return decks;
}

export function advanceCategory(game) {
  let order = Array.isArray(game.categoryOrder) ? [...game.categoryOrder] : [];
  let position = Number(game.categoryPosition ?? 0) + 1;

  if (position >= order.length) {
    order = shuffle(order);
    position = 0;
  }

  return { categoryOrder: order, categoryPosition: position };
}
