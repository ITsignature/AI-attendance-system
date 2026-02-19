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
          .map(part => {
            // If part is empty (from consecutive dots), return empty
            if (!part) return '';
            // If part is a single letter, keep it uppercase
            if (part.length === 1) return part.toUpperCase();
            // For multi-character parts, capitalize first letter and keep rest lowercase
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('.');
      }
      // Regular capitalization for words without periods
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};
