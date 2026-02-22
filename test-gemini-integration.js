// Load environment variables first
require('dotenv').config({ path: '.env.local' });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiIntegration() {
  console.log('🧪 Testing Gemini API integration...\n');

  // Check if environment variable is set
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  console.log('🔑 Gemini API Key:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'Not found');

  if (!apiKey || apiKey === 'your_gemini_api_key') {
    console.log('❌ Gemini API key not configured properly');
    console.log('💡 Make sure NEXT_PUBLIC_GEMINI_API_KEY is set in .env.local');
    return;
  }

  console.log('✅ Gemini API key is properly configured\n');

  try {
    // Initialize Gemini AI
    console.log('🚀 Initializing Gemini AI client...');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test API call
    console.log('📡 Testing API connection with fitness question...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent('What are 3 key tips for proper push-up form? Keep it brief.');

    console.log('✅ API call successful!\n');
    console.log('🤖 Gemini Response:');
    console.log('─'.repeat(50));
    console.log(response.response.text());
    console.log('─'.repeat(50));
    
    console.log('\n🎉 Gemini integration is working perfectly!');
    console.log('🌐 Ready to test in browser at http://localhost:3000/chat');
    
  } catch (error) {
    console.log('❌ API call failed:');
    console.error('Error details:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 The API key appears to be invalid. Please check your Gemini API key.');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('💡 Permission denied. Make sure your API key has the correct permissions.');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('💡 API quota exceeded. Check your Gemini API usage limits.');
    } else {
      console.log('💡 Check your internet connection and API key configuration.');
    }
  }
}

// Run the test
testGeminiIntegration().catch(console.error);