const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Example function to generate a recipe
exports.generateRecipe = functions.https.onCall((data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
  }

  // Simple recipe generation logic (placeholder)
  const recipe = {
    title: 'Sample Recipe',
    ingredients: ['ingredient1', 'ingredient2'],
    instructions: 'Mix and cook.'
  };

  return recipe;
});
