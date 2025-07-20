from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

def to_tr_time(dt: datetime) -> datetime:
    """UTC datetime'ı Türkiye saatine çevirir"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Naive datetime ise UTC olarak kabul et
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone(timedelta(hours=3)))

def to_tr_time_str(dt: datetime) -> str:
    """UTC datetime'ı Türkiye saati string'ine çevirir"""
    if dt is None:
        return None
    tr_time = to_tr_time(dt)
    return tr_time.isoformat()

def convert_dict_timestamps_to_tr(data: Dict[str, Any]) -> Dict[str, Any]:
    """Dict içindeki timestamp alanlarını TR saatine çevirir"""
    if not isinstance(data, dict):
        return data
    
    result = {}
    for key, value in data.items():
        if key in ['createdAt', 'updatedAt', 'deletedAt', 'timestamp', 'closedAt', 'endedAt']:
            if isinstance(value, datetime):
                result[key] = to_tr_time_str(value)
            else:
                result[key] = value
        elif isinstance(value, dict):
            result[key] = convert_dict_timestamps_to_tr(value)
        elif isinstance(value, list):
            result[key] = [convert_dict_timestamps_to_tr(item) if isinstance(item, dict) else item for item in value]
        else:
            result[key] = value
    
    return result 