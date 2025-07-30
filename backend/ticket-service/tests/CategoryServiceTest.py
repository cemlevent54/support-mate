import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from services.CategoryService import CategoryService
from models.category import Category
from datetime import datetime, UTC
from unittest.mock import MagicMock
from dto.category_dto import CategoryResponseDTO

@pytest.fixture
def mock_handlers(mocker):
    # Command & Query handler'ları mockla
    mock_create_handler = mocker.MagicMock()
    mock_update_handler = mocker.MagicMock()
    mock_delete_handler = mocker.MagicMock()
    mock_list_handler = mocker.MagicMock()
    mock_list_handler.repository = mocker.MagicMock()

    return {
        "create": mock_create_handler,
        "update": mock_update_handler,
        "delete": mock_delete_handler,
        "list": mock_list_handler,
    }

@pytest.fixture
def category_service(mock_handlers):
    service = CategoryService()
    service.create_handler = mock_handlers["create"]
    service.update_handler = mock_handlers["update"]
    service.delete_handler = mock_handlers["delete"]
    service.list_handler = mock_handlers["list"]
    return service

def test_create_category_success(category_service, mock_handlers):
    dummy_category = Category(category_name_tr="Kategori", category_name_en="Category", leaderIds=["1", "2"])
    dummy_category._id = "abc123"
    dummy_category.createdAt = datetime.now(UTC)
    dummy_category.isDeleted = False
    dummy_category.deletedAt = None

    mock_handlers["create"].handle.return_value = "abc123"
    mock_handlers["list"].repository.find_by_id.return_value = dummy_category

    result = category_service.create_category(dummy_category)

    assert result["id"] == "abc123"
    assert result["category_name_tr"] == "Kategori"
    assert result["category_name_en"] == "Category"

def test_update_category_success(category_service, mock_handlers):
    category_id = "abc123"
    dummy_category = Category(category_name_tr="Yeni", category_name_en="New", leaderIds=["1"])
    dummy_category._id = category_id
    dummy_category.createdAt = datetime.now(UTC)
    dummy_category.isDeleted = False
    dummy_category.deletedAt = None

    mock_handlers["update"].handle.return_value = True
    mock_handlers["list"].repository.find_by_id.return_value = dummy_category

    result = category_service.update_category(category_id, dummy_category)

    assert result["id"] == "abc123"
    assert result["category_name_tr"] == "Yeni"

def test_update_category_missing_names(category_service):
    category = Category(category_name_tr="", category_name_en="", leaderIds=[])
    result = category_service.update_category("abc123", category)
    assert result is None

def test_delete_category_success(category_service, mock_handlers):
    mock_handlers["delete"].handle.return_value = True
    result = category_service.delete_category("abc123")
    assert result is True

def test_delete_category_fail(category_service, mock_handlers):
    mock_handlers["delete"].handle.return_value = False
    result = category_service.delete_category("abc123")
    assert result is False

def test_list_categories(category_service, mock_handlers):
    dummy_category = Category(
        _id="abc123",
        category_name_tr="Kategori",
        category_name_en="Category",
        leaderIds=["1", "2"],
        createdAt=datetime.now(UTC),
        isDeleted=False,
        deletedAt=None
    )
    mock_handlers["list"].handle.return_value = [dummy_category]

    result = category_service.list_categories()
    assert isinstance(result, list)
    assert len(result) > 0
    assert result[0]["id"] == "abc123"

def test_get_category_by_id_found(category_service, mock_handlers):
    dummy_category = Category(
        _id="abc123",
        category_name_tr="Kategori",
        category_name_en="Category",
        leaderIds=["1", "2"],
        createdAt=datetime.now(UTC),
        isDeleted=False,
        deletedAt=None
    )
    mock_handlers["list"].repository.find_by_id.return_value = dummy_category

    result = category_service.get_category_by_id("abc123")
    assert result is not None
    assert result["id"] == "abc123"

def test_get_category_by_id_not_found(category_service, mock_handlers):
    mock_handlers["list"].repository.find_by_id.return_value = None
    result = category_service.get_category_by_id("abc123")
    assert result is None
