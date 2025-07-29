from repositories.TicketRepository import TicketRepository
from repositories.ChatRepository import ChatRepository
from repositories.MessageRepository import MessageRepository
from config.logger import get_logger
from kafka_files.kafkaProducer import send_agent_assigned_event
from middlewares.auth import get_user_by_id
import os

class AssignAgentToPendingTicketCommandHandler:
    def __init__(self):
        self.ticket_repository = TicketRepository()
        self.chat_repository = ChatRepository()
        self.message_repository = MessageRepository()
        self.logger = get_logger()

    async def execute(self, agent_id, token=None):
        self.logger.info(f"[ASSIGN_AGENT] Agent assignment başlatıldı: agentId={agent_id}")
        
        try:
            # Null assignedAgentId'li ticket'ları bul
            self.logger.info(f"[ASSIGN_AGENT] Searching for pending tickets...")
            pending_tickets = self.ticket_repository.collection.find({"assignedAgentId": None}).sort("createdAt", 1)
            ticket = next(pending_tickets, None)
            
            if ticket:
                ticket_id = str(ticket["_id"])
                self.logger.info(f"[ASSIGN_AGENT] Pending ticket bulundu: ticketId={ticket_id}, title={ticket.get('title')}")
                self.logger.info(f"[ASSIGN_AGENT] Ticket type: {type(ticket)}")
                self.logger.info(f"[ASSIGN_AGENT] Ticket content: {ticket}")
                
                # Ticket'a agent ata ve status'ü IN_REVIEW yap
                self.logger.info(f"[ASSIGN_AGENT] Calling ticket_repository.update with ticket_id={ticket_id}, agent_id={agent_id}")
                try:
                    update_data = {"assignedAgentId": agent_id, "status": "IN_REVIEW"}
                    self.logger.info(f"[ASSIGN_AGENT] Update data: {update_data}")
                    result = self.ticket_repository.update(ticket_id, update_data)
                    self.logger.info(f"[ASSIGN_AGENT] Update result: {result}")
                except Exception as e:
                    self.logger.error(f"[ASSIGN_AGENT] Error in ticket_repository.update: {e}", exc_info=True)
                    raise
                
                self.logger.info(f"[ASSIGN_AGENT] Agent atandı: ticketId={ticket_id}, agentId={agent_id}")
                
                # Chat'i güncelle
                chat = self.chat_repository.collection.find_one({"ticketId": ticket_id})
                if chat:
                    participants = chat.get("participants", [])
                    if not any(p.get("userId") == agent_id for p in participants):
                        participants.append({"userId": agent_id, "role": "Customer Supporter"})
                        self.chat_repository.update(chat["_id"], {"participants": participants})
                        self.logger.info(f"[ASSIGN_AGENT] Chat participants güncellendi: chatId={chat['_id']}")
                    
                    # Chat'teki mesajları güncelle
                    chat_id = str(chat["_id"])
                    update_result = self.message_repository.collection.update_many(
                        {"chatId": chat_id, "is_delivered": False},
                        {
                            "$set": {
                                "is_delivered": True,
                                "receiverId": agent_id
                            }
                        }
                    )
                    self.logger.info(f"[ASSIGN_AGENT] Mesajlar güncellendi: chatId={chat_id}, agentId={agent_id}, updatedCount={update_result.modified_count}")
                else:
                    self.logger.warning(f"[ASSIGN_AGENT] Chat bulunamadı: ticketId={ticket_id}")
                
                # Agent-assigned event'ini tetikle
                try:
                    self.logger.info(f"[ASSIGN_AGENT] Agent-assigned event tetikleniyor...")
                    
                    # Agent bilgilerini al - token ile
                    agent_info = None
                    try:
                        if token:
                            agent_info = get_user_by_id(agent_id, token)
                            self.logger.info(f"[ASSIGN_AGENT] Agent bilgileri alındı: {agent_info.get('firstName', 'Unknown')}")
                        else:
                            self.logger.warning(f"[ASSIGN_AGENT] Token yok, agent bilgileri alınamıyor: {agent_id}")
                            agent_info = {"id": agent_id, "firstName": "Agent", "lastName": "", "email": "", "languagePreference": "tr"}
                    except Exception as e:
                        self.logger.warning(f"[ASSIGN_AGENT] Agent bilgileri alınamadı: {agent_id}, hata: {e}")
                        agent_info = {"id": agent_id, "firstName": "Agent", "lastName": "", "email": "", "languagePreference": "tr"}
                    
                    # Customer bilgilerini al - token ile
                    customer_info = None
                    try:
                        if token:
                            customer_info = get_user_by_id(ticket.get('customerId'), token)
                            self.logger.info(f"[ASSIGN_AGENT] Customer bilgileri alındı: {customer_info.get('firstName', 'Unknown')}")
                        else:
                            self.logger.warning(f"[ASSIGN_AGENT] Token yok, customer bilgileri alınamıyor: {ticket.get('customerId')}")
                            customer_info = {"id": ticket.get('customerId'), "firstName": "Customer", "lastName": "", "email": "", "languagePreference": "tr"}
                    except Exception as e:
                        self.logger.warning(f"[ASSIGN_AGENT] Customer bilgileri alınamadı: {ticket.get('customerId')}, hata: {e}")
                        customer_info = {"id": ticket.get('customerId'), "firstName": "Customer", "lastName": "", "email": "", "languagePreference": "tr"}
                    
                    # Dil tercihlerini al
                    user_language = customer_info.get('languagePreference', 'tr')
                    agent_language = agent_info.get('languagePreference', 'tr')
                    
                    # Geçersiz dil tercihleri için varsayılan 'tr' kullan
                    if user_language not in ['tr', 'en']:
                        user_language = 'tr'
                    if agent_language not in ['tr', 'en']:
                        agent_language = 'tr'
                    
                    self.logger.info(f"[ASSIGN_AGENT] Dil tercihleri - User: {user_language}, Agent: {agent_language}")
                    self.logger.info(f"[ASSIGN_AGENT] Agent bilgileri: {agent_info}")
                    self.logger.info(f"[ASSIGN_AGENT] Customer bilgileri: {customer_info}")
                    
                    # Template path'lerini belirle
                    user_template_name = f"agent_assigned_user_{user_language}.html"
                    agent_template_name = f"agent_assigned_agent_{agent_language}.html"
                    
                    self.logger.info(f"[ASSIGN_AGENT] Template isimleri - User: {user_template_name}, Agent: {agent_template_name}")
                    
                    # Daha basit path hesaplama
                    current_dir = os.path.dirname(__file__)
                    templates_dir = os.path.join(current_dir, "..", "..", "..", "templates")
                    user_template_path = os.path.join(templates_dir, user_template_name)
                    agent_template_path = os.path.join(templates_dir, agent_template_name)
                    
                    self.logger.info(f"[ASSIGN_AGENT] Templates dir: {templates_dir}")
                    self.logger.info(f"[ASSIGN_AGENT] Template path'leri - User: {user_template_path}, Agent: {agent_template_path}")
                    self.logger.info(f"[ASSIGN_AGENT] Template dosyaları mevcut mu - User: {os.path.exists(user_template_path)}, Agent: {os.path.exists(agent_template_path)}")
                    
                    # Template dosyalarının varlığını kontrol et, yoksa varsayılan kullan
                    if not os.path.exists(user_template_path):
                        self.logger.warning(f"[ASSIGN_AGENT] User template not found: {user_template_name}, using Turkish template")
                        user_template_path = os.path.join(templates_dir, "agent_assigned_user_tr.html")
                    
                    if not os.path.exists(agent_template_path):
                        self.logger.warning(f"[ASSIGN_AGENT] Agent template not found: {agent_template_name}, using Turkish template")
                        agent_template_path = os.path.join(templates_dir, "agent_assigned_agent_tr.html")
                    
                    self.logger.info(f"[ASSIGN_AGENT] Final template path'leri - User: {user_template_path}, Agent: {agent_template_path}")
                    self.logger.info(f"[ASSIGN_AGENT] Final template dosyaları mevcut mu - User: {os.path.exists(user_template_path)}, Agent: {os.path.exists(agent_template_path)}")
                    
                    # Template içeriklerini oku
                    user_template_content = ""
                    agent_template_content = ""
                    
                    try:
                        with open(user_template_path, 'r', encoding='utf-8') as f:
                            user_template_content = f.read()
                        self.logger.info(f"[ASSIGN_AGENT] User template okundu: {user_template_name}, content length: {len(user_template_content)}")
                    except Exception as e:
                        self.logger.error(f"[ASSIGN_AGENT] User template okunamadı: {e}")
                        user_template_content = "<p>Destek talebinize müşteri temsilcisi atanmıştır.</p>"
                    
                    try:
                        with open(agent_template_path, 'r', encoding='utf-8') as f:
                            agent_template_content = f.read()
                        self.logger.info(f"[ASSIGN_AGENT] Agent template okundu: {agent_template_name}, content length: {len(agent_template_content)}")
                    except Exception as e:
                        self.logger.error(f"[ASSIGN_AGENT] Agent template okunamadı: {e}")
                        agent_template_content = "<p>Yeni bir destek talebi size atandı.</p>"
                    
                    # Event data'sını hazırla
                    event_data = {
                        "user": {
                            "id": customer_info.get('id'),
                            "firstName": customer_info.get('firstName', 'Customer'),
                            "lastName": customer_info.get('lastName', ''),
                            "email": customer_info.get('email', ''),
                            "languagePreference": user_language
                        },
                        "agent": {
                            "id": agent_info.get('id'),
                            "firstName": agent_info.get('firstName', 'Agent'),
                            "lastName": agent_info.get('lastName', ''),
                            "email": agent_info.get('email', ''),
                            "languagePreference": agent_language
                        },
                        "ticket": {
                            "id": ticket_id,
                            "title": ticket.get('title', ''),
                            "description": ticket.get('description', '')
                        },
                        "user_template_content": user_template_content,
                        "agent_template_content": agent_template_content
                    }
                    
                    self.logger.info(f"[ASSIGN_AGENT] Event data hazırlandı: user_language={user_language}, agent_language={agent_language}")
                    
                    # Event'i gönder
                    send_agent_assigned_event(event_data)
                    self.logger.info(f"[ASSIGN_AGENT] Agent-assigned event başarıyla gönderildi")
                    
                except Exception as e:
                    self.logger.error(f"[ASSIGN_AGENT] Agent-assigned event tetiklenirken hata: {e}")
                    # Event hatası agent assignment'ı etkilemesin
                    pass
                
                return {"success": True, "ticketId": ticket_id}
            else:
                self.logger.info(f"[ASSIGN_AGENT] Pending ticket bulunamadı: agentId={agent_id}")
                return {"success": False, "message": "No pending ticket"}
        except Exception as e:
            self.logger.error(f"[ASSIGN_AGENT] Error: {e}", exc_info=True)
            return {"success": False, "message": str(e)} 