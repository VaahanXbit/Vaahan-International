// server.js
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
const cron = require('node-cron');
const Article = require('./src/models/Article');
const Travelogue = require('./src/models/Travelogue');

// Schedule weekly views reset every Sunday at midnight (00:00)
cron.schedule('0 0 * * 0', async () => {
  try {
    console.log('Starting weekly article and travelogue views rotation...');
    
    // Copy weeklyViews to lastWeekViews, then reset weeklyViews to 0
    await Article.updateMany({}, [
      { $set: { lastWeekViews: "$weeklyViews", weeklyViews: 0 } }
    ]);
    
    await Travelogue.updateMany({}, [
      { $set: { lastWeekViews: "$weeklyViews", weeklyViews: 0 } }
    ]);
    
    console.log('Weekly views rotation completed.');
  } catch (error) {
    console.error('Failed to rotate weekly views:', error);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email service: ${process.env.NODE_ENV === 'development' ? 'Ethereal (test)' : 'Production'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
  console.log(`Weekly popularity reset cron job registered.`);
});