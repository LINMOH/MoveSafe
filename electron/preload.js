import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getNews: () => ipcRenderer.invoke('get-news'),
  getNewsArticle: (url) => ipcRenderer.invoke('get-news-article', url),
  searchCity: (location) => ipcRenderer.invoke('search-city', location),
  getWeatherNow: (location) => ipcRenderer.invoke('get-weather-now', location),
  getWeatherDefault: () => ipcRenderer.invoke('get-weather-default')
});
