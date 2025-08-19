import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, event
from sqlalchemy.pool import NullPool
from urllib.parse import quote_plus

db = SQLAlchemy()

class DatabaseConfig:
    """Database configuration with support for SQLite and PostgreSQL"""
    
    @staticmethod
    def get_database_uri():
        """Get database URI with support for multiple database types"""
        
        # Check for Railway PostgreSQL (production)
        if os.environ.get('DATABASE_URL'):
            uri = os.environ.get('DATABASE_URL')
            # Railway uses postgres:// but SQLAlchemy requires postgresql://
            if uri.startswith("postgres://"):
                uri = uri.replace("postgres://", "postgresql://", 1)
            return uri
        
        # Check for explicit PostgreSQL configuration
        if os.environ.get('DB_TYPE') == 'postgresql':
            return DatabaseConfig.build_postgresql_uri()
        
        # Default to SQLite for development
        return DatabaseConfig.build_sqlite_uri()
    
    @staticmethod
    def build_postgresql_uri():
        """Build PostgreSQL connection URI"""
        db_user = os.environ.get('DB_USER', 'postgres')
        db_password = quote_plus(os.environ.get('DB_PASSWORD', 'postgres'))
        db_host = os.environ.get('DB_HOST', 'localhost')
        db_port = os.environ.get('DB_PORT', '5432')
        db_name = os.environ.get('DB_NAME', 'hera_db')
        
        return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    @staticmethod
    def build_sqlite_uri():
        """Build SQLite connection URI"""
        # Use absolute path for macOS compatibility
        try:
            basedir = os.path.abspath(os.path.dirname(__file__))
        except NameError:
            # Fallback if __file__ is not available
            basedir = os.getcwd()
        db_path = os.path.join(basedir, 'hera.db')
        return f"sqlite:///{db_path}"
    
    @staticmethod
    def get_engine_options():
        """Get database engine options based on the database type"""
        uri = DatabaseConfig.get_database_uri()
        
        if 'postgresql' in uri:
            return {
                'pool_size': 10,
                'pool_recycle': 3600,
                'pool_pre_ping': True,
                'max_overflow': 20,
                'echo': os.environ.get('DB_ECHO', 'False').lower() == 'true'
            }
        else:  # SQLite
            return {
                'connect_args': {
                    'check_same_thread': False,
                    'timeout': 15
                },
                'poolclass': NullPool,
                'echo': os.environ.get('DB_ECHO', 'False').lower() == 'true'
            }

def init_db(app):
    """Initialize database with the Flask app"""
    
    # Configure database
    app.config['SQLALCHEMY_DATABASE_URI'] = DatabaseConfig.get_database_uri()
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = DatabaseConfig.get_engine_options()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize SQLAlchemy
    db.init_app(app)
    
    # Add SQLite-specific configurations after app context is available
    with app.app_context():
        if 'sqlite' in app.config['SQLALCHEMY_DATABASE_URI']:
            @event.listens_for(db.engine, "connect")
            def set_sqlite_pragma(dbapi_conn, connection_record):
                cursor = dbapi_conn.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.close()
    
    return db

def create_tables(app):
    """Create all database tables"""
    with app.app_context():
        db.create_all()
        print(f"✅ Database tables created successfully!")
        print(f"📁 Database URI: {DatabaseConfig.get_database_uri()}")

def drop_tables(app):
    """Drop all database tables"""
    with app.app_context():
        db.drop_all()
        print("⚠️  All database tables dropped!")

def reset_database(app):
    """Reset database by dropping and recreating all tables"""
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("🔄 Database reset complete!")