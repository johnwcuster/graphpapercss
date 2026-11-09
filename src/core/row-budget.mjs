// Firefox realizes at most 9,999 construction rows in the qualified engines.
// Keep one row in reserve, including any full-width endpoint rows. This is an
// internal cross-engine safety limit, not an author-adjustable item-count cap.
export const constructionRowBudget=9998;
