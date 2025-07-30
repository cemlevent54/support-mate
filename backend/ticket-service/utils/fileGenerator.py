import json
import base64
import csv
import logging
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)

def create_csv_content(export_data):
    """CSV içeriğini oluştur"""
    try:
        output = BytesIO()
        writer = csv.writer(output)
        
        # Başlık satırı
        writer.writerow(['Data Type', 'Content'])
        
        # Tasks
        if export_data.get('tasks'):
            writer.writerow(['Tasks', ''])
            for task in export_data['tasks']:
                writer.writerow(['', str(task)])
            writer.writerow([])
        
        # Tickets
        if export_data.get('tickets'):
            writer.writerow(['Tickets', ''])
            for ticket in export_data['tickets']:
                writer.writerow(['', str(ticket)])
            writer.writerow([])
        
        # Users
        if export_data.get('users'):
            writer.writerow(['Users', ''])
            for user in export_data['users']:
                writer.writerow(['', str(user)])
            writer.writerow([])
        
        output.seek(0)
        csv_content = output.getvalue().decode('utf-8')
        output.close()
        return csv_content
    except Exception as e:
        logger.error(f"CSV content oluşturulamadı: {e}")
        return "Data Type,Content\nError,CSV generation failed"

def create_pdf_content(export_data, language='tr'):
    """PDF içeriğini oluştur"""
    try:
        if language == 'tr':
            pdf_content = """
Panel İstatistikleri Özeti

• Kullanıcılar: Toplam, doğrulanmış, engellenmiş, roller
• Aktif Temsilciler: Son 24 saat
• Ticketler: Toplam, açık, atanmamış, durumlar, kapanma süreleri
• Tasklar: Toplam, durumlar, öncelik, lider/çalışan dağılımı
• Ürünler: Toplam ürün
• Kategoriler: Kategori bazlı dağılım
• Chat/Mesaj: Toplam chat, mesaj, trendler
• Kullanıcı Kayıt Trendi

Detaylı veriler için lütfen PDF içeriğine bakınız.
            """
        else:
            pdf_content = """
Dashboard Statistics Summary

• Users: Total, verified, blocked, roles
• Active Representatives: Last 24 hours
• Tickets: Total, open, unassigned, statuses, resolution times
• Tasks: Total, statuses, priority, leader/employee distribution
• Products: Total products
• Categories: Category-based distribution
• Chat/Messages: Total chat, messages, trends
• User Registration Trend

Please check the PDF content for detailed data.
            """
        
        return pdf_content.strip()
    except Exception as e:
        logger.error(f"PDF content oluşturulamadı: {e}")
        return "Dashboard Statistics Summary"

