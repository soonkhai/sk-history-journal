import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 1. Load your API keys from .env
dotenv.config();
const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!API_KEY || !CHANNEL_ID) {
  console.error("❌ Error: missing YOUTUBE_API_KEY or CHANNEL_ID in .env file");
  process.exit(1);
}

// Helper to slugify titles (e.g. "My Video!" -> "my-video")
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

async function fetchAndGenerate() {
  console.log(`🔍 Fetching videos for channel: ${CHANNEL_ID}...`);

  try {
    // A. Get "Uploads" Playlist ID
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`);
    const channelData = await channelRes.json();
    const uploadsId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // B. Get All Videos (Max 50 for now)
    const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=50&key=${API_KEY}`);
    const videosData = await videosRes.json();

    console.log(`✅ Found ${videosData.items.length} videos. Generating files...`);

    // C. Loop and Create Files
    videosData.items.forEach(video => {
        const title = video.snippet.title;
        const date = video.snippet.publishedAt.split('T')[0]; // YYYY-MM-DD
        const videoId = video.snippet.resourceId.videoId;
        const description = video.snippet.description.replace(/"/g, '\\"'); // Escape quotes
        const image = video.snippet.thumbnails.maxres 
                      ? video.snippet.thumbnails.maxres.url 
                      : video.snippet.thumbnails.high.url;

        const slug = slugify(title);
        const fileName = `src/content/blog/${slug}.md`;

        // D. The Markdown Content Template
        const fileContent = `---
title: "${title}"
description: "${title} - Watch the full short history."
pubDate: ${date}
image: "${image}"
youtubeId: "${videoId}"
---

## The Story
${description}

## Watch the Short
<iframe width="100%" height="500" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
`;

        // E. Write File (Skip if exists)
        if (!fs.existsSync(fileName)) {
            fs.writeFileSync(fileName, fileContent);
            console.log(`✨ Created: ${fileName}`);
        } else {
            console.log(`kipped (Exists): ${fileName}`);
        }
    });

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

fetchAndGenerate();