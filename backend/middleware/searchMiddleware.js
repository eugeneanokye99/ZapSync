const axios = require('axios');
const DJANGO_API_URL = 'http://127.0.0.1:8000/nlp/process/';
// const DJANGO_API_URL = 'https://zapsyncml.onrender.com/nlp/process/';


const processQuery = async (req, res, next) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid query format' 
      });
    }

    // Send to Django NLP service
    const nlpResponse = await axios.post(DJANGO_API_URL, {
      text: query
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 5000
    });

    // Validate and normalize the response
    const nlpResult = nlpResponse.data?.result || {};
    
    // Clean up keywords - remove duplicates and weird patterns
    const cleanKeywords = (keywords) => {
      if (!Array.isArray(keywords)) return [];
      return [...new Set(
        keywords
          .map(k => k.replace(/_/g, ' ').trim()) // Replace underscores with spaces
          .filter(k => k.length > 2) // Remove very short keywords
          .filter(k => !k.match(/^[0-9]+$/)) // Remove pure numbers
      )];
    };

    // Prepare the NLP data for the request
    req.nlpData = {
      originalQuery: query,
      processedQuery: nlpResult.text || query,
      intent: nlpResult.predicted_category || 'search',
      confidence: parseFloat(nlpResult.confidence) || 0,
      entities: {
        courses: nlpResult.entities?.courses || [],
        lecturers: nlpResult.entities?.lecturers || [],
        file_types: nlpResult.entities?.file_types?.map(t => t.toLowerCase()) || [],
        categories: nlpResult.entities?.categories || [],
        weeks: nlpResult.entities?.weeks || [],
        semesters: nlpResult.entities?.semesters || [],
        keywords: cleanKeywords(nlpResult.entities?.keywords || [])
      },
      suggested_filters: nlpResult.suggested_filters || {},
      rawNlpResponse: nlpResponse.data // Keep for debugging
    };

    console.log('Processed NLP Data:', JSON.stringify(req.nlpData, null, 2));
    next();

  } catch (error) {
    console.error('NLP Processing Error:', {
      error: error.message,
      stack: error.stack,
      request: req.body,
      response: error.response?.data
    });

    // Fallback with simple keyword extraction
    const extractFallbackKeywords = (text) => {
      if (!text) return [];
      return [...new Set(
        text.toLowerCase()
          .split(/[\s\.\-_]+/)
          .filter(word => word.length > 3)
          .slice(0, 5)
      )];
    };

    req.nlpData = {
      originalQuery: req.body.query,
      processedQuery: req.body.query,
      intent: 'search',
      confidence: 0,
      entities: {
        courses: [],
        lecturers: req.body.query.includes('Partey') ? ['Dr Partey'] : [],
        file_types: req.body.query.match(/\.(\w+)$/)?.[1] ? 
                   [req.body.query.match(/\.(\w+)$/)[1].toLowerCase()] : [],
        categories: [],
        weeks: req.body.query.match(/week\s*(\d+)/i)?.[1] ? 
                [`Week ${req.body.query.match(/week\s*(\d+)/i)[1]}`] : [],
        semesters: [],
        keywords: extractFallbackKeywords(req.body.query)
      },
      suggested_filters: {},
      isFallback: true,
      error: error.message
    };
    
    next();
  }
};

module.exports = { processQuery };