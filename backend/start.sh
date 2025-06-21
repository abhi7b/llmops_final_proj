#!/usr/bin/env bash
pip install --upgrade pip
pip install -r requirements.txt
exec uvicorn app.main:app --host 0.0.0.0 --port 10000 