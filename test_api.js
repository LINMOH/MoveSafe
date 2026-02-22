import 'dotenv/config'

const QWEATHER_KEY = process.env.QWEATHER_API_KEY
const QWEATHER_HOST = process.env.QWEATHER_API_HOST || 'devapi.qweather.com'

console.log('Testing QWeather API...')
console.log('API Key:', QWEATHER_KEY ? `${QWEATHER_KEY.substring(0, 8)}...` : 'Not found')
console.log('API Host:', QWEATHER_HOST)

async function testAPI() {
  try {
    const url = `https://${QWEATHER_HOST}/v7/weather/now?location=北京&key=${QWEATHER_KEY}`
    console.log('Testing URL:', url.replace(QWEATHER_KEY, '***'))
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip'
      }
    })
    
    console.log('Response Status:', response.status)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Response Body (first 500 chars):', text.substring(0, 500))
    
    try {
      const json = JSON.parse(text)
      console.log('Parsed JSON:', JSON.stringify(json, null, 2))
    } catch (e) {
      console.log('Response is not JSON')
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testAPI()