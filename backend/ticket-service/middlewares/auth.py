import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
import logging

# gRPC client import
try:
    from grpc_client.grpc_client import auth_grpc_client
except ImportError:
    # Fallback for when grpc module is not available
    auth_grpc_client = None
    logging.warning("gRPC client not available - falling back to REST API")

load_dotenv()

# Logger setup
logger = logging.getLogger(__name__)

security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is not set!")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing token"
        )

def get_user_by_id(user_id, token):
    """Get user information by user ID using gRPC"""
    if auth_grpc_client is None:
        logger.error("gRPC client not available")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable"
        )
    
    try:
        
        
        user_data = auth_grpc_client.get_user_by_id(user_id, token)
        if user_data:
            logger.info(f"Successfully fetched user data for user_id: {user_id}")
            return user_data
        else:
            logger.error(f"Failed to fetch user data for user_id: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not fetch user info"
            )
    except Exception as e:
        logger.error(f"Error while fetching user data via gRPC: {str(e)}")
        # Hata durumunda basit bir kullanıcı objesi döndür
        logger.warning(f"Returning basic user info for user_id: {user_id} due to error")
        return {
            "id": user_id,
            "firstName": "User",
            "lastName": "",
            "email": "",
            "languagePreference": "tr"
        }

def get_user_by_email(email, token):
    """Get user information by email using gRPC"""
    if auth_grpc_client is None:
        logger.error("gRPC client not available")
        return None
    
    try:
        user_data = auth_grpc_client.get_user_by_email(email, token)
        if user_data:
            logger.info(f"Successfully fetched user data for email: {email}")
            return user_data
        else:
            logger.error(f"Failed to fetch user data by email: {email}")
            return None
    except Exception as e:
        logger.error(f"Error while fetching user data by email via gRPC: {str(e)}")
        return None

def get_current_user_with_details(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user with full details from auth service via gRPC"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("userId")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing userId"
            )
        
        # Get full user details from auth service via gRPC
        user_details = get_user_by_id(user_id, token)
        
        # Ensure languagePreference is included in user details
        if user_details and "languagePreference" not in user_details:
            user_details["languagePreference"] = "tr"  # Default value
        
        return {
            "token_payload": payload,
            "user_details": user_details
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing token"
        )

def get_customer_info_for_agent(customer_id, agent_token):
    """Get customer information for agent assignment (email notifications) via gRPC"""
    try:
        customer_data = get_user_by_id(customer_id, agent_token)
        if customer_data:
            return {
                "customer_id": customer_id,
                "customer_email": customer_data.get("email"),
                "customer_name": customer_data.get("name") or customer_data.get("firstName", "") + " " + customer_data.get("lastName", ""),
                "customer_phone": customer_data.get("phone"),
                "customer_language_preference": customer_data.get("languagePreference", "tr")
            }
        else:
            logger.warning(f"Customer data not found for customer_id: {customer_id}")
            return None
    except Exception as e:
        logger.error(f"Error getting customer info for agent: {str(e)}")
        return None

def verify_agent_permission(current_user_with_details):
    """Verify if current user has Customer Supporter role"""
    user_details = current_user_with_details.get("user_details", {})
    user_role = user_details.get("role", {}).get("name")
    
    if user_role != "Customer Supporter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Customer Supporter role can perform this action."
        )
    
    return user_details

def get_online_customer_supporters():
    """Gateway üzerinden online customer supporter detaylarını getirir via gRPC"""
    if auth_grpc_client is None:
        logger.error("gRPC client not available")
        return []
    
    try:
        data = auth_grpc_client.get_online_customer_supporters()
        return data
    except Exception as e:
        logger.error(f"Request error while fetching online customer supporters via gRPC: {str(e)}")
        return []

def test_grpc_connection():
    """gRPC bağlantısını test eder"""
    if auth_grpc_client is None:
        logger.error("gRPC client not available")
        return False
    
    try:
        return auth_grpc_client.test_connection()
    except Exception as e:
        logger.error(f"gRPC connection test failed: {e}")
        return False