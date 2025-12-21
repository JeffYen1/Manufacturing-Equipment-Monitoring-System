"""
Pytest configuration and shared fixtures.

This module sets up:
- An isolated SQLite database for tests
- Dependency overrides so tests do not touch production data
- A FastAPI TestClient for API-level testing

The goal is to ensure tests are deterministic, repeatable,
and safe to run without side effects.
"""


import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app, get_db
from app import models
from app.database import Base

# Create a separate SQLite database for testing only
TEST_DB_PATH = "test_manufacturing.db"
TEST_DATABASE_URL = f"sqlite:///./{TEST_DB_PATH}"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args = {"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)


def override_get_db():

    """
    Override the application's database dependency.

    Each test gets a fresh database session,
    ensuring isolation between test cases.
    """
    
    db = TestingSessionLocal()
    try: 
        yield db
    finally:
        db.close()

@pytest.fixture(scope = "session", autouse = True)
def setup_test_db():

    """
    Create all database tables before tests run,
    and clean them up afterward.

    This ensures a clean schema without persisting test data.
    """

    # Create tables
    Base.metadata.create_all(bind = engine)
    yield
    # Drop tables and remove DB file after tests
    Base.metadata.drop_all(bind = engine)
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)

@pytest.fixture()
def client():

    """
    Provide a FastAPI TestClient with the test database injected.

    This allows API requests to be tested as if they were
    real HTTP calls, without starting a server.
    """

    # Override dependency for tests
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()