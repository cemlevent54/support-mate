import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
import requests
import logging

load_dotenv()

# Logger setup
logger = logging.getLogger(__name__)

security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:9000")

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
    """Get user information by user ID using the gateway API"""
    url = f"{GATEWAY_URL}/api/auth/users/{user_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            user_data = response.json().get("data")
            logger.info(f"Successfully fetched user data for user_id: {user_id}")
            return user_data
        else:
            logger.error(f"Failed to fetch user data. Status: {response.status_code}, Response: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not fetch user info"
            )
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error while fetching user data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable"
        )

def get_user_by_email(email, token):
    """Get user information by email using the gateway API"""
    url = f"{GATEWAY_URL}/api/auth/users/email/{email}"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            user_data = response.json().get("data")
            logger.info(f"Successfully fetched user data for email: {email}")
            return user_data
        else:
            logger.error(f"Failed to fetch user data by email. Status: {response.status_code}, Response: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error while fetching user data by email: {str(e)}")
        return None

def get_current_user_with_details(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user with full details from auth service"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("userId")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing userId"
            )
        
        # Get full user details from auth service
        user_details = get_user_by_id(user_id, token)
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
    """Get customer information for agent assignment (email notifications)"""
    try:
        customer_data = get_user_by_id(customer_id, agent_token)
        if customer_data:
            return {
                "customer_id": customer_id,
                "customer_email": customer_data.get("email"),
                "customer_name": customer_data.get("name") or customer_data.get("firstName", "") + " " + customer_data.get("lastName", ""),
                "customer_phone": customer_data.get("phone")
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