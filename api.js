// api.js
class API {
    static BASE_URL = 'http://localhost:8080/api';
    static TOKEN_KEY = 'auth_token';
    static USER_ID_KEY = 'user_id';

    // Методы для работы с токеном и пользователем
    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static getUserId() {
        return localStorage.getItem(this.USER_ID_KEY);
    }

    static setUserId(userId) {
        localStorage.setItem(this.USER_ID_KEY, userId);
    }

    static clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_ID_KEY);
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    // Методы аутентификации
    static async register(email, password) {
        try {
            // Имитация успешной регистрации без реального запроса к серверу
            console.log('Регистрация пользователя:', email);
            
            // Генерируем фейковый токен и ID пользователя
            const fakeToken = 'fake_token_' + Math.random().toString(36).substring(2);
            const fakeUserId = 'user_' + Math.random().toString(36).substring(2);
            
            // Сохраняем данные в localStorage
            this.setToken(fakeToken);
            this.setUserId(fakeUserId);
            
            return {
                access_token: fakeToken,
                user_id: fakeUserId,
                token_type: 'bearer'
            };
        } catch (error) {
            console.error('Registration error:', error);
            throw new Error('Ошибка при регистрации');
        }
    }

    static async login(email, password) {
        try {
            // Имитация успешного входа без реального запроса к серверу
            console.log('Вход пользователя:', email);
            
            // Генерируем фейковый токен и ID пользователя
            const fakeToken = 'fake_token_' + Math.random().toString(36).substring(2);
            const fakeUserId = 'user_' + Math.random().toString(36).substring(2);
            
            // Сохраняем данные в localStorage
            this.setToken(fakeToken);
            this.setUserId(fakeUserId);
            
            return {
                access_token: fakeToken,
                user_id: fakeUserId,
                token_type: 'bearer'
            };
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Ошибка при входе');
        }
    }

    static logout() {
        this.clearAuth();
        window.location.href = 'login.html';
    }

    // Методы для работы с пользователем
    static async getUserInfo() {
        try {
            // Имитация получения данных пользователя из localStorage
            let userData = localStorage.getItem('user_data');
            if (!userData) {
                // Если данных нет, создаем начальные данные с балансом 0
                userData = {
                    id: this.getUserId() || 'user_' + Math.random().toString(36).substring(2),
                    email: 'user@example.com',
                    balance: 0.0, // Стартовый баланс 0 до пополнения
                    status: 'active',
                    verification: 'basic',
                    registration_date: new Date().toISOString().split('T')[0],
                    notifications: [], // Добавляем массив для уведомлений
                    favorites: [] // Добавляем массив для избранных монет
                };
                localStorage.setItem('user_data', JSON.stringify(userData));
            } else {
                userData = JSON.parse(userData);
                // Добавляем поле notifications, если его нет
                if (!userData.notifications) {
                    userData.notifications = [];
                }
                // Добавляем поле favorites, если его нет
                if (!userData.favorites) {
                    userData.favorites = [];
                }
                localStorage.setItem('user_data', JSON.stringify(userData));
            }
            return userData;
        } catch (error) {
            console.error('Error getting user info:', error);
            throw new Error('Ошибка при получении информации о пользователе');
        }
    }

    // Методы для работы с монетами
    static async getCoins() {
        try {
            // Актуальные цены на монеты (по состоянию на 2023)
            const defaultCoins = [
                { symbol: "BTC", name: "Bitcoin", price: 67500.0, marketCap: 1320000000000 },
                { symbol: "ETH", name: "Ethereum", price: 3850.0, marketCap: 462000000000 },
                { symbol: "SOL", name: "Solana", price: 180.0, marketCap: 78000000000 },
                { symbol: "ADA", name: "Cardano", price: 0.45, marketCap: 15800000000 },
                { symbol: "DOT", name: "Polkadot", price: 7.25, marketCap: 9500000000 },
                { symbol: "XRP", name: "Ripple", price: 0.58, marketCap: 31500000000 },
                { symbol: "DOGE", name: "Dogecoin", price: 0.12, marketCap: 17200000000 },
                { symbol: "AVAX", name: "Avalanche", price: 35.20, marketCap: 12800000000 },
                { symbol: "LINK", name: "Chainlink", price: 15.75, marketCap: 9200000000 },
                { symbol: "MATIC", name: "Polygon", price: 0.65, marketCap: 6300000000 }
            ];
            
            // Всегда используем defaultCoins как основу и добавляем случайные колебания
            let coins = localStorage.getItem('coins');
            let coinsArray = [];
            
            if (!coins) {
                coinsArray = [...defaultCoins];
            } else {
                try {
                    const savedCoins = JSON.parse(coins);
                    // Проверяем, что savedCoins - это массив и он не пустой
                    if (Array.isArray(savedCoins) && savedCoins.length > 0) {
                        // Обновляем только цены, сохраняя все монеты из defaultCoins
                        coinsArray = defaultCoins.map(defaultCoin => {
                            const savedCoin = savedCoins.find(c => c.symbol === defaultCoin.symbol);
                            if (savedCoin) {
                                return { ...defaultCoin, price: savedCoin.price };
                            }
                            return defaultCoin;
                        });
                        
                        // Добавляем монеты, которые есть в savedCoins, но нет в defaultCoins
                        savedCoins.forEach(savedCoin => {
                            if (!defaultCoins.some(c => c.symbol === savedCoin.symbol)) {
                                coinsArray.push(savedCoin);
                            }
                        });
                    } else {
                        coinsArray = [...defaultCoins];
                    }
                } catch (e) {
                    console.error('Error parsing saved coins:', e);
                    coinsArray = [...defaultCoins];
                }
            }
            
            // Добавляем случайные колебания цен при каждом обновлении (±5%)
            coinsArray.forEach(coin => {
                const fluctuation = 1 + (Math.random() * 0.1 - 0.05); // от -5% до +5%
                coin.price = parseFloat((coin.price * fluctuation).toFixed(2));
                // Обновляем капитализацию в соответствии с новой ценой
                if (coin.marketCap) {
                    coin.marketCap = parseFloat((coin.marketCap * fluctuation).toFixed(0));
                }
                
                // Добавляем изменение цены за 24 часа (случайное значение для демонстрации)
                coin.priceChange24h = parseFloat((Math.random() * 10 - 5).toFixed(2));
                
                // Добавляем объем торгов за 24 часа
                if (!coin.volume24h) {
                    coin.volume24h = parseFloat((coin.price * Math.random() * 1000000).toFixed(0));
                } else {
                    coin.volume24h = parseFloat((coin.volume24h * (1 + (Math.random() * 0.2 - 0.1))).toFixed(0));
                }
            });
            
            // Проверяем, нужно ли отправить уведомление о значительном изменении цены
            this.checkPriceAlerts(coinsArray);
            
            // Сохраняем обновленные цены
            localStorage.setItem('coins', JSON.stringify(coinsArray));
            
            return coinsArray;
        } catch (error) {
            console.error('Error getting coins:', error);
            throw new Error('Ошибка при получении списка монет');
        }
    }
    
    // Метод для проверки и создания уведомлений о значительных изменениях цен
    static async checkPriceAlerts(currentCoins) {
        try {
            // Получаем предыдущие цены монет
            const previousPricesStr = localStorage.getItem('previous_prices');
            if (!previousPricesStr) {
                // Если предыдущих цен нет, сохраняем текущие и выходим
                const pricesMap = {};
                currentCoins.forEach(coin => {
                    pricesMap[coin.symbol] = coin.price;
                });
                localStorage.setItem('previous_prices', JSON.stringify(pricesMap));
                return;
            }
            
            const previousPrices = JSON.parse(previousPricesStr);
            const userData = await this.getUserInfo();
            const significantChangeThreshold = 3; // Порог значительного изменения в процентах
            
            // Проверяем каждую монету на значительное изменение цены
            currentCoins.forEach(coin => {
                const prevPrice = previousPrices[coin.symbol];
                if (prevPrice) {
                    const changePercent = ((coin.price - prevPrice) / prevPrice) * 100;
                    if (Math.abs(changePercent) >= significantChangeThreshold) {
                        // Создаем уведомление о значительном изменении цены
                        const notification = {
                            id: 'notif_' + Math.random().toString(36).substring(2),
                            type: 'price_alert',
                            coin: coin.symbol,
                            message: `${coin.name} (${coin.symbol}) ${changePercent > 0 ? 'вырос' : 'упал'} на ${Math.abs(changePercent).toFixed(2)}%`,
                            oldPrice: prevPrice,
                            newPrice: coin.price,
                            date: new Date().toISOString(),
                            read: false
                        };
                        
                        // Добавляем уведомление пользователю
                        if (!userData.notifications) {
                            userData.notifications = [];
                        }
                        userData.notifications.unshift(notification);
                        
                        // Ограничиваем количество уведомлений до 20
                        if (userData.notifications.length > 20) {
                            userData.notifications = userData.notifications.slice(0, 20);
                        }
                    }
                }
                
                // Обновляем предыдущую цену
                previousPrices[coin.symbol] = coin.price;
            });
            
            // Сохраняем обновленные предыдущие цены
            localStorage.setItem('previous_prices', JSON.stringify(previousPrices));
            
            // Сохраняем обновленные данные пользователя с уведомлениями
            localStorage.setItem('user_data', JSON.stringify(userData));
            
        } catch (error) {
            console.error('Error checking price alerts:', error);
        }
    }

    static async getUserCoins() {
        try {
            // Имитация получения монет пользователя
            let userCoins = localStorage.getItem('user_coins');
            if (!userCoins) {
                userCoins = [];
                localStorage.setItem('user_coins', JSON.stringify(userCoins));
            } else {
                userCoins = JSON.parse(userCoins);
            }
            return userCoins;
        } catch (error) {
            console.error('Error getting user coins:', error);
            throw new Error('Ошибка при получении монет пользователя');
        }
    }

    static async getCoin(symbol) {
        try {
            // Получаем список всех монет
            const coins = await this.getCoins();
            // Находим нужную монету
            const coin = coins.find(c => c.symbol === symbol);
            if (!coin) {
                throw new Error('Монета не найдена');
            }
            
            // Получаем монеты пользователя и добавляем баланс к информации о монете
            const userCoins = await this.getUserCoins();
            const userCoin = userCoins.find(c => c.symbol === symbol);
            
            // Добавляем баланс пользователя к информации о монете
            coin.balance = userCoin ? userCoin.balance : 0;
            
            return coin;
        } catch (error) {
            console.error(`Error getting coin ${symbol}:`, error);
            throw new Error('Ошибка при получении информации о монете');
        }
    }

    // Методы для финансовых операций
    static async deposit(amount) {
        try {
            // Проверяем, что amount является числом и больше нуля
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('Некорректная сумма для пополнения');
            }
            
            // Получаем текущие данные пользователя
            let userData = await this.getUserInfo();
            
            // Пополняем баланс (убеждаемся, что balance существует и является числом)
            if (typeof userData.balance !== 'number') {
                userData.balance = 0;
            }
            userData.balance += numAmount;
            
            // Сохраняем обновленные данные
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Добавляем транзакцию
            await this.addTransaction('deposit', numAmount);
            
            return { balance: userData.balance };
        } catch (error) {
            console.error('Error depositing:', error);
            throw new Error('Ошибка при пополнении: ' + error.message);
        }
    }

    static async withdraw(amount) {
        try {
            // Получаем текущие данные пользователя
            let userData = await this.getUserInfo();
            
            // Проверяем достаточно ли средств
            if (userData.balance < amount) {
                throw new Error('Недостаточно средств');
            }
            
            // Уменьшаем баланс
            userData.balance -= amount;
            
            // Сохраняем обновленные данные
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Добавляем транзакцию
            await this.addTransaction('withdraw', -amount);
            
            return { balance: userData.balance };
        } catch (error) {
            console.error('Error withdrawing:', error);
            throw new Error('Ошибка при выводе');
        }
    }

    static async trade(coin, amount, type) {
        try {
            // Получаем текущие данные пользователя и монеты
            let userData = await this.getUserInfo();
            const coinData = await this.getCoin(coin);
            
            // Получаем монеты пользователя
            let userCoins = await this.getUserCoins();
            let userCoin = userCoins.find(c => c.symbol === coin);
            
            if (!userCoin) {
                userCoin = {
                    symbol: coin,
                    balance: 0
                };
                userCoins.push(userCoin);
            }
            
            const total = amount * coinData.price;
            
            if (type === 'buy') {
                // Проверяем достаточно ли средств
                if (userData.balance < total) {
                    throw new Error('Недостаточно средств');
                }
                
                // Уменьшаем баланс пользователя и увеличиваем баланс монеты
                userData.balance -= total;
                userCoin.balance += amount;
                
                // Добавляем транзакцию
                await this.addTransaction(`buy ${coin}`, -total);
            } else if (type === 'sell') {
                // Проверяем достаточно ли монет
                if (userCoin.balance < amount) {
                    throw new Error('Недостаточно монет');
                }
                
                // Увеличиваем баланс пользователя и уменьшаем баланс монеты
                userData.balance += total;
                userCoin.balance -= amount;
                
                // Добавляем транзакцию
                await this.addTransaction(`sell ${coin}`, total);
            }
            
            // Сохраняем обновленные данные
            localStorage.setItem('user_data', JSON.stringify(userData));
            localStorage.setItem('user_coins', JSON.stringify(userCoins));
            
            return { balance: userData.balance, coin_balance: userCoin.balance };
        } catch (error) {
            console.error('Error trading:', error);
            throw new Error('Ошибка при торговле');
        }
    }

    // Методы для работы с транзакциями
    static async getTransactions() {
        try {
            // Получаем транзакции из localStorage
            let transactions = localStorage.getItem('transactions');
            if (!transactions) {
                transactions = [];
                localStorage.setItem('transactions', JSON.stringify(transactions));
            } else {
                transactions = JSON.parse(transactions);
            }
            return transactions;
        } catch (error) {
            console.error('Error getting transactions:', error);
            throw new Error('Ошибка при получении транзакций');
        }
    }
    
    // Вспомогательный метод для добавления транзакций
    static async addTransaction(type, amount) {
        try {
            // Получаем текущие транзакции
            let transactions = await this.getTransactions();
            
            // Создаем новую транзакцию
            const newTransaction = {
                id: 'tx_' + Math.random().toString(36).substring(2),
                user_id: this.getUserId(),
                date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0].substring(0, 5),
                type: type,
                amount: amount
            };
            
            // Добавляем транзакцию в список
            transactions.push(newTransaction);
            
            // Сохраняем обновленный список транзакций
            localStorage.setItem('transactions', JSON.stringify(transactions));
            
            return newTransaction;
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw new Error('Ошибка при добавлении транзакции');
        }
    }

    // Методы для работы со стейкингом
    static async createStaking(coin, amount, duration) {
        try {
            // Проверяем, что amount является числом и больше нуля
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('Некорректная сумма для стейкинга');
            }
            
            // Проверяем, что duration является числом
            const numDuration = parseInt(duration);
            if (isNaN(numDuration)) {
                throw new Error('Некорректный срок стейкинга');
            }
            
            // Получаем монеты пользователя
            let userCoins = await this.getUserCoins();
            let userCoin = userCoins.find(c => c.symbol === coin);
            
            if (!userCoin) {
                throw new Error(`У вас нет монет ${coin} для стейкинга`);
            }
            
            if (userCoin.balance < numAmount) {
                throw new Error(`Недостаточно монет ${coin} для стейкинга. Доступно: ${userCoin.balance}`);
            }
            
            // Определяем ставку в зависимости от срока
            let rate = 0.0;
            if (numDuration === 7) {
                rate = 1.6;
            } else if (numDuration === 14) {
                rate = 2.1;
            } else if (numDuration === 30) {
                rate = 2.6;
            } else {
                throw new Error('Неверный срок стейкинга. Доступные сроки: 7, 14 или 30 дней');
            }
            
            // Рассчитываем награду
            const reward = numAmount * (rate / 100) * numDuration;
            
            // Создаем стейкинг
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + numDuration);
            
            const newStaking = {
                id: 'stk_' + Math.random().toString(36).substring(2),
                user_id: this.getUserId(),
                coin: coin,
                amount: numAmount,
                duration: numDuration,
                rate: rate,
                reward: reward,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                status: 'active'
            };
            
            // Получаем текущие стейкинги
            let stakings = await this.getStakings();
            stakings.push(newStaking);
            
            // Уменьшаем баланс монеты пользователя
            userCoin.balance -= numAmount;
            
            // Сохраняем обновленные данные
            localStorage.setItem('user_coins', JSON.stringify(userCoins));
            localStorage.setItem('stakings', JSON.stringify(stakings));
            
            // Добавляем транзакцию
            await this.addTransaction(`staking ${coin}`, -numAmount);
            
            return newStaking;
        } catch (error) {
            console.error('Error creating staking:', error);
            throw new Error('Ошибка при создании стейкинга: ' + error.message);
        }
    }

    static async getStakings() {
        try {
            // Получаем стейкинги из localStorage
            let stakings = localStorage.getItem('stakings');
            if (!stakings) {
                stakings = [];
                localStorage.setItem('stakings', JSON.stringify(stakings));
            } else {
                stakings = JSON.parse(stakings);
            }
            return stakings;
        } catch (error) {
            console.error('Error getting stakings:', error);
            throw new Error('Ошибка при получении стейкингов');
        }
    }

    // Метод для проверки аутентификации и перенаправления
    static checkAuth() {
        if (!this.isAuthenticated() && !window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
    
    // Методы для работы с избранными монетами
    static async addToFavorites(symbol) {
        try {
            const userData = await this.getUserInfo();
            if (!userData.favorites) {
                userData.favorites = [];
            }
            
            // Проверяем, есть ли уже такая монета в избранном
            if (!userData.favorites.includes(symbol)) {
                userData.favorites.push(symbol);
                localStorage.setItem('user_data', JSON.stringify(userData));
            }
            
            return userData.favorites;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            throw new Error('Ошибка при добавлении в избранное');
        }
    }
    
    static async removeFromFavorites(symbol) {
        try {
            const userData = await this.getUserInfo();
            if (!userData.favorites) {
                userData.favorites = [];
            }
            
            // Удаляем монету из избранного
            userData.favorites = userData.favorites.filter(s => s !== symbol);
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            return userData.favorites;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            throw new Error('Ошибка при удалении из избранного');
        }
    }
    
    static async getFavorites() {
        try {
            const userData = await this.getUserInfo();
            if (!userData.favorites) {
                userData.favorites = [];
                localStorage.setItem('user_data', JSON.stringify(userData));
            }
            
            // Получаем полную информацию о избранных монетах
            const allCoins = await this.getCoins();
            const favoriteCoins = allCoins.filter(coin => userData.favorites.includes(coin.symbol));
            
            return favoriteCoins;
        } catch (error) {
            console.error('Error getting favorites:', error);
            throw new Error('Ошибка при получении избранных монет');
        }
    }
    
    // Методы для работы с уведомлениями
    static async getNotifications() {
        try {
            const userData = await this.getUserInfo();
            return userData.notifications || [];
        } catch (error) {
            console.error('Error getting notifications:', error);
            throw new Error('Ошибка при получении уведомлений');
        }
    }
    
    static async markNotificationAsRead(notificationId) {
        try {
            const userData = await this.getUserInfo();
            if (!userData.notifications) {
                return [];
            }
            
            // Помечаем уведомление как прочитанное
            userData.notifications = userData.notifications.map(notif => {
                if (notif.id === notificationId) {
                    return { ...notif, read: true };
                }
                return notif;
            });
            
            localStorage.setItem('user_data', JSON.stringify(userData));
            return userData.notifications;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw new Error('Ошибка при отметке уведомления как прочитанного');
        }
    }
    
    static async clearNotifications() {
        try {
            const userData = await this.getUserInfo();
            userData.notifications = [];
            localStorage.setItem('user_data', JSON.stringify(userData));
            return [];
        } catch (error) {
            console.error('Error clearing notifications:', error);
            throw new Error('Ошибка при очистке уведомлений');
        }
    }
    
    // Метод для получения реального времени обновления цен
    static getLastUpdateTime() {
        const lastUpdate = localStorage.getItem('last_price_update');
        if (!lastUpdate) {
            const now = new Date().toISOString();
            localStorage.setItem('last_price_update', now);
            return now;
        }
        return lastUpdate;
    }
    
    // Метод для обновления времени последнего обновления цен
    static updateLastUpdateTime() {
        const now = new Date().toISOString();
        localStorage.setItem('last_price_update', now);
        return now;
    }
}