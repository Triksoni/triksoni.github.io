// Конфигурация
const API_KEY = "507ad6703c011e84b17ffc86ef5fa30b"; // Замените на свой API ключ
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const ICON_URL = "https://openweathermap.org/img/wn/";

// Элементы DOM
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const dateElement = document.getElementById('date');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const weatherIcon = document.getElementById('weather-icon');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const pressure = document.getElementById('pressure');
const celsiusBtn = document.getElementById('celsius');
const fahrenheitBtn = document.getElementById('fahrenheit');
const forecastContainer = document.getElementById('forecast');

// Переменные состояния
let currentUnit = 'celsius';
let currentWeatherData = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем сохраненный город в localStorage
    const savedCity = localStorage.getItem('lastCity');
    
    if (savedCity) {
        getWeatherData(savedCity);
    } else {
        // Если нет сохраненного города, пробуем получить по геолокации
        getLocation();
    }
    
    // Устанавливаем текущую дату
    updateDate();
});

// Слушатели событий
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

locationBtn.addEventListener('click', getLocation);

celsiusBtn.addEventListener('click', () => {
    if (currentUnit !== 'celsius') {
        switchUnit('celsius');
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (currentUnit !== 'fahrenheit') {
        switchUnit('fahrenheit');
    }
});

// Функции

// Получение данных о погоде
async function getWeatherData(city) {
    try {
        // Показываем загрузку
        cityName.textContent = "Загрузка...";
        
        // Получаем текущую погоду
        const weatherResponse = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}&lang=ru`);
        const weatherData = await weatherResponse.json();
        
        if (weatherData.cod !== 200) {
            throw new Error(weatherData.message || "Город не найден");
        }
        
        // Получаем прогноз
        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}&lang=ru`);
        const forecastData = await forecastResponse.json();
        
        if (forecastData.cod !== "200") {
            throw new Error("Ошибка получения прогноза");
        }
        
        // Сохраняем данные
        currentWeatherData = {
            weather: weatherData,
            forecast: forecastData
        };
        
        // Обновляем UI
        updateWeatherUI();
        updateForecastUI();
        
        // Сохраняем город в localStorage
        localStorage.setItem('lastCity', city);
        
        // Очищаем поле ввода
        cityInput.value = '';
        
    } catch (error) {
        alert(error.message);
        cityName.textContent = "Ошибка";
    }
}

// Получение местоположения
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Показываем загрузку
                    cityName.textContent = "Определение...";
                    
                    // Получаем текущую погоду
                    const weatherResponse = await fetch(`${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}&lang=ru`);
                    const weatherData = await weatherResponse.json();
                    
                    // Получаем прогноз
                    const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}&lang=ru`);
                    const forecastData = await forecastResponse.json();
                    
                    // Сохраняем данные
                    currentWeatherData = {
                        weather: weatherData,
                        forecast: forecastData
                    };
                    
                    // Обновляем UI
                    updateWeatherUI();
                    updateForecastUI();
                    
                    // Сохраняем город в localStorage
                    localStorage.setItem('lastCity', weatherData.name);
                    
                } catch (error) {
                    alert("Ошибка получения данных о погоде");
                    cityName.textContent = "Ошибка";
                }
            },
            (error) => {
                alert("Не удалось определить ваше местоположение. Пожалуйста, введите город вручную.");
                cityName.textContent = "Введите город";
            }
        );
    } else {
        alert("Геолокация не поддерживается вашим браузером");
    }
}

// Обновление UI с текущей погодой
function updateWeatherUI() {
    if (!currentWeatherData) return;
    
    const { weather } = currentWeatherData;
    
    // Обновляем основную информацию
    cityName.textContent = weather.name;
    weatherDescription.textContent = weather.weather[0].description;
    
    // Обновляем температуру в зависимости от выбранных единиц
    updateTemperature();
    
    // Обновляем детали
    humidity.textContent = `${weather.main.humidity}%`;
    wind.textContent = `${Math.round(weather.wind.speed)} км/ч`;
    pressure.textContent = `${weather.main.pressure} hPa`;
    
    // Обновляем иконку
    weatherIcon.src = `${ICON_URL}${weather.weather[0].icon}@2x.png`;
    weatherIcon.alt = weather.weather[0].description;
    
    // Обновляем фон в зависимости от погоды
    updateBackground(weather.weather[0].main);
}

// Обновление прогноза
function updateForecastUI() {
    if (!currentWeatherData) return;
    
    const { forecast } = currentWeatherData;
    
    // Фильтруем прогноз, чтобы получить по одной записи на день (каждые 24 часа)
    const dailyForecast = [];
    const daysAdded = new Set();
    
    forecast.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        
        // Берем прогноз на 12:00 каждого дня
        if (date.getHours() === 12 && !daysAdded.has(day)) {
            dailyForecast.push(item);
            daysAdded.add(day);
        }
    });
    
    // Ограничиваем 5 днями
    const forecastToShow = dailyForecast.slice(0, 5);
    
    // Очищаем контейнер
    forecastContainer.innerHTML = '';
    
    // Добавляем прогноз в UI
    forecastToShow.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('ru-RU', { weekday: 'short' });
        
        const temp = currentUnit === 'celsius' 
            ? Math.round(item.main.temp)
            : Math.round(item.main.temp * 9/5 + 32);
            
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <div class="day">${day}</div>
            <img src="${ICON_URL}${item.weather[0].icon}.png" alt="${item.weather[0].description}">
            <div class="temp">${temp}°${currentUnit === 'celsius' ? 'C' : 'F'}</div>
        `;
        
        forecastContainer.appendChild(forecastDay);
    });
}

// Обновление температуры
function updateTemperature() {
    if (!currentWeatherData) return;
    
    const tempC = Math.round(currentWeatherData.weather.main.temp);
    const tempF = Math.round(tempC * 9/5 + 32);
    
    temperature.textContent = currentUnit === 'celsius' ? tempC : tempF;
}

// Переключение единиц измерения
function switchUnit(unit) {
    currentUnit = unit;
    
    // Обновляем активную кнопку
    celsiusBtn.classList.toggle('active', unit === 'celsius');
    fahrenheitBtn.classList.toggle('active', unit === 'fahrenheit');
    
    // Обновляем температуру
    updateTemperature();
    updateForecastUI();
}

// Обновление фона в зависимости от погоды
function updateBackground(weatherCondition) {
    const body = document.body;
    
    // Удаляем предыдущие классы
    body.className = '';
    
    // Добавляем соответствующий класс
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            body.classList.add('sunny');
            break;
        case 'clouds':
            body.classList.add('cloudy');
            break;
        case 'rain':
        case 'drizzle':
            body.classList.add('rainy');
            break;
        case 'thunderstorm':
            body.classList.add('stormy');
            break;
        case 'snow':
            body.classList.add('snowy');
            break;
        default:
            body.classList.add('default-bg');
    }
}

// Обновление даты
function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('ru-RU', options);
}