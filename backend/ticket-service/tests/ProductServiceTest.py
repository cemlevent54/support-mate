import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, UTC
from services.ProductService import ProductService
from models.product import Product

@pytest.fixture
def mock_handlers(mocker):
    # Command & Query handler'ları mockla
    mock_create_handler = mocker.MagicMock()
    mock_update_handler = mocker.MagicMock()
    mock_delete_handler = mocker.MagicMock()
    mock_list_handler = mocker.MagicMock()
    mock_get_category_handler = mocker.MagicMock()

    return {
        "create": mock_create_handler,
        "update": mock_update_handler,
        "delete": mock_delete_handler,
        "list": mock_list_handler,
        "get_category": mock_get_category_handler,
    }

@pytest.fixture
def product_service(mock_handlers):
    service = ProductService()
    service.create_handler = mock_handlers["create"]
    service.update_handler = mock_handlers["update"]
    service.delete_handler = mock_handlers["delete"]
    service.list_handler = mock_handlers["list"]
    service.get_category_handler = mock_handlers["get_category"]
    return service

@pytest.fixture
def sample_product():
    return Product(
        product_name_tr="Test Ürün",
        product_name_en="Test Product",
        product_category_id="category123"
    )

@pytest.fixture
def sample_category():
    category = MagicMock()
    category.id = "category123"
    category.category_name_tr = "Test Kategori"
    category.category_name_en = "Test Category"
    return category

@pytest.fixture
def sample_product_model():
    product = MagicMock()
    product.id = "product123"
    product.product_name_tr = "Test Ürün"
    product.product_name_en = "Test Product"
    product.product_category_id = "category123"
    product.createdAt = datetime.now(UTC)
    product.isDeleted = False
    product.deletedAt = None
    return product

def test_create_product_success(product_service, mock_handlers, sample_product, sample_product_model, sample_category):
    # Mock create handler response
    mock_handlers["create"].handle.return_value = "product123"
    
    # Mock list handler find_by_id
    mock_handlers["list"].find_by_id.return_value = sample_product_model
    
    # Mock get category handler
    mock_handlers["get_category"].handle.return_value = sample_category

    result = product_service.create_product(sample_product)

    assert result is not None
    assert result["id"] == "product123"
    assert result["product_name_tr"] == "Test Ürün"
    assert result["product_name_en"] == "Test Product"
    assert "product_category" in result
    assert result["product_category"]["product_category_id"] == "category123"

def test_create_product_no_category_id(product_service, sample_product):
    # Category ID olmadan ürün oluşturma
    sample_product.product_category_id = None
    
    result = product_service.create_product(sample_product)
    
    assert result is None

def test_create_product_handler_failure(product_service, mock_handlers, sample_product):
    # Mock create handler failure
    mock_handlers["create"].handle.return_value = None
    
    result = product_service.create_product(sample_product)
    
    assert result is None

def test_create_product_find_by_id_failure(product_service, mock_handlers, sample_product):
    # Mock create handler success
    mock_handlers["create"].handle.return_value = "product123"
    
    # Mock list handler find_by_id failure
    mock_handlers["list"].find_by_id.return_value = None
    
    result = product_service.create_product(sample_product)
    
    assert result is None

def test_update_product_success(product_service, mock_handlers, sample_product, sample_product_model, sample_category):
    product_id = "product123"
    
    # Mock update handler response
    mock_handlers["update"].handle.return_value = True
    
    # Mock list handler find_by_id
    mock_handlers["list"].find_by_id.return_value = sample_product_model
    
    # Mock get category handler
    mock_handlers["get_category"].handle.return_value = sample_category

    result = product_service.update_product(product_id, sample_product)

    assert result is not None
    assert result["id"] == "product123"
    assert result["product_name_tr"] == "Test Ürün"
    assert result["product_name_en"] == "Test Product"
    assert "product_category" in result

def test_update_product_missing_names(product_service, sample_product):
    product_id = "product123"
    
    # İsimler olmadan güncelleme
    sample_product.product_name_tr = ""
    sample_product.product_name_en = ""
    
    result = product_service.update_product(product_id, sample_product)
    
    assert result is None

def test_update_product_handler_failure(product_service, mock_handlers, sample_product):
    product_id = "product123"
    
    # Mock update handler failure
    mock_handlers["update"].handle.return_value = False
    
    result = product_service.update_product(product_id, sample_product)
    
    assert result is None

def test_update_product_find_by_id_failure(product_service, mock_handlers, sample_product):
    product_id = "product123"
    
    # Mock update handler success
    mock_handlers["update"].handle.return_value = True
    
    # Mock list handler find_by_id failure
    mock_handlers["list"].find_by_id.return_value = None
    
    result = product_service.update_product(product_id, sample_product)
    
    assert result is None

def test_soft_delete_product_success(product_service, mock_handlers):
    product_id = "product123"
    
    # Mock delete handler success
    mock_handlers["delete"].handle.return_value = True
    
    result = product_service.soft_delete_product(product_id)
    
    assert result is True

def test_soft_delete_product_failure(product_service, mock_handlers):
    product_id = "product123"
    
    # Mock delete handler failure
    mock_handlers["delete"].handle.return_value = False
    
    result = product_service.soft_delete_product(product_id)
    
    assert result is False

