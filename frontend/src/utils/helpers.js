// Helper function to capitalize first letter of each word
// Preserves uppercase letters after periods (e.g., A.S.N.Ranasinghe)
export const capitalizeName = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => {
      // If word contains periods, handle each part separately
      if (word.includes('.')) {
        return word
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('.');
      }
      // Regular capitalization for words without periods
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};
