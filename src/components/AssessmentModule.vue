<script setup>
import { ref, computed } from 'vue'
import assessmentRules from '../data/assessmentRules.json'

const form = ref({
  locationType: 'park',
  temperature: 22,
  humidity: 55,
  aqi: 75,
  weatherCondition: 'sunny',
  crowdDensity: 30,
  timePeriod: 'morning'
})

const result = ref(null)
const cityInput = ref('')
const citySuggestions = ref([])
const selectedLocationId = ref('')
const selectedCityName = ref('')
const weatherLoading = ref(false)
const weatherError = ref('')
const currentWeather = ref(null)

let cityDebounceTimer = null

async function searchCity() {
  const q = cityInput.value.trim()
  if (q.length < 2) { citySuggestions.value = []; return }
  clearTimeout(cityDebounceTimer)
  cityDebounceTimer = setTimeout(async () => {
    try {
      const data = await window.electronAPI.searchCity(q)
      citySuggestions.value = data.location || []
    } catch {
      citySuggestions.value = []
    }
  }, 300)
}

function selectCity(loc) {
  selectedLocationId.value = loc.id
  selectedCityName.value = `${loc.name}${loc.adm2 ? ` (${loc.adm2})` : ''}`
  cityInput.value = selectedCityName.value
  citySuggestions.value = []
  currentWeather.value = null
}

async function fetchWeather() {
  if (!selectedLocationId.value) {
    weatherError.value = '请先选择城市'
    return
  }
  weatherError.value = ''
  weatherLoading.value = true
  try {
    const data = await window.electronAPI.getWeatherNow(selectedLocationId.value)
    currentWeather.value = data
    form.value.temperature = data.temp
    form.value.humidity = data.humidity
    form.value.weatherCondition = data.weatherCondition || 'cloudy'
  } catch (err) {
    weatherError.value = err.message || '获取天气失败'
  } finally {
    weatherLoading.value = false
  }
}

function getWeatherIcon(condition) {
  const iconMap = {
    sunny: 'fa-sun',
    cloudy: 'fa-cloud',
    partlyCloudy: 'fa-cloud-sun',
    lightRain: 'fa-cloud-rain',
    moderateRain: 'fa-cloud-showers-heavy',
    heavyRain: 'fa-cloud-showers-heavy',
    thunderstorm: 'fa-bolt',
    snow: 'fa-snowflake',
    fog: 'fa-smog',
    windy: 'fa-wind'
  }
  return iconMap[condition] || 'fa-cloud'
}

function getScoreForRange(value, scoreMap) {
  for (const key of Object.keys(scoreMap)) {
    const band = scoreMap[key]
    if (band.min !== undefined && value >= band.min && value <= band.max)
      return { score: band.score, description: band.description, key }
  }
  return { score: 0, description: '未知', key: '' }
}

function getWeatherScore(key) {
  const map = assessmentRules.weatherConditionScores
  const item = map[key] || map.sunny
  return { score: item.score, description: item.description }
}

const locationTypes = assessmentRules.locationTypes
const timePeriods = assessmentRules.timePeriods
const weatherOptions = [
  { value: 'sunny', label: '晴天' },
  { value: 'cloudy', label: '多云' },
  { value: 'partlyCloudy', label: '局部多云' },
  { value: 'lightRain', label: '小雨' },
  { value: 'moderateRain', label: '中雨' },
  { value: 'heavyRain', label: '大雨' },
  { value: 'thunderstorm', label: '雷暴' },
  { value: 'snow', label: '雪天' },
  { value: 'fog', label: '雾天' },
  { value: 'windy', label: '大风' }
]

function assess() {
  const w = assessmentRules.weights
  const aq = getScoreForRange(form.value.aqi, assessmentRules.airQualityScores)
  const temp = getScoreForRange(form.value.temperature, assessmentRules.temperatureScores)
  const hum = getScoreForRange(form.value.humidity, assessmentRules.humidityScores)
  const crowd = getScoreForRange(form.value.crowdDensity, assessmentRules.crowdDensityScores)
  const weather = getWeatherScore(form.value.weatherCondition)

  const totalScore = Math.round(
    aq.score * w.airQuality +
    temp.score * w.temperature +
    hum.score * w.humidity +
    crowd.score * w.crowdDensity +
    weather.score * w.weatherCondition
  )
  const clampedScore = Math.max(0, Math.min(100, totalScore))

  let levelKey = 'poor'
  if (clampedScore >= 80) levelKey = 'excellent'
  else if (clampedScore >= 60) levelKey = 'good'

  const levelInfo = assessmentRules.riskLevels[levelKey]
  const recommendedSports = assessmentRules.recommendedSports[levelKey] || assessmentRules.recommendedSports.notRecommended

  const suggestions = []
  if (aq.score < 60) suggestions.push({ type: 'warning', text: '空气质量较差，建议室内运动或减少户外活动时长。', reason: aq.description })
  if (temp.score < 60) suggestions.push({ type: 'warning', text: '温度不宜，建议减少运动强度或选择室内场地。', reason: temp.description })
  if (hum.score < 60) suggestions.push({ type: 'warning', text: '湿度条件欠佳，注意补水与透气。', reason: hum.description })
  if (crowd.score < 60) suggestions.push({ type: 'warning', text: '人流密集，建议避免球类等占空间运动，选择散步或慢跑。', reason: crowd.description })
  if (weather.score < 60) suggestions.push({ type: 'warning', text: '天气状况不佳，建议室内运动或改期。', reason: weather.description })
  if (suggestions.length === 0 && levelKey === 'excellent') suggestions.push({ type: 'success', text: '当前环境非常适合运动，可放心进行推荐类型的活动。', reason: '各项指标良好' })

  result.value = {
    score: clampedScore,
    levelKey,
    levelLabel: levelInfo.level,
    levelColor: levelInfo.color,
    levelDescription: levelInfo.description,
    recommendedSports,
    suggestions,
    factors: { aq, temp, hum, crowd, weather }
  }
}

