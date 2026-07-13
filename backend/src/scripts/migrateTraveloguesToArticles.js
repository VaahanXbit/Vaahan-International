// backend/src/scripts/migrateTraveloguesToArticles.js
const mongoose = require('mongoose');
require('dotenv').config();

const Article = require('../models/Article');
const Travelogue = require('../models/Travelogue');

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vaahan_auth';
    console.log(`🔗 Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');

    // Retrieve all travelogues
    const travelogues = await Travelogue.find({});
    console.log(`📊 Found ${travelogues.length} travelogues in travelogues collection.`);

    let copiedCount = 0;
    let skippedCount = 0;

    for (const t of travelogues) {
      // Check if an article with the same slug already exists to prevent duplicates
      const existingArticle = await Article.findOne({ slug: t.slug });
      if (existingArticle) {
        console.log(`⚠️ Article with slug "${t.slug}" already exists. Skipping.`);
        skippedCount++;
        continue;
      }

      // Map Travelogue properties to Article Schema
      const newArticle = new Article({
        title: t.title,
        slug: t.slug,
        category: 'Travelogue',
        subCategory: t.category || '',
        excerpt: t.excerpt,
        content: t.content,
        image: t.image,
        thumbnail: t.thumbnail || '',
        author: t.author,
        date: t.date,
        readTime: t.readTime,
        tags: t.tags || [],
        status: t.status || 'published',
        seoTitle: t.seoTitle || t.title,
        seoDescription: t.seoDescription || t.excerpt,
        views: t.views || 0,
        weeklyViews: t.weeklyViews || 0,
        lastWeekViews: t.lastWeekViews || 0,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      });

      await newArticle.save();
      copiedCount++;
      console.log(`   ✅ Copied travelogue: "${t.title}" -> Article`);
    }

    console.log('\n' + '─'.repeat(50));
    console.log('📊 Copy Migration Summary:');
    console.log(`   Total Travelogues Found: ${travelogues.length}`);
    console.log(`   Successfully Copied to Articles: ${copiedCount}`);
    console.log(`   Skipped (Already Exists): ${skippedCount}`);
    console.log('✅ Copy migration finished successfully (No collections were deleted or modified).');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
