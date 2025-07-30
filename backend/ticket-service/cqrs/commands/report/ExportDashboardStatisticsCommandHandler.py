from cqrs.queries.report.GetDashboardStatisticsQueryHandler import GetDashboardStatisticsQueryHandler
from middlewares.auth import get_user_by_id
from grpc_client.grpc_client import auth_grpc_client

class ExportDashboardStatisticsCommandHandler:
    def __init__(self):
        self.get_dashboard_statistics_handler = GetDashboardStatisticsQueryHandler()

    async def execute(self, command):
        # command: dict, ör: {format, taskStats, ticketStats, userStats, chatStats, categoryStats}
        dashboard_data = await self.get_dashboard_statistics_handler.execute({})
        export_data = {}
        
        if command.get("taskStats", True):
            tasks_data = dashboard_data.get("tasks", {})
            
            # Leader bilgilerini güncelle
            if "leader" in tasks_data and tasks_data["leader"]:
                for leader in tasks_data["leader"]:
                    try:
                        # Leader ID'si ile kullanıcı bilgilerini getir
                        user_info = get_user_by_id(leader["id"], command.get("token", ""))
                        if user_info:
                            leader["name"] = f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip()
                            leader["email"] = user_info.get("email", "")
                        else:
                            leader["name"] = "Unknown User"
                            leader["email"] = ""
                    except Exception as e:
                        leader["name"] = "Unknown User"
                        leader["email"] = ""
                        print(f"Error getting leader info for ID {leader['id']}: {e}")
            
            # Employee bilgilerini güncelle
            if "employee" in tasks_data and tasks_data["employee"]:
                for employee in tasks_data["employee"]:
                    try:
                        # Employee ID'si ile kullanıcı bilgilerini getir
                        user_info = get_user_by_id(employee["id"], command.get("token", ""))
                        if user_info:
                            employee["name"] = f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip()
                            employee["email"] = user_info.get("email", "")
                        else:
                            employee["name"] = "Unknown User"
                            employee["email"] = ""
                    except Exception as e:
                        employee["name"] = "Unknown User"
                        employee["email"] = ""
                        print(f"Error getting employee info for ID {employee['id']}: {e}")
            
            export_data["tasks"] = tasks_data
        
        if command.get("ticketStats", True):
            export_data["tickets"] = dashboard_data.get("tickets")
        
        if command.get("userStats", True):
            # Auth service'den kullanıcı verilerini al
            try:
                auth_stats = auth_grpc_client.get_dashboard_statistics()
                if auth_stats:
                    export_data["users"] = auth_stats.get("users")
                    print(f"User statistics added from auth service: {auth_stats}")
                else:
                    print("Failed to get user statistics from auth service")
                    export_data["users"] = None
            except Exception as e:
                print(f"Error getting user statistics from auth service: {e}")
                export_data["users"] = None
        
        if command.get("chatStats", True):
            chats_data = dashboard_data.get("chats", {})
            
            # Debug için chat verilerini yazdır
            print(f"Chat data from dashboard: {chats_data}")
            
            # Günlük mesaj dağılımını senderRole'e göre ayır
            if "dates" in chats_data and chats_data["dates"]:
                for date_info in chats_data["dates"]:
                    # Mevcut verileri kullan
                    customer_supporter_messages = date_info.get("customerSupporterMessages", 0)
                    user_messages = date_info.get("userMessages", 0)
                    
                    # Eğer bu değerler yoksa, agentMessages ve customerMessages'ı kullan
                    if customer_supporter_messages == 0 and user_messages == 0:
                        agent_messages = date_info.get("agentMessages", 0)
                        customer_messages = date_info.get("customerMessages", 0)
                        
                        # Agent mesajları Customer Supporter olarak say
                        customer_supporter_messages = agent_messages
                        # Customer mesajları User olarak say
                        user_messages = customer_messages
                    
                    # Günlük mesaj dağılımını güncelle
                    date_info["customerSupporterMessages"] = customer_supporter_messages
                    date_info["userMessages"] = user_messages
            
            export_data["chats"] = chats_data
        
        if command.get("categoryStats", True):
            categories_data = dashboard_data.get("categories", [])
            products_data = dashboard_data.get("products", [])
            
            # Debug için kategori ve ürün verilerini yazdır
            print(f"Categories data from dashboard: {categories_data}")
            print(f"Products data from dashboard: {products_data}")
            
            # Ürünlere kategori isimlerini ekle
            if products_data:
                # Kategori ID'lerini kategori isimleriyle eşleştir
                category_map = {}
                for category in categories_data:
                    category_id = category.get("id", "")
                    category_map[category_id] = {
                        "nameTr": category.get("categoryNameTr", ""),
                        "nameEn": category.get("categoryNameEn", "")
                    }
                
                # Her ürüne kategori ismini ekle
                for product in products_data:
                    category_id = product.get("productCategoryId", "")
                    category_info = category_map.get(category_id, {})
                    product["categoryNameTr"] = category_info.get("nameTr", "N/A")
                    product["categoryNameEn"] = category_info.get("nameEn", "N/A")
            
            export_data["categories"] = categories_data
            export_data["products"] = products_data
        
        export_data["format"] = command.get("format")
        return export_data