const hasResult = computed(() => result.value !== null)

const levelDisplayColor = computed(() => {
  if (!result.value) return '#000'
  const k = result.value.levelKey
  return k === 'excellent' ? '#000' : k === 'good' ? '#555' : '#999'
})
</script>

<template>
  <div class="assessment-module">
    <h2 class="module-title">
      <i class="fas fa-chart-line"></i>
      运动环境评估
    </h2>
    <p class="module-desc">输入当前环境参数，获取科学运动建议与风险提示。</p>

    <div class="assessment-layout">
      <section class="form-section card">
        <h3>环境参数</h3>
        <div class="weather-fetch card-inner">
          <label>和风天气 · 自动填充</label>
          <div class="city-row">
            <input v-model="cityInput" @input="searchCity" type="text" placeholder="输入城市名，如：北京" class="city-input" />
            <button type="button" class="btn-weather" :disabled="weatherLoading" @click="fetchWeather">
              {{ weatherLoading ? '获取中…' : '获取天气' }}
            </button>
          </div>
          <div v-if="citySuggestions.length" class="city-suggestions">
            <button v-for="loc in citySuggestions" :key="loc.id" type="button" class="city-item" @click="selectCity(loc)">
              {{ loc.name }} {{ loc.adm2 ? `· ${loc.adm2}` : '' }}
            </button>
          </div>
          <p v-if="weatherError" class="weather-error">{{ weatherError }}</p>
          
          <div v-if="currentWeather" class="weather-display">
            <div class="weather-main">
              <i class="fas" :class="getWeatherIcon(currentWeather.weatherCondition)"></i>
              <span class="weather-temp">{{ currentWeather.temp }}°C</span>
              <span class="weather-desc">{{ currentWeather.weatherText }}</span>
            </div>
            <div class="weather-details">
              <div class="weather-detail-item">
                <i class="fas fa-thermometer-half"></i>
                <span>体感 {{ currentWeather.feelsLike }}°C</span>
              </div>
              <div class="weather-detail-item">
                <i class="fas fa-tint"></i>
                <span>湿度 {{ currentWeather.humidity }}%</span>
              </div>
              <div class="weather-detail-item">
                <i class="fas fa-wind"></i>
                <span>{{ currentWeather.windDir }} {{ currentWeather.windScale }}级</span>
              </div>
              <div class="weather-detail-item">
                <i class="fas fa-eye"></i>
                <span>能见度 {{ currentWeather.vis }}km</span>
              </div>
            </div>
          </div>
        </div>
        <form @submit.prevent="assess" class="assessment-form">
          <div class="form-group">
            <label>地点类型</label>
            <select v-model="form.locationType">
              <option v-for="loc in locationTypes" :key="loc.value" :value="loc.value">{{ loc.label }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>温度 (℃)</label>
              <input v-model.number="form.temperature" type="number" min="-10" max="45" step="1" />
            </div>
            <div class="form-group">
              <label>湿度 (%)</label>
              <input v-model.number="form.humidity" type="number" min="0" max="100" step="1" />
            </div>
          </div>
          <div class="form-group">
            <label>空气质量指数 (AQI)</label>
            <input v-model.number="form.aqi" type="number" min="0" max="500" />
          </div>
          <div class="form-group">
            <label>天气状况</label>
            <select v-model="form.weatherCondition">
              <option v-for="opt in weatherOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>人流密度 (%)</label>
            <input v-model.number="form.crowdDensity" type="range" min="0" max="100" step="5" />
            <span class="range-value">{{ form.crowdDensity }}%</span>
          </div>
          <div class="form-group">
            <label>时间段</label>
            <select v-model="form.timePeriod">
              <option v-for="p in timePeriods" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
          </div>
          <button type="submit" class="btn-primary">
            <i class="fas fa-calculator"></i> 开始评估
          </button>
        </form>
      </section>

      <section v-if="hasResult" class="result-section">
        <div class="score-card card" :style="{ borderColor: levelDisplayColor }">
          <div class="score-circle" :style="{ borderColor: levelDisplayColor, color: levelDisplayColor }">
            {{ result.score }}
          </div>
          <p class="score-label">综合适宜度</p>
          <p class="level-badge" :style="{ background: levelDisplayColor }">{{ result.levelLabel }}</p>
          <p class="level-desc">{{ result.levelDescription }}</p>
        </div>
        <div class="recommendations card">
          <h3><i class="fas fa-list-ul"></i> 推荐运动类型</h3>
          <ul>
            <li v-for="sport in result.recommendedSports" :key="sport"><i class="fas fa-check-circle"></i> {{ sport }}</li>
          </ul>
        </div>
        <div class="suggestions card">
          <h3><i class="fas fa-lightbulb"></i> 智能建议（可解释）</h3>
          <ul class="suggestion-list">
            <li v-for="(s, i) in result.suggestions" :key="i" :class="s.type">
              <span class="suggestion-text">{{ s.text }}</span>
              <span class="suggestion-reason">原因：{{ s.reason }}</span>
            </li>
          </ul>
        </div>
      </section>
      <section v-else class="result-placeholder">
        <p>填写环境参数后点击「开始评估」查看结果。</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.assessment-module { color: #111; }
.module-title { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; }
.module-desc { margin: 0 0 1.5rem 0; color: #666; font-size: 0.9rem; }
.assessment-layout { display: grid; grid-template-columns: 340px 1fr; gap: 2rem; }
@media (max-width: 900px) { .assessment-layout { grid-template-columns: 1fr; } }
.card { background: #fff; padding: 1.5rem; border: 1px solid #e5e5e5; }
.form-section h3, .recommendations h3, .suggestions h3 { margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; }
.form-section h3 { display: flex; align-items: center; gap: 0.5rem; }
.assessment-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.weather-fetch { margin-bottom: 1rem; padding: 1rem; background: #fafafa; border: 1px solid #e5e5e5; }
.weather-fetch label { font-size: 0.8rem; color: #666; display: block; margin-bottom: 0.5rem; }
.city-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.city-input { flex: 1 1 150px; min-width: 0; padding: 0.5rem 0.75rem; border: 1px solid #ddd; font-size: 0.95rem; }
.btn-weather { flex-shrink: 0; padding: 0.5rem 1rem; background: #333; color: #fff; border: none; font-size: 0.9rem; cursor: pointer; white-space: nowrap; }
.btn-weather:disabled { opacity: 0.6; cursor: not-allowed; }
.city-suggestions { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.35rem; }
.city-item { padding: 0.35rem 0.6rem; background: #fff; border: 1px solid #ddd; font-size: 0.85rem; cursor: pointer; }
.city-item:hover { border-color: #999; }
.weather-error { margin: 0.5rem 0 0; font-size: 0.8rem; color: #c00; }
.weather-display { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; }
.weather-main { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.weather-main i { font-size: 2rem; color: #f59e0b; }
.weather-temp { font-size: 1.75rem; font-weight: 600; color: #111; }
.weather-desc { font-size: 1rem; color: #666; }
.weather-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
.weather-detail-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #555; }
.weather-detail-item i { width: 1rem; color: #888; }
.form-group label { font-size: 0.85rem; font-weight: 500; color: #555; }
.form-group input[type="number"], .form-group select { padding: 0.5rem 0.75rem; border: 1px solid #ddd; font-size: 1rem; }
.form-group input[type="range"] { width: 100%; }
.range-value { font-size: 0.85rem; color: #666; }
.btn-primary { padding: 0.75rem 1.25rem; background: #000; color: #fff; border: none; font-size: 0.95rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.5rem; }
.btn-primary:hover { background: #333; }
.result-section { display: flex; flex-direction: column; gap: 1.5rem; }
.score-card { text-align: center; border-width: 2px; }
.score-circle { width: 100px; height: 100px; border-radius: 50%; border: 3px solid; font-size: 2.25rem; font-weight: 600; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; }
.score-label { margin: 0; font-size: 0.85rem; color: #666; }
.level-badge { display: inline-block; padding: 0.3rem 0.9rem; color: #fff; font-weight: 500; margin: 0.5rem 0; font-size: 0.9rem; }
.level-desc { margin: 0; font-size: 0.85rem; color: #666; }
.recommendations ul { list-style: none; padding: 0; margin: 0; }
.recommendations li { padding: 0.4rem 0; display: flex; align-items: center; gap: 0.5rem; color: #333; font-size: 0.9rem; }
.recommendations li i { color: #000; }
.suggestion-list { list-style: none; padding: 0; margin: 0; }
.suggestion-list li { padding: 0.75rem; margin-bottom: 0.5rem; border-left: 3px solid #ccc; }
.suggestion-list li.warning { background: #f5f5f5; border-left-color: #666; }
.suggestion-list li.success { background: #f5f5f5; border-left-color: #000; }
.suggestion-text { display: block; font-weight: 500; color: #111; }
.suggestion-reason { display: block; font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
.result-placeholder { color: #999; font-size: 0.9rem; }
</style>