def create_pdf_file(export_data, language='tr'):
    """PDF dosyasını oluştur ve base64'e çevir - xhtml2pdf ile"""
    try:
        logger.info(f"PDF oluşturma başlatılıyor... Language: {language}")
        
        # Template dizinini ayarla
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        logger.info(f"Template dizini: {template_dir}")
        
        if not os.path.exists(template_dir):
            logger.error(f"Template dizini bulunamadı: {template_dir}")
            return None
            
        env = Environment(loader=FileSystemLoader(template_dir))
        
        # Template dosya adını belirle
        template_name = f"dashboard_statistics_pdf_template_{language}.html"
        logger.info(f"Template dosya adı: {template_name}")
        
        # Template dosyasının varlığını kontrol et
        template_path = os.path.join(template_dir, template_name)
        if not os.path.exists(template_path):
            logger.error(f"Template dosyası bulunamadı: {template_path}")
            return None
        
        # Template'i render et
        template = env.get_template(template_name)
        logger.info("Template başarıyla yüklendi")
        
        # Context hazırla
        generation_date = datetime.now().strftime("%d.%m.%Y %H:%M") if language == 'tr' else datetime.now().strftime("%m/%d/%Y %H:%M")
        
        context = {
            'generation_date': generation_date,
            'tasks': export_data.get('tasks'),
            'tickets': export_data.get('tickets'),
            'users': export_data.get('users'),
            'chats': export_data.get('chats'),
            'categories': export_data.get('categories'),
            'products': export_data.get('products'),
            'detailed_data': export_data
        }
        
        logger.info(f"Context hazırlandı. Export data keys: {list(export_data.keys()) if export_data else 'None'}")
        
        # HTML'i render et
        html_content = template.render(context)
        logger.info(f"HTML render edildi. Length: {len(html_content)}")
        
        # PDF'e dönüştür
        buffer = BytesIO()
        logger.info("PDF dönüştürme başlatılıyor...")
        pdf_status = pisa.CreatePDF(html_content, dest=buffer)
        
        if pdf_status.err:
            logger.error(f"PDF oluşturma hatası: {pdf_status.err}")
            return None
        
        buffer.seek(0)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        logger.info(f"PDF başarıyla oluşturuldu. Size: {len(pdf_bytes)} bytes")
        
        return base64.b64encode(pdf_bytes).decode('utf-8')
    except Exception as e:
        logger.error(f"PDF dosyası oluşturulamadı: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None

def create_section_title(title):
    """Bölüm başlığı oluştur"""
    style = ParagraphStyle(
        'SectionTitle',
        parent=getSampleStyleSheet()['Heading2'],
        fontSize=16,
        spaceAfter=15,
        textColor=colors.HexColor('#1976d2'),
        fontName='Helvetica-Bold',
        leftIndent=0,
        backColor=colors.HexColor('#f5f5f5'),
        keepWithNext=1  # Sonraki içerikle birlikte tut
    )
    return Paragraph(title, style)

def create_subsection_title(title):
    """Alt bölüm başlığı oluştur"""
    style = ParagraphStyle(
        'SubsectionTitle',
        parent=getSampleStyleSheet()['Normal'],
        fontSize=12,
        spaceAfter=8,
        textColor=colors.HexColor('#424242'),
        fontName='Helvetica-Bold',
        keepWithNext=1  # Sonraki içerikle birlikte tut
    )
    return Paragraph(title, style)

def create_data_table(data_dict):
    """Veri tablosu oluştur"""
    if not data_dict:
        return Spacer(1, 10)

    # Tablo verilerini hazırla
    table_data = [['Label', 'Value']]
    for key, value in data_dict.items():
        table_data.append([str(key), str(value)])

    # Tablo oluştur
    table = Table(table_data, colWidths=[200, 100])

    # Tablo stilini ayarla
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#424242')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e9ecef')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#666666')),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('TEXTCOLOR', (1, 1), (1, -1), colors.HexColor('#1976d2')),
        ('FONTNAME', (1, 1), (1, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('KEEPWITHNEXT', (0, 0), (-1, -1), 1),  # Tablo satırlarını birlikte tut
    ])

    table.setStyle(style)
    
    # Tablo için özel stil oluştur - sayfa sonunda kesilmesini önle
    table_style = ParagraphStyle(
        'TableStyle',
        parent=getSampleStyleSheet()['Normal'],
        pageBreakBefore=0,  # Sayfa sonunda kesilmesini önle
        keepWithNext=1,     # Sonraki içerikle birlikte tut
        spaceAfter=10
    )
    
    # Tabloyu bir container içine al
    from reportlab.platypus import KeepTogether
    return KeepTogether([table])



def create_file_content(export_data, file_type, language='tr'):
    """Dosya türüne göre içerik oluştur"""
    if file_type == 'json':
        return base64.b64encode(json.dumps(export_data, indent=2, ensure_ascii=False).encode('utf-8')).decode('utf-8')
    elif file_type == 'csv':
        csv_content = create_csv_content(export_data)
        return base64.b64encode(csv_content.encode('utf-8')).decode('utf-8')
    elif file_type == 'pdf':
        return create_pdf_file(export_data, language)
    else:
        # Default JSON
        return base64.b64encode(json.dumps(export_data, indent=2, ensure_ascii=False).encode('utf-8')).decode('utf-8')

def read_mail_template(language='tr'):
    """Mail template'ini oku"""
    try:
        template_name = 'dashboard_statictics_mail_content_tr.html' if language == 'tr' else 'dashboard_statictics_mail_content_en.html'
        template_path = f"templates/{template_name}"
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.error(f"Mail template okunamadı: {e}")
        return "Dashboard export dosyanız ektedir." if language == 'tr' else "Your dashboard export is attached." 