"""Technical analysis service for calculating indicators."""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TechnicalAnalysisService:
    """Service for calculating technical indicators."""
    
    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> Optional[float]:
        """
        Calculate Simple Moving Average.
        
        Args:
            prices: List of prices (newest last)
            period: Period for SMA
            
        Returns:
            SMA value or None if insufficient data
        """
        if len(prices) < period:
            return None
        
        return np.mean(prices[-period:])
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> Optional[float]:
        """
        Calculate Exponential Moving Average.
        
        Args:
            prices: List of prices (newest last)
            period: Period for EMA
            
        Returns:
            EMA value or None if insufficient data
        """
        if len(prices) < period:
            return None
        
        df = pd.DataFrame({'price': prices})
        ema = df['price'].ewm(span=period, adjust=False).mean()
        return float(ema.iloc[-1])
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
        """
        Calculate Relative Strength Index.
        
        Args:
            prices: List of closing prices (newest last)
            period: Period for RSI (default 14)
            
        Returns:
            RSI value (0-100) or None if insufficient data
        """
        if len(prices) < period + 1:
            return None
        
        # Calculate price changes
        deltas = np.diff(prices)
        
        # Separate gains and losses
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        # Calculate average gains and losses
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return round(float(rsi), 2)
    
    @staticmethod
    def calculate_macd(
        prices: List[float],
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9
    ) -> Optional[Dict[str, float]]:
        """
        Calculate MACD (Moving Average Convergence Divergence).
        
        Args:
            prices: List of closing prices
            fast_period: Fast EMA period (default 12)
            slow_period: Slow EMA period (default 26)
            signal_period: Signal line period (default 9)
            
        Returns:
            Dictionary with macd, signal, and histogram values
        """
        if len(prices) < slow_period:
            return None
        
        df = pd.DataFrame({'price': prices})
        
        # Calculate EMAs
        ema_fast = df['price'].ewm(span=fast_period, adjust=False).mean()
        ema_slow = df['price'].ewm(span=slow_period, adjust=False).mean()
        
        # Calculate MACD line
        macd_line = ema_fast - ema_slow
        
        # Calculate signal line
        signal_line = macd_line.ewm(span=signal_period, adjust=False).mean()
        
        # Calculate histogram
        histogram = macd_line - signal_line
        
        return {
            'macd': round(float(macd_line.iloc[-1]), 2),
            'signal': round(float(signal_line.iloc[-1]), 2),
            'histogram': round(float(histogram.iloc[-1]), 2)
        }
    
    @staticmethod
    def calculate_bollinger_bands(
        prices: List[float],
        period: int = 20,
        std_dev: float = 2.0
    ) -> Optional[Dict[str, float]]:
        """
        Calculate Bollinger Bands.
        
        Args:
            prices: List of closing prices
            period: Period for moving average (default 20)
            std_dev: Number of standard deviations (default 2)
            
        Returns:
            Dictionary with upper, middle, and lower band values
        """
        if len(prices) < period:
            return None
        
        # Calculate SMA (middle band)
        sma = np.mean(prices[-period:])
        
        # Calculate standard deviation
        std = np.std(prices[-period:])
        
        # Calculate bands
        upper_band = sma + (std_dev * std)
        lower_band = sma - (std_dev * std)
        
        return {
            'upper': round(float(upper_band), 2),
            'middle': round(float(sma), 2),
            'lower': round(float(lower_band), 2)
        }
    
    @staticmethod
    def calculate_atr(
        high: List[float],
        low: List[float],
        close: List[float],
        period: int = 14
    ) -> Optional[float]:
        """
        Calculate Average True Range.
        
        Args:
            high: List of high prices
            low: List of low prices
            close: List of closing prices
            period: Period for ATR (default 14)
            
        Returns:
            ATR value or None if insufficient data
        """
        if len(high) < period + 1 or len(low) < period + 1 or len(close) < period + 1:
            return None
        
        # Calculate True Range
        tr_list = []
        for i in range(1, len(close)):
            tr1 = high[i] - low[i]
            tr2 = abs(high[i] - close[i - 1])
            tr3 = abs(low[i] - close[i - 1])
            tr = max(tr1, tr2, tr3)
            tr_list.append(tr)
        
        # Calculate ATR as average of TR over period
        if len(tr_list) < period:
            return None
        
        atr = np.mean(tr_list[-period:])
        return round(float(atr), 2)
    
    @staticmethod
    def identify_trend(prices: List[float], sma_short: int = 20, sma_long: int = 50) -> str:
        """
        Identify price trend based on moving averages.
        
        Args:
            prices: List of closing prices
            sma_short: Short-term SMA period
            sma_long: Long-term SMA period
            
        Returns:
            Trend string: 'BULLISH', 'BEARISH', or 'NEUTRAL'
        """
        if len(prices) < sma_long:
            return 'NEUTRAL'
        
        sma_short_val = TechnicalAnalysisService.calculate_sma(prices, sma_short)
        sma_long_val = TechnicalAnalysisService.calculate_sma(prices, sma_long)
        
        if sma_short_val is None or sma_long_val is None:
            return 'NEUTRAL'
        
        if sma_short_val > sma_long_val * 1.02:  # 2% above
            return 'BULLISH'
        elif sma_short_val < sma_long_val * 0.98:  # 2% below
            return 'BEARISH'
        else:
            return 'NEUTRAL'
    
    @staticmethod
    def calculate_all_indicators(price_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate all technical indicators for a stock.
        
        Args:
            price_data: List of price dictionaries with OHLCV data
            
        Returns:
            Dictionary with all calculated indicators
        """
        if not price_data:
            return {}
        
        # Extract price arrays
        closes = [d['close'] for d in price_data]
        highs = [d['high'] for d in price_data]
        lows = [d['low'] for d in price_data]
        
        indicators = {}
        
        # Moving Averages
        indicators['sma_20'] = TechnicalAnalysisService.calculate_sma(closes, 20)
        indicators['sma_50'] = TechnicalAnalysisService.calculate_sma(closes, 50)
        indicators['sma_200'] = TechnicalAnalysisService.calculate_sma(closes, 200)
        indicators['ema_12'] = TechnicalAnalysisService.calculate_ema(closes, 12)
        indicators['ema_26'] = TechnicalAnalysisService.calculate_ema(closes, 26)
        
        # RSI
        indicators['rsi_14'] = TechnicalAnalysisService.calculate_rsi(closes, 14)
        
        # MACD
        macd_data = TechnicalAnalysisService.calculate_macd(closes)
        if macd_data:
            indicators.update(macd_data)
        
        # Bollinger Bands
        bb_data = TechnicalAnalysisService.calculate_bollinger_bands(closes)
        if bb_data:
            indicators['bb_upper'] = bb_data['upper']
            indicators['bb_middle'] = bb_data['middle']
            indicators['bb_lower'] = bb_data['lower']
        
        # ATR
        indicators['atr_14'] = TechnicalAnalysisService.calculate_atr(highs, lows, closes, 14)
        
        # Trend
        indicators['trend'] = TechnicalAnalysisService.identify_trend(closes)
        
        return indicators
