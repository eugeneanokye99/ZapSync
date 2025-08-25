const axios = require('axios');
const fs = require('fs');
const util = require('util');
const path = require('path');

// Configure logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const logFile = fs.createWriteStream(path.join(logDir, 'content_filter.log'), { flags: 'a' });

// Enhanced logging function
function logRequest(word, result, source) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({
    timestamp,
    source,
    word,
    result,
    confidence: result?.confidence || null
  }) + '\n';
  
  logFile.write(logEntry);
}

const malwarePatterns = [
  /eval\(.*\)/,
  /<script>.*<\/script>/,
  /\\x[0-9a-f]{2}/i,
  /powershell -e/,
  /base64_decode/
];

const DJANGO_API_URL = 'http://127.0.0.1:8000/filter/predict/';
// const DJANGO_API_URL = 'https://zapsyncml.onrender.com/filter/predict/';

// Profanity Check
exports.checkForProfanity = async (text) => {
  try {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    for (const word of words) {
      const result = await checkWordWithDjangoAPI(word, 'file-upload');
      if (result.should_reject) {
        return {
          isProfane: true,
          offendingWord: word,
          confidence: result.confidence
        };
      }
    }
    return { isProfane: false };
  } catch (error) {
    console.error('Profanity check error:', error);
    return { isProfane: false };
  }
};

// API Request Helper
async function checkWordWithDjangoAPI(word, source = 'unknown') {
  try {
    const response = await axios.post(DJANGO_API_URL, { 
      text: word 
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000 // 5 second timeout
    });
    
    logRequest(word, response.data, source);
    return response.data;
  } catch (error) {
    logRequest(word, { error: error.message }, source);
    throw error;
  }
}

// Malware Pattern Detection
exports.scanForMalware = async (text) => {
  return malwarePatterns.some(pattern => pattern.test(text));
};

// Image Analysis
exports.analyzeImage = async (imageBuffer) => {
  return {
    isMeme: false,
    isAcademic: true,
    containsText: false
  };
};