import logging
import sys
import os
from config.logger import LOG_CONFIG

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config.socketio import socket_app, fastapi_app
from config.cors import CORS_CONFIG
import uvicorn
from kafka_files.kafkaConsumer import start_agent_online_consumer
from config.env import get_default_language
from config.language import set_language
from fastapi.staticfiles import StaticFiles

if __name__ == "__main__":
    set_language(get_default_language())
    import logging
    from config.language import _
    logging.info(_(f"config.language.default_language").format(lang=get_default_language()))
    
    # gRPC setup'ını otomatik çalıştır
    try:
        from config.grpcConfig import get_grpc_config, setup_grpc, test_grpc_connection
        grpc_config = get_grpc_config()
        
        # Protobuf dosyalarını generate et
        if setup_grpc():
            logging.info("✅ gRPC setup completed successfully")
            
            # Bağlantı testi
            if test_grpc_connection():
                logging.info("✅ gRPC connection established")
            else:
                logging.warning("⚠️  gRPC connection failed - auth service might not be running")
        else:
            logging.warning("⚠️  gRPC setup failed - continuing without gRPC")
            
    except ImportError as e:
        logging.warning(f"⚠️  gRPC config not available: {e}")
    except Exception as e:
        logging.error(f"❌ gRPC setup error: {e}")
    
    start_agent_online_consumer()

    # Statik dosya servisi (uploads klasörü)
    fastapi_app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    # uvicorn.run kaldırıldı çünkü artık Dockerfile'da uvicorn çalıştırılıyor
    # Hot reload Dockerfile'da yapılıyor
    pass
