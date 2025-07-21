from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from utils.date_utils import convert_dict_timestamps_to_tr

class TicketDTO(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    customerId: str
    assignedAgentId: Optional[str] = None
    attachments: List[dict] = []
    categoryId: str
    status: str
    createdAt: Optional[str] = None
    closedAt: Optional[str] = None
    isDeleted: bool = False
    deletedAt: Optional[str] = None

    @classmethod
    def from_model(cls, ticket_model: Any) -> 'TicketDTO':
        """Model'den DTO oluşturur ve timestamp'leri TR saatine çevirir"""
        ticket_dict = ticket_model.model_dump() if hasattr(ticket_model, 'model_dump') else dict(ticket_model)
        # Timestamp'leri TR saatine çevir
        ticket_dict = convert_dict_timestamps_to_tr(ticket_dict)
        return cls(**ticket_dict)

class TicketListDTO(BaseModel):
    tickets: List[TicketDTO]
    total: int = 0

    @classmethod
    def from_models(cls, ticket_models: List[Any], total: int = 0) -> 'TicketListDTO':
        """Model listesinden DTO listesi oluşturur"""
        tickets = [TicketDTO.from_model(ticket) for ticket in ticket_models]
        return cls(tickets=tickets, total=total) 