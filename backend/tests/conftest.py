import pytest
from unittest.mock import patch, MagicMock
from app import create_app


@pytest.fixture
def app():
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def _mock_db(monkeypatch, table_responses: dict):
    """Helper to mock get_db() with per-table responses."""
    mock_client = MagicMock()

    def table_side_effect(name):
        mock_table = MagicMock()
        responses = table_responses.get(name, {})

        def chain(*args, **kwargs):
            return mock_table

        mock_table.select.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.gt.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.limit.return_value = mock_table

        execute_mock = MagicMock()
        execute_mock.data = responses.get("data", [])
        mock_table.execute.return_value = execute_mock
        return mock_table

    mock_client.table.side_effect = table_side_effect
    monkeypatch.setattr("app.blueprints.sessions.get_db", lambda: mock_client)
    monkeypatch.setattr("app.blueprints.attendance.get_db", lambda: mock_client)
    monkeypatch.setattr("app.blueprints.roster.get_db", lambda: mock_client)
    monkeypatch.setattr("app.blueprints.registration.get_db", lambda: mock_client)
    monkeypatch.setattr("app.blueprints.auth.get_db", lambda: mock_client)
    return mock_client
