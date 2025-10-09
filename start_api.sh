#!/bin/bash
cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-pap-api
source venv/bin/activate
exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

