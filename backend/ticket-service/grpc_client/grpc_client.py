import grpc
import os
import logging
from dotenv import load_dotenv
from typing import Optional, List, Dict, Any

# Protobuf importları (protoc ile generate edildikten sonra)
try:
    from proto import auth_pb2
    from proto import auth_pb2_grpc
except ImportError:
    # Protobuf dosyaları henüz generate edilmemişse
    auth_pb2 = None
    auth_pb2_grpc = None

load_dotenv()

logger = logging.getLogger(__name__)

class AuthGrpcClient:
    def __init__(self):
        self.auth_grpc_host = os.getenv("AUTH_GRPC_HOST", "localhost")
        self.auth_grpc_port = os.getenv("AUTH_GRPC_PORT", "50051")
        self.channel = None
        self.stub = None
        self._connection_retries = 3
        self._connection_timeout = 10
    
    def _get_channel(self):
        """gRPC channel'ı oluşturur"""
        if self.channel is None:
            try:
                self.channel = grpc.insecure_channel(f"{self.auth_grpc_host}:{self.auth_grpc_port}")
                logger.info(f"gRPC channel created for {self.auth_grpc_host}:{self.auth_grpc_port}")
            except Exception as e:
                logger.error(f"Failed to create gRPC channel: {e}")
                return None
        return self.channel
    
    def _get_stub(self):
        """gRPC stub'ını oluşturur"""
        if self.stub is None and auth_pb2_grpc is not None:
            channel = self._get_channel()
            if channel:
                self.stub = auth_pb2_grpc.AuthServiceStub(channel)
                logger.info("gRPC stub created successfully")
            else:
                logger.error("Failed to create gRPC stub - channel is None")
        return self.stub
    
    def _check_protobuf_files(self):
        """Protobuf dosyalarının varlığını kontrol eder"""
        if auth_pb2 is None or auth_pb2_grpc is None:
            logger.error("Protobuf files not generated. Please run: python config/grpcConfig.py setup")
            return False
        return True
    
    def get_user_by_id(self, user_id: str, token: str) -> Optional[Dict[str, Any]]:
        """Kullanıcı bilgilerini ID ile getirir"""
        if not self._check_protobuf_files():
            return None
        
        try:
            stub = self._get_stub()
            if not stub:
                logger.error("gRPC stub not available")
                return None
                
            request = auth_pb2.GetUserRequest(id=user_id, token=token)
            response = stub.GetUserById(request, timeout=self._connection_timeout)
            
            if response.success:
                user = response.user
                return {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "phone": user.phone,
                    "role": {
                        "id": user.role.id,
                        "name": user.role.name,
                        "description": user.role.description
                    },
                    "languagePreference": user.languagePreference,
                    "isOnline": user.isOnline,
                    "lastSeen": user.lastSeen
                }
            else:
                logger.error(f"Failed to get user by ID: {response.message}")
                return None
                
        except grpc.RpcError as e:
            logger.error(f"gRPC error while getting user by ID: {e.details()}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error while getting user by ID: {str(e)}")
            return None
    
    def get_user_by_email(self, email: str, token: str) -> Optional[Dict[str, Any]]:
        """Kullanıcı bilgilerini email ile getirir"""
        if not self._check_protobuf_files():
            return None
        
        try:
            stub = self._get_stub()
            if not stub:
                logger.error("gRPC stub not available")
                return None
                
            request = auth_pb2.GetUserByEmailRequest(email=email, token=token)
            response = stub.GetUserByEmail(request, timeout=self._connection_timeout)
            
            if response.success:
                user = response.user
                return {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "phone": user.phone,
                    "role": {
                        "id": user.role.id,
                        "name": user.role.name,
                        "description": user.role.description
                    },
                    "languagePreference": user.languagePreference,
                    "isOnline": user.isOnline,
                    "lastSeen": user.lastSeen
                }
            else:
                logger.error(f"Failed to get user by email: {response.message}")
                return None
                
        except grpc.RpcError as e:
            logger.error(f"gRPC error while getting user by email: {e.details()}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error while getting user by email: {str(e)}")
            return None
    
    def get_online_customer_supporters(self) -> List[Dict[str, Any]]:
        """Online customer supporter'ları getirir"""
        if not self._check_protobuf_files():
            return []
        
        try:
            stub = self._get_stub()
            if not stub:
                logger.error("gRPC stub not available")
                return []
                
            request = auth_pb2.Empty()
            response = stub.GetOnlineCustomerSupporters(request, timeout=self._connection_timeout)
            
            if response.success:
                users = []
                for user in response.users:
                    users.append({
                        "id": user.id,
                        "email": user.email,
                        "name": user.name,
                        "firstName": user.firstName,
                        "lastName": user.lastName,
                        "phone": user.phone,
                        "role": {
                            "id": user.role.id,
                            "name": user.role.name,
                            "description": user.role.description
                        },
                        "isOnline": user.isOnline,
                        "lastSeen": user.lastSeen
                    })
                return users
            else:
                logger.error(f"Failed to get online customer supporters: {response.message}")
                return []
                
        except grpc.RpcError as e:
            logger.error(f"gRPC error while getting online customer supporters: {e.details()}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error while getting online customer supporters: {str(e)}")
            return []
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Token'ı doğrular ve kullanıcı bilgilerini döner"""
        if not self._check_protobuf_files():
            return None
        
        try:
            stub = self._get_stub()
            if not stub:
                logger.error("gRPC stub not available")
                return None
                
            request = auth_pb2.ValidateTokenRequest(token=token)
            response = stub.ValidateToken(request, timeout=self._connection_timeout)
            
            if response.valid:
                return {
                    "valid": True,
                    "userId": response.userId,
                    "message": response.message
                }
            else:
                logger.error(f"Token validation failed: {response.message}")
                return None
                
        except grpc.RpcError as e:
            logger.error(f"gRPC error while validating token: {e.details()}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error while validating token: {str(e)}")
            return None
    
    def test_connection(self) -> bool:
        """gRPC bağlantısını test eder"""
        try:
            channel = self._get_channel()
            if not channel:
                return False
                
            # Basit test - sadece channel'ın oluşturulabildiğini kontrol et
            logger.info("gRPC channel created successfully")
            return True
            
        except Exception as e:
            logger.error(f"gRPC connection test failed: {e}")
            return False
    
    def close(self):
        """Channel'ı kapatır"""
        if self.channel:
            self.channel.close()
            self.channel = None
            self.stub = None
            logger.info("gRPC channel closed")

# Global client instance
auth_grpc_client = AuthGrpcClient() 