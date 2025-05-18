import os

class Config:
    # Parse配置
    PARSE_APPLICATION_ID = 'eYOiUXLf1JTbzwx7Sp7P29FPnLzUQHBlS2zRqMfM'
    PARSE_REST_API_KEY = '5cTOQCZlBI6PiLjQmHPwqXPcqvTueBnZCsDy4HwE'
    PARSE_MASTER_KEY = 'f9OkoAOFJ2UDSXF448XtATxeQBioDWeBKN2tbyEp'
    
    # 其他配置
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    INDEX_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'product_search', 'product_index.bin')

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
