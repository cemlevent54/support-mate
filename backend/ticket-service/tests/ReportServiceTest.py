import sys
import os
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime
import base64

# Test dizinini Python path'ine ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.ReportService import ReportService, validate_export_command, VALID_FORMATS, EXPORT_FIELDS

class TestReportService:
    @pytest.fixture
    def mock_handlers(self):
        """CQRS handler'ları mock'la"""
        mock_get_stats = AsyncMock()
        mock_export_stats = AsyncMock()
        
        return {
            "get_stats": mock_get_stats,
            "export_stats": mock_export_stats
        }
    
    @pytest.fixture
    def report_service(self, mock_handlers):
        """ReportService instance'ı oluştur"""
        with patch('services.ReportService.GetDashboardStatisticsQueryHandler') as mock_get_handler, \
             patch('services.ReportService.ExportDashboardStatisticsCommandHandler') as mock_export_handler:
            
            mock_get_handler.return_value = mock_handlers["get_stats"]
            mock_export_handler.return_value = mock_handlers["export_stats"]
            
            service = ReportService(lang='tr')
            return service
    
    @pytest.fixture
    def sample_export_data(self):
        """Örnek export data"""
        return {
            "taskStats": {"total": 10, "completed": 8, "pending": 2},
            "ticketStats": {"total": 25, "open": 15, "closed": 10},
            "userStats": {"total": 50, "active": 45, "inactive": 5},
            "chatStats": {"total": 100, "active": 80, "archived": 20},
            "categoryStats": {"total": 5, "active": 4, "inactive": 1}
        }
    
    @pytest.fixture
    def sample_command(self):
        """Örnek export command"""
        return {
            "format": "json",
            "taskStats": True,
            "ticketStats": True,
            "userStats": False,
            "chatStats": False,
            "categoryStats": False,
            "sendMail": False
        }
    
    @pytest.fixture
    def sample_file_content(self):
        """Örnek base64 encoded file content"""
        sample_data = '{"test": "data"}'
        return base64.b64encode(sample_data.encode()).decode()

    # ========== VALIDATE_EXPORT_COMMAND TESTS ==========
    
    def test_validate_export_command_valid(self, sample_command):
        """Geçerli command validasyonu"""
        # Should not raise any exception
        validate_export_command(sample_command)
    
    def test_validate_export_command_invalid_format(self):
        """Geçersiz format testi"""
        command = {"format": "invalid", "taskStats": True}
        
        with pytest.raises(ValueError, match="invalid"):
            validate_export_command(command)
    
    def test_validate_export_command_no_fields_selected(self):
        """Hiç alan seçilmemiş testi"""
        command = {"format": "json", "sendMail": False}
        
        with pytest.raises(ValueError, match="En az bir alan seçilmelidir"):
            validate_export_command(command)
    
    def test_validate_export_command_invalid_field_value(self):
        """Geçersiz alan değeri testi"""
        command = {"format": "json", "taskStats": "not_bool"}
        
        with pytest.raises(ValueError, match="Geçersiz değer"):
            validate_export_command(command)
    
    def test_validate_export_command_invalid_sendmail_value(self):
        """Geçersiz sendMail değeri testi"""
        command = {"format": "json", "taskStats": True, "sendMail": "not_bool"}
        
        with pytest.raises(ValueError, match="Geçersiz değer"):
            validate_export_command(command)
    
    def test_validate_export_command_all_formats(self):
        """Tüm formatlar için test"""
        for format_type in VALID_FORMATS:
            command = {"format": format_type, "taskStats": True}
            # Should not raise any exception
            validate_export_command(command)
    
    def test_validate_export_command_all_export_fields(self):
        """Tüm export alanları için test"""
        for field in EXPORT_FIELDS:
            command = {"format": "json", field: True}
            # Should not raise any exception
            validate_export_command(command)

    # ========== GET_DASHBOARD_STATISTICS TESTS ==========
    
    @pytest.mark.asyncio
    async def test_get_dashboard_statistics_success(self, report_service, mock_handlers, sample_export_data):
        """Dashboard istatistikleri başarılı testi"""
        mock_handlers["get_stats"].execute.return_value = sample_export_data
        
        result = await report_service.get_dashboard_statistics()
        
        assert result == sample_export_data
        mock_handlers["get_stats"].execute.assert_called_once_with({})
    
    @pytest.mark.asyncio
    async def test_get_dashboard_statistics_failure(self, report_service, mock_handlers):
        """Dashboard istatistikleri hata testi"""
        mock_handlers["get_stats"].execute.side_effect = Exception("Database error")
        
        with pytest.raises(Exception, match="Database error"):
            await report_service.get_dashboard_statistics()
    
    @pytest.mark.asyncio
    async def test_get_dashboard_statistics_empty_result(self, report_service, mock_handlers):
        """Boş sonuç testi"""
        mock_handlers["get_stats"].execute.return_value = {}
        
        result = await report_service.get_dashboard_statistics()
        
        assert result == {}

    # ========== EXPORT_DASHBOARD_STATISTICS TESTS ==========
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_download_success(self, report_service, mock_handlers, sample_command, sample_export_data, sample_file_content):
        """Download export başarılı testi"""
        mock_handlers["export_stats"].execute.return_value = sample_export_data
        
        with patch('services.ReportService.create_file_content') as mock_create_file:
            mock_create_file.return_value = sample_file_content
            
            result = await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com",
                token="test_token"
            )
        
        assert result["type"] == "download"
        assert "file_buffer" in result
        assert "file_name" in result
        assert result["mime_type"] == "application/json"
        assert result["data"] == sample_export_data
        assert "dashboard_export.json" in result["file_name"]
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_mail_success(self, report_service, mock_handlers, sample_command, sample_export_data):
        """Mail export başarılı testi"""
        sample_command["sendMail"] = True
        mock_handlers["export_stats"].execute.return_value = sample_export_data
        
        with patch('services.ReportService.send_dashboard_statistics_event') as mock_send_mail:
            result = await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com",
                token="test_token"
            )
        
        assert result["type"] == "mail"
        assert result["message"] == "Mail sent successfully"
        assert result["data"] == sample_export_data
        mock_send_mail.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_no_user_email(self, report_service, sample_command):
        """Kullanıcı email'i yok testi"""
        with pytest.raises(ValueError, match="Kullanıcı e-postası gereklidir"):
            await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email=None
            )
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_no_data_to_export_mail(self, report_service, mock_handlers, sample_command):
        """Export edilecek veri yok - mail testi"""
        sample_command["sendMail"] = True
        mock_handlers["export_stats"].execute.return_value = {}
        
        with pytest.raises(ValueError, match="Dışa aktarılacak veri bulunamadı"):
            await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com"
            )
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_no_data_to_export_download(self, report_service, mock_handlers, sample_command):
        """Export edilecek veri yok - download testi"""
        mock_handlers["export_stats"].execute.return_value = {}
        
        with pytest.raises(ValueError, match="Dışa aktarılacak veri bulunamadı"):
            await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com"
            )
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_empty_file_content(self, report_service, mock_handlers, sample_command, sample_export_data):
        """Boş dosya içeriği testi"""
        mock_handlers["export_stats"].execute.return_value = sample_export_data
        
        with patch('services.ReportService.create_file_content') as mock_create_file:
            mock_create_file.return_value = None
            
            with pytest.raises(ValueError, match="Dosya içeriği oluşturulamadı"):
                await report_service.export_dashboard_statistics(
                    command=sample_command,
                    user_email="test@example.com"
                )
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_different_formats(self, report_service, mock_handlers, sample_export_data, sample_file_content):
        """Farklı formatlar için test"""
        formats_and_mimes = [
            ("json", "application/json"),
            ("csv", "text/csv"),
            ("pdf", "application/pdf"),
            ("excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        ]
        
        for format_type, expected_mime in formats_and_mimes:
            command = {
                "format": format_type,
                "taskStats": True,
                "sendMail": False
            }
            mock_handlers["export_stats"].execute.return_value = sample_export_data
            
            with patch('services.ReportService.create_file_content') as mock_create_file:
                mock_create_file.return_value = sample_file_content
                
                result = await report_service.export_dashboard_statistics(
                    command=command,
                    user_email="test@example.com"
                )
            
            assert result["mime_type"] == expected_mime
            if format_type == "excel":
                assert "dashboard_export.xlsx" in result["file_name"]
            else:
                assert f"dashboard_export.{format_type}" in result["file_name"]
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_handler_error(self, report_service, mock_handlers, sample_command):
        """Handler hatası testi"""
        mock_handlers["export_stats"].execute.side_effect = Exception("Handler error")
        
        with pytest.raises(Exception, match="Handler error"):
            await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com"
            )
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_token_in_command(self, report_service, mock_handlers, sample_command, sample_export_data, sample_file_content):
        """Token'ın command'e eklenmesi testi"""
        mock_handlers["export_stats"].execute.return_value = sample_export_data
        
        with patch('services.ReportService.create_file_content') as mock_create_file:
            mock_create_file.return_value = sample_file_content
            
            await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com",
                token="test_token"
            )
        
        # Command'e token eklendiğini kontrol et
        expected_command = sample_command.copy()
        expected_command["token"] = "test_token"
        mock_handlers["export_stats"].execute.assert_called_once_with(expected_command)
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_empty_dict_data(self, report_service, mock_handlers, sample_command):
        """Boş dict data testi"""
        mock_handlers["export_stats"].execute.return_value = {}
        
        with pytest.raises(ValueError, match="Dışa aktarılacak veri bulunamadı"):
            await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com"
            )
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_none_data(self, report_service, mock_handlers, sample_command):
        """None data testi"""
        mock_handlers["export_stats"].execute.return_value = None
        
        with pytest.raises(ValueError, match="Dışa aktarılacak veri bulunamadı"):
            await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com"
            )
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_different_language(self):
        """Farklı dil ayarı testi"""
        with patch('services.ReportService.GetDashboardStatisticsQueryHandler') as mock_get_handler, \
             patch('services.ReportService.ExportDashboardStatisticsCommandHandler') as mock_export_handler:
            
            mock_get_handler.return_value = AsyncMock()
            mock_export_handler.return_value = AsyncMock()
            
            service = ReportService(lang='en')
            assert service.lang == 'en'
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_mail_with_language(self, report_service, mock_handlers, sample_command, sample_export_data):
        """Mail gönderimi dil ayarı testi"""
        sample_command["sendMail"] = True
        mock_handlers["export_stats"].execute.return_value = sample_export_data
        
        with patch('services.ReportService.send_dashboard_statistics_event') as mock_send_mail:
            await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com"
            )
        
        # send_dashboard_statistics_event'in language parametresi ile çağrıldığını kontrol et
        call_args = mock_send_mail.call_args
        assert call_args[1]["language"] == "tr"
    
    @pytest.mark.asyncio
    async def test_export_dashboard_statistics_file_content_with_language(self, report_service, mock_handlers, sample_command, sample_export_data, sample_file_content):
        """Dosya oluşturma dil ayarı testi"""
        mock_handlers["export_stats"].execute.return_value = sample_export_data
        
        with patch('services.ReportService.create_file_content') as mock_create_file:
            mock_create_file.return_value = sample_file_content
            
            await report_service.export_dashboard_statistics(
                command=sample_command,
                user_email="test@example.com"
            )
        
        # create_file_content'in language parametresi ile çağrıldığını kontrol et
        call_args = mock_create_file.call_args
        assert call_args[0][1] == "json"  # file_type
        assert call_args[0][2] == "tr"    # language 