def test_list_products_success(product_service, mock_handlers, sample_product_model, sample_category):
    # Mock list handler response
    mock_handlers["list"].handle.return_value = [sample_product_model]
    
    # Mock get category handler
    mock_handlers["get_category"].handle.return_value = sample_category

    result = product_service.list_products()

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0]["id"] == "product123"
    assert result[0]["product_name_tr"] == "Test Ürün"
    assert "product_category" in result[0]

def test_list_products_empty(product_service, mock_handlers):
    # Mock list handler empty response
    mock_handlers["list"].handle.return_value = []

    result = product_service.list_products()

    assert isinstance(result, list)
    assert len(result) == 0

def test_list_products_without_category(product_service, mock_handlers, sample_product_model):
    # Mock list handler response
    mock_handlers["list"].handle.return_value = [sample_product_model]
    
    # Mock get category handler - category bulunamadı
    mock_handlers["get_category"].handle.return_value = None

    result = product_service.list_products()

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0]["id"] == "product123"
    assert result[0]["product_category"] is None

def test_get_product_by_id_success(product_service, mock_handlers, sample_product_model, sample_category):
    product_id = "product123"
    
    # Mock list handler find_by_id
    mock_handlers["list"].find_by_id.return_value = sample_product_model
    
    # Mock get category handler
    mock_handlers["get_category"].handle.return_value = sample_category

    result = product_service.get_product_by_id(product_id)

    assert result is not None
    assert result["id"] == "product123"
    assert result["product_name_tr"] == "Test Ürün"
    assert result["product_name_en"] == "Test Product"
    assert "product_category" in result

def test_get_product_by_id_not_found(product_service, mock_handlers):
    product_id = "nonexistent"
    
    # Mock list handler find_by_id - ürün bulunamadı
    mock_handlers["list"].find_by_id.return_value = None

    result = product_service.get_product_by_id(product_id)

    assert result is None

def test_get_product_by_id_without_category(product_service, mock_handlers, sample_product_model):
    product_id = "product123"
    
    # Mock list handler find_by_id
    mock_handlers["list"].find_by_id.return_value = sample_product_model
    
    # Mock get category handler - category bulunamadı
    mock_handlers["get_category"].handle.return_value = None

    result = product_service.get_product_by_id(product_id)

    assert result is not None
    assert result["id"] == "product123"
    assert result["product_category"] is None

def test_get_product_by_id_exception(product_service, mock_handlers):
    product_id = "product123"
    
    # Mock list handler find_by_id exception
    mock_handlers["list"].find_by_id.side_effect = Exception("Database error")

    result = product_service.get_product_by_id(product_id)

    assert result is None

def test_dto_to_serializable_with_datetime(product_service):
    # datetime içeren dto test et
    dto = {
        "id": "product123",
        "createdAt": datetime.now(UTC),
        "updatedAt": datetime.now(UTC),
        "name": "Test Product"
    }
    
    result = product_service.dto_to_serializable(dto)
    
    assert isinstance(result["createdAt"], str)
    assert isinstance(result["updatedAt"], str)
    assert result["name"] == "Test Product"

def test_dto_to_serializable_without_datetime(product_service):
    # datetime içermeyen dto test et
    dto = {
        "id": "product123",
        "name": "Test Product",
        "category": "Test Category"
    }
    
    result = product_service.dto_to_serializable(dto)
    
    assert result["id"] == "product123"
    assert result["name"] == "Test Product"
    assert result["category"] == "Test Category"

def test_create_product_with_category_none(product_service, mock_handlers, sample_product, sample_product_model):
    # Mock create handler response
    mock_handlers["create"].handle.return_value = "product123"
    
    # Mock list handler find_by_id
    mock_handlers["list"].find_by_id.return_value = sample_product_model
    
    # Mock get category handler - category bulunamadı
    mock_handlers["get_category"].handle.return_value = None

    result = product_service.create_product(sample_product)

    assert result is not None
    assert result["id"] == "product123"
    assert result["product_category"] is None

def test_update_product_with_category_none(product_service, mock_handlers, sample_product, sample_product_model):
    product_id = "product123"
    
    # Mock update handler response
    mock_handlers["update"].handle.return_value = True
    
    # Mock list handler find_by_id
    mock_handlers["list"].find_by_id.return_value = sample_product_model
    
    # Mock get category handler - category bulunamadı
    mock_handlers["get_category"].handle.return_value = None

    result = product_service.update_product(product_id, sample_product)

    assert result is not None
    assert result["id"] == "product123"
    assert result["product_category"] is None

def test_list_products_multiple_items(product_service, mock_handlers, sample_category):
    # Birden fazla ürün için test
    product1 = MagicMock()
    product1.id = "product1"
    product1.product_name_tr = "Ürün 1"
    product1.product_name_en = "Product 1"
    product1.product_category_id = "category123"
    product1.createdAt = datetime.now(UTC)
    product1.isDeleted = False
    product1.deletedAt = None
    
    product2 = MagicMock()
    product2.id = "product2"
    product2.product_name_tr = "Ürün 2"
    product2.product_name_en = "Product 2"
    product2.product_category_id = "category123"
    product2.createdAt = datetime.now(UTC)
    product2.isDeleted = False
    product2.deletedAt = None
    
    # Mock list handler response
    mock_handlers["list"].handle.return_value = [product1, product2]
    
    # Mock get category handler
    mock_handlers["get_category"].handle.return_value = sample_category

    result = product_service.list_products()

    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["id"] == "product1"
    assert result[1]["id"] == "product2"
    assert result[0]["product_name_tr"] == "Ürün 1"
    assert result[1]["product_name_tr"] == "Ürün 2" 