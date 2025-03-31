from fastapi import FastAPI, HTTPException, Body, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, List, Optional, Union
import uvicorn
from datetime import datetime, timedelta
import uuid
import jwt
import hashlib
import os
from passlib.context import CryptContext

app = FastAPI()

# Настройки безопасности
SECRET_KEY = "your-secret-key-for-jwt-tokens"  # В реальном приложении используйте переменную окружения
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней

# Контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 для получения токена
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Модели данных для аутентификации
class UserAuth(BaseModel):
    email: EmailStr
    password: str

class UserCreate(UserAuth):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

# Модели данных для пользователя
class User(BaseModel):
    id: str
    email: str
    balance: float
    status: str
    verification: str
    registration_date: str
    hashed_password: str = Field(..., exclude=True)  # Исключаем из ответов API

class UserResponse(BaseModel):
    id: str
    email: str
    balance: float
    status: str
    verification: str
    registration_date: str

class Coin(BaseModel):
    symbol: str
    name: str
    price: float
    balance: float

class UserCoin(BaseModel):
    user_id: str
    coin_symbol: str
    balance: float

class Transaction(BaseModel):
    id: str
    user_id: str
    date: str
    type: str
    amount: float

class Staking(BaseModel):
    id: str
    user_id: str
    coin: str
    amount: float
    duration: int
    rate: float
    reward: float
    start_date: str
    end_date: str
    status: str

# Хранилище данных (в реальном приложении это была бы база данных)
users = {}  # id -> User
user_coins = {}  # user_id -> {coin_symbol -> UserCoin}
coins = {
    "BTC": Coin(symbol="BTC", name="Bitcoin", price=67500.0, balance=0.0),
    "ETH": Coin(symbol="ETH", name="Ethereum", price=3850.0, balance=0.0),
    "SOL": Coin(symbol="SOL", name="Solana", price=180.0, balance=0.0),
    "ADA": Coin(symbol="ADA", name="Cardano", price=0.45, balance=0.0),
    "DOT": Coin(symbol="DOT", name="Polkadot", price=7.25, balance=0.0)
}
transactions = []
stakings = []

# Добавляем CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене укажите конкретный домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Функции для работы с аутентификацией
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недействительные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except jwt.PyJWTError:
        raise credentials_exception
    user = users.get(token_data.user_id)
    if user is None:
        raise credentials_exception
    return user

# Эндпоинты для аутентификации
@app.post("/api/auth/register", response_model=Token)
async def register_user(user_data: UserCreate):
    # Проверяем, что пользователь с таким email не существует
    for user in users.values():
        if hasattr(user, 'email') and user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )
    
    # Создаем нового пользователя
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        id=user_id,
        email=user_data.email,
        hashed_password=hashed_password,
        balance=1000.0,  # Начальный баланс для демонстрации
        status="active",
        verification="basic",
        registration_date=datetime.now().strftime("%Y-%m-%d")
    )
    
    users[user_id] = new_user
    user_coins[user_id] = {}
    
    # Создаем токен доступа
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id, "email": user_data.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}

@app.post("/api/auth/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = None
    for u in users.values():
        if hasattr(u, 'email') and u.email == form_data.username:
            user = u
            break
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

# Эндпоинты для пользователя
@app.get("/api/user/me", response_model=UserResponse)
async def get_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/api/user/deposit")
async def deposit(amount: dict = Body(...), current_user: User = Depends(get_current_user)):
    amount_value = amount.get("amount", 0)
    current_user.balance += amount_value
    
    # Добавляем транзакцию
    transaction_id = str(uuid.uuid4())
    transactions.append(Transaction(
        id=transaction_id,
        user_id=current_user.id,
        date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        type="deposit",
        amount=amount_value
    ))
    
    return {"balance": current_user.balance}

@app.post("/api/user/withdraw")
async def withdraw(amount: dict = Body(...), current_user: User = Depends(get_current_user)):
    amount_value = amount.get("amount", 0)
    if current_user.balance < amount_value:
        raise HTTPException(status_code=400, detail="Недостаточно средств")
    
    current_user.balance -= amount_value
    
    # Добавляем транзакцию
    transaction_id = str(uuid.uuid4())
    transactions.append(Transaction(
        id=transaction_id,
        user_id=current_user.id,
        date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        type="withdraw",
        amount=-amount_value
    ))
    
    return {"balance": current_user.balance}

# Эндпоинты для монет
@app.get("/api/coins")
async def get_coins():
    return list(coins.values())

@app.get("/api/coin/{symbol}")
async def get_coin(symbol: str):
    if symbol not in coins:
        raise HTTPException(status_code=404, detail="Монета не найдена")
    return coins[symbol]

@app.get("/api/user/coins")
async def get_user_coins(current_user: User = Depends(get_current_user)):
    if current_user.id not in user_coins:
        user_coins[current_user.id] = {}
    return list(user_coins[current_user.id].values())

# Эндпоинт для торговли
@app.post("/api/trade")
async def trade(data: dict = Body(...), current_user: User = Depends(get_current_user)):
    coin_symbol = data.get("coin")
    amount = data.get("amount")
    trade_type = data.get("type")
    
    if coin_symbol not in coins:
        raise HTTPException(status_code=404, detail="Монета не найдена")

    coin = coins[coin_symbol]
    coin_price = coin.price
    total = amount * coin_price

    # Инициализируем баланс монеты для пользователя, если его нет
    if current_user.id not in user_coins:
        user_coins[current_user.id] = {}
    
    if coin_symbol not in user_coins[current_user.id]:
        user_coins[current_user.id][coin_symbol] = UserCoin(
            user_id=current_user.id,
            coin_symbol=coin_symbol,
            balance=0.0
        )

    user_coin = user_coins[current_user.id][coin_symbol]

    if trade_type == "buy":
        if current_user.balance < total:
            raise HTTPException(status_code=400, detail="Недостаточно средств")
        current_user.balance -= total
        user_coin.balance += amount
        
        # Добавляем транзакцию
        transaction_id = str(uuid.uuid4())
        transactions.append(Transaction(
            id=transaction_id,
            user_id=current_user.id,
            date=datetime.now().strftime("%Y-%m-%d %H:%M"),
            type=f"buy {coin_symbol}",
            amount=-total
        ))
        
    elif trade_type == "sell":
        if user_coin.balance < amount:
            raise HTTPException(status_code=400, detail="Недостаточно монет")
        current_user.balance += total
        user_coin.balance -= amount
        
        # Добавляем транзакцию
        transaction_id = str(uuid.uuid4())
        transactions.append(Transaction(
            id=transaction_id,
            user_id=current_user.id,
            date=datetime.now().strftime("%Y-%m-%d %H:%M"),
            type=f"sell {coin_symbol}",
            amount=total
        ))

    return {"balance": current_user.balance, "coin_balance": user_coin.balance}

# Эндпоинты для транзакций
@app.get("/api/transactions")
async def get_transactions(current_user: User = Depends(get_current_user)):
    user_transactions = [t for t in transactions if t.user_id == current_user.id]
    return user_transactions

# Эндпоинты для стейкинга
@app.post("/api/staking")
async def create_staking(data: dict = Body(...), current_user: User = Depends(get_current_user)):
    coin_symbol = data.get("coin")
    amount = data.get("amount")
    duration = data.get("duration")
    
    if coin_symbol not in coins:
        raise HTTPException(status_code=404, detail="Монета не найдена")
    
    # Проверяем, есть ли у пользователя достаточно монет
    if current_user.id not in user_coins or coin_symbol not in user_coins[current_user.id]:
        raise HTTPException(status_code=400, detail="У вас нет этой монеты")
    
    user_coin = user_coins[current_user.id][coin_symbol]
    if user_coin.balance < amount:
        raise HTTPException(status_code=400, detail="Недостаточно монет для стейкинга")
    
    # Определяем ставку в зависимости от срока
    rate = 0.0
    if duration == 7:
        rate = 1.6
    elif duration == 14:
        rate = 2.1
    elif duration == 30:
        rate = 2.6
    else:
        raise HTTPException(status_code=400, detail="Неверный срок стейкинга")
    
    # Рассчитываем награду
    reward = amount * (rate / 100) * duration
    
    # Создаем стейкинг
    staking_id = str(uuid.uuid4())
    start_date = datetime.now()
    end_date = start_date + timedelta(days=duration)
    
    new_staking = Staking(
        id=staking_id,
        user_id=current_user.id,
        coin=coin_symbol,
        amount=amount,
        duration=duration,
        rate=rate,
        reward=reward,
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=end_date.strftime("%Y-%m-%d"),
        status="active"
    )
    
    stakings.append(new_staking)
    
    # Уменьшаем баланс монеты пользователя
    user_coin.balance -= amount
    
    # Добавляем транзакцию
    transaction_id = str(uuid.uuid4())
    transactions.append(Transaction(
        id=transaction_id,
        user_id=current_user.id,
        date=datetime.now().strftime("%Y-%m-%d %H:%M"),
        type=f"staking {coin_symbol}",
        amount=-amount
    ))
    
    return new_staking

@app.get("/api/stakings")
async def get_stakings(current_user: User = Depends(get_current_user)):
    user_stakings = [s for s in stakings if s.user_id == current_user.id]
    return user_stakings

# Запуск сервера
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)