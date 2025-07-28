#!/usr/bin/env python3
"""
gRPC yapılandırma ve yönetim modülü
"""
import os
import sys
import subprocess
import logging
import time
from pathlib import Path
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class GrpcConfig:
    """gRPC yapılandırma ve yönetim sınıfı"""
    
    def __init__(self):
        self.auth_grpc_host = os.getenv("AUTH_GRPC_HOST", "localhost")
        self.auth_grpc_port = os.getenv("AUTH_GRPC_PORT", "50051")
        self.proto_file_path = Path("proto/auth.proto")
        self.generated_files = ["proto/auth_pb2.py", "proto/auth_pb2_grpc.py"]
        
    def get_grpc_url(self) -> str:
        """gRPC bağlantı URL'ini döner"""
        return f"{self.auth_grpc_host}:{self.auth_grpc_port}"
    
    def check_dependencies(self) -> bool:
        """Gerekli bağımlılıkları kontrol eder"""
        logger.info("🔍 Checking gRPC dependencies...")
        
        try:
            import grpc
            logger.info("✅ grpcio installed")
        except ImportError:
            logger.error("❌ grpcio not installed. Run: pip install grpcio grpcio-tools")
            return False
        
        try:
            import grpc_tools
            logger.info("✅ grpcio-tools installed")
        except ImportError:
            logger.error("❌ grpcio-tools not installed. Run: pip install grpcio-tools")
            return False
        
        return True
    
    def check_proto_file(self) -> bool:
        """Protobuf dosyasının varlığını kontrol eder"""
        if not self.proto_file_path.exists():
            logger.error(f"❌ Proto file not found: {self.proto_file_path}")
            return False
        logger.info(f"✅ Proto file found: {self.proto_file_path}")
        return True
    
    def check_generated_files(self) -> bool:
        """Generate edilmiş dosyaların varlığını kontrol eder"""
        missing_files = []
        for file in self.generated_files:
            if not Path(file).exists():
                missing_files.append(file)
        
        if missing_files:
            logger.warning(f"⚠️  Missing generated files: {missing_files}")
            return False
        
        logger.info("✅ All generated protobuf files exist")
        return True
    
    def generate_proto_files(self) -> bool:
        """Protobuf dosyalarını generate eder"""
        logger.info("🔧 Generating protobuf files...")
        
        if not self.check_proto_file():
            return False
        
        try:
            cmd = [
                sys.executable, "-m", "grpc_tools.protoc",
                "-I.", 
                "--python_out=.",
                "--grpc_python_out=.",
                str(self.proto_file_path)
            ]
            
            logger.info(f"Executing: {' '.join(cmd)}")
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("✅ Protobuf files generated successfully!")
                return True
            else:
                logger.error(f"❌ Error generating protobuf files: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Exception occurred: {str(e)}")
            return False
    
    def test_grpc_connection(self) -> bool:
        """gRPC bağlantısını test eder"""
        logger.info("🧪 Testing gRPC connection...")
        
        try:
            # grpc modülünü doğru şekilde import et
            import grpc
            
            # Basit bağlantı testi - sadece channel oluştur
            channel = grpc.insecure_channel(self.get_grpc_url())
            
            # Channel'ı hemen kapat (bağlantı testi yapmadan)
            channel.close()
            
            logger.info("✅ gRPC channel created successfully (auth service might not be running)")
            return True
            
        except ImportError as e:
            logger.error(f"❌ grpc module not available: {e}")
            return False
        except AttributeError as e:
            logger.error(f"❌ grpc module missing required attributes: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ gRPC connection test failed: {e}")
            return False
    
    def setup_grpc(self) -> bool:
        """gRPC kurulumunu gerçekleştirir"""
        logger.info("🚀 Starting gRPC setup...")
        
        # 1. Bağımlılıkları kontrol et
        if not self.check_dependencies():
            logger.error("❌ Dependencies check failed!")
            return False
        
        # 2. Protobuf dosyalarını generate et
        if not self.generate_proto_files():
            logger.error("❌ Protobuf generation failed!")
            return False
        
        # 3. Generate edilmiş dosyaları kontrol et
        if not self.check_generated_files():
            logger.error("❌ Generated files check failed!")
            return False
        
        logger.info("✅ gRPC setup completed successfully!")
        return True
    
    def create_env_example(self) -> bool:
        """Environment variables örneği oluşturur"""
        logger.info("📝 Creating environment variables example...")
        
        env_content = """# gRPC Configuration
AUTH_GRPC_HOST=localhost
AUTH_GRPC_PORT=50051

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/support_mate
"""
        
        try:
            with open(".env.example", "w") as f:
                f.write(env_content)
            logger.info("✅ .env.example created")
            return True
        except Exception as e:
            logger.error(f"❌ Error creating .env.example: {e}")
            return False
    
    def get_grpc_client(self):
        """gRPC client instance'ını döner"""
        try:
            from grpc_client.grpc_client import auth_grpc_client
            return auth_grpc_client
        except ImportError as e:
            logger.error(f"❌ Error importing gRPC client: {e}")
            return None
    
    def test_grpc_client(self) -> bool:
        """gRPC client'ını test eder"""
        logger.info("🧪 Testing gRPC client...")
        
        try:
            client = self.get_grpc_client()
            if client is None:
                return False
            
            # Client metodlarının varlığını kontrol et
            required_methods = [
                'get_user_by_id',
                'get_user_by_email', 
                'get_online_customer_supporters',
                'validate_token'
            ]
            
            for method in required_methods:
                if not hasattr(client, method):
                    logger.error(f"❌ Missing method: {method}")
                    return False
            
            logger.info("✅ gRPC client test completed")
            return True
            
        except Exception as e:
            logger.error(f"❌ gRPC client test failed: {e}")
            return False
    
    def run_full_setup(self) -> bool:
        """Tam gRPC kurulumunu çalıştırır"""
        logger.info("🚀 Running full gRPC setup...")
        
        # 1. Setup
        if not self.setup_grpc():
            return False
        
        # 2. Client test
        if not self.test_grpc_client():
            return False
        
        # 3. Environment example
        self.create_env_example()
        
        # 4. Connection test (opsiyonel)
        self.test_grpc_connection()
        
        logger.info("✅ Full gRPC setup completed!")
        return True

# Global gRPC config instance
grpc_config = GrpcConfig()

# Convenience functions
def get_grpc_config() -> GrpcConfig:
    """gRPC config instance'ını döner"""
    return grpc_config

def setup_grpc() -> bool:
    """gRPC kurulumunu çalıştırır"""
    return grpc_config.setup_grpc()

def test_grpc_connection() -> bool:
    """gRPC bağlantısını test eder"""
    return grpc_config.test_grpc_connection()

def get_grpc_client():
    """gRPC client'ını döner"""
    return grpc_config.get_grpc_client()

def run_full_grpc_setup() -> bool:
    """Tam gRPC kurulumunu çalıştırır"""
    return grpc_config.run_full_setup()

def main():
    """CLI interface"""
    if len(sys.argv) < 2:
        print("Usage: python grpcConfig.py <command>")
        print("Commands:")
        print("  setup     - Run full gRPC setup")
        print("  test      - Test gRPC connection")
        print("  generate  - Generate protobuf files")
        print("  check     - Check dependencies and files")
        return
    
    command = sys.argv[1]
    
    if command == "setup":
        success = run_full_grpc_setup()
        sys.exit(0 if success else 1)
    elif command == "test":
        success = test_grpc_connection()
        sys.exit(0 if success else 1)
    elif command == "generate":
        success = grpc_config.generate_proto_files()
        sys.exit(0 if success else 1)
    elif command == "check":
        deps_ok = grpc_config.check_dependencies()
        proto_ok = grpc_config.check_proto_file()
        files_ok = grpc_config.check_generated_files()
        success = deps_ok and proto_ok and files_ok
        sys.exit(0 if success else 1)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main() 