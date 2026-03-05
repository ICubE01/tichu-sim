/**
 * Checks if two cards are equal based on their type, suit, and rank.
 * 
 * @param {Object} cardA 
 * @param {Object} cardB 
 * @returns {boolean}
 */
export const areCardsEqual = (cardA, cardB) => {
    if (!cardA || !cardB) return cardA === cardB;
    return (
        cardA.type === cardB.type &&
        cardA.suit === cardB.suit &&
        cardA.rank === cardB.rank
    );
};

/**
 * Checks if a card list contains a specific card using value equality.
 * 
 * @param {Array<Object>} cardList 
 * @param {Object|null} card 
 * @returns {boolean}
 */
export const includesCard = (cardList, card) => {
    if (!cardList || !card) return false;
    return cardList.some(c => areCardsEqual(c, card));
};

/**
 * Filters a card list by removing specific cards based on value equality.
 * 
 * @param {Array<Object>} cardList 
 * @param {Array<Object>|Object} cardsToRemove Single card or list of cards to remove
 * @returns {Array<Object>}
 */
export const excludeCards = (cardList, cardsToRemove) => {
    if (!cardList) return [];
    const toRemove = Array.isArray(cardsToRemove) ? cardsToRemove : [cardsToRemove];
    return cardList.filter(card => !includesCard(toRemove, card));
};
