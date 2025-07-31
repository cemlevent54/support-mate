
## .env Eklenmesi gerekenler  (Örnek değerler)

```
# Zookeeper ayarları
ZOOKEEPER_PORT=2181
ZOOKEEPER_CONTAINER_NAME=zookeeper

# Kafka ayarları
KAFKA_PORT=9092
KAFKA_CONTAINER_NAME=kafka
KAFKA_BROKER_ID=1
KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1

# Kafka UI ayarları
KAFKA_UI_PORT=5008
KAFKA_UI_CONTAINER_NAME=kafka-ui
KAFKA_UI_CLUSTER_NAME=local
KAFKA_UI_BOOTSTRAPSERVERS=kafka:9092
KAFKA_UI_ZOOKEEPER=zookeeper:2181
```

### Başlatma
```bash
cd kafka
docker-compose up -d
```