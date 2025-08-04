@echo off
echo 🔧 HERA App - Quick Fix for Pandas Issue
echo ========================================

echo 🗑️ Removing old virtual environment...
if exist ".venv" rmdir /s /q .venv
if exist "venv" rmdir /s /q venv

echo 📦 Creating fresh virtual environment...
python -m venv venv

echo 🔄 Activating virtual environment...
call venv\Scripts\activate.bat

echo 📥 Installing packages in correct order...
pip install --upgrade pip
pip install numpy==1.24.4
pip install pandas==2.0.3
pip install Flask==2.3.3
pip install Flask-SQLAlchemy==3.0.5
pip install Flask-Login==0.6.3
pip install Werkzeug==2.3.7
pip install openpyxl==3.1.2
pip install python-dateutil==2.8.2

echo ✅ Fixed! Now you can run: python app.py
pause
