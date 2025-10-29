#!/bin/bash

echo "🔍 Diagnosing Signup Service Changes..."
echo "========================================"

cd /Users/rakeshraghu/Code\ Projects/Control_Core/control-core-012025/cc-signup-service

# Check if service is running
echo ""
echo "1️⃣  Checking if service is running on port 8002..."
if lsof -i :8002 > /dev/null 2>&1; then
    echo "   ✅ Service is running"
    lsof -i :8002 | grep LISTEN
else
    echo "   ❌ Service is NOT running!"
    echo "   Run: cd cc-signup-service && source venv/bin/activate && python run_on_8002.py"
    exit 1
fi

# Check build files exist
echo ""
echo "2️⃣  Checking build files..."
if [ -f "app/static/index.html" ]; then
    echo "   ✅ index.html exists"
else
    echo "   ❌ index.html missing! Run: cd frontend && npm run build"
    exit 1
fi

JS_FILE=$(ls app/static/assets/index-*.js 2>/dev/null | head -1)
CSS_FILE=$(ls app/static/assets/index-*.css 2>/dev/null | head -1)

if [ -f "$JS_FILE" ]; then
    echo "   ✅ JavaScript file: $(basename $JS_FILE)"
    echo "      Size: $(du -h "$JS_FILE" | cut -f1)"
    echo "      Modified: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$JS_FILE")"
else
    echo "   ❌ JavaScript file missing!"
    exit 1
fi

if [ -f "$CSS_FILE" ]; then
    echo "   ✅ CSS file: $(basename $CSS_FILE)"
else
    echo "   ❌ CSS file missing!"
fi

# Check content
echo ""
echo "3️⃣  Checking for new content in build..."

if grep -q "Sidecar Bouncer" "$JS_FILE" 2>/dev/null; then
    echo "   ✅ 'Sidecar Bouncer' found"
else
    echo "   ❌ 'Sidecar Bouncer' NOT found (old build?)"
fi

if grep -q "MCP Bouncer" "$JS_FILE" 2>/dev/null; then
    echo "   ✅ 'MCP Bouncer' found"
else
    echo "   ❌ 'MCP Bouncer' NOT found"
fi

if grep -q "042025" "$JS_FILE" 2>/dev/null; then
    echo "   ✅ Version '042025' found"
else
    echo "   ❌ Version '042025' NOT found"
fi

if grep -q "Job Title" "$JS_FILE" 2>/dev/null; then
    echo "   ✅ 'Job Title' field found"
else
    echo "   ❌ 'Job Title' field NOT found"
fi

# Summary
echo ""
echo "========================================"
echo "📊 Summary:"
echo ""

BUILD_OK=true
if grep -q "042025" "$JS_FILE" && grep -q "Sidecar Bouncer" "$JS_FILE" && grep -q "Job Title" "$JS_FILE" 2>/dev/null; then
    echo "✅ Build contains ALL new changes"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Open http://localhost:8002 in INCOGNITO mode"
    echo "   2. Check for:"
    echo "      - 3 bouncer cards (Sidecar, Reverse Proxy, MCP)"
    echo "      - Version shows 'v042025 (Latest Stable)'"
    echo "      - Info (?) buttons on each card"
    echo "      - Job Title field on signup form"
    echo ""
    echo "🚨 If you still see old version:"
    echo "   → It's BROWSER CACHE issue"
    echo "   → Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
    echo "   → Or use incognito mode (Cmd+Shift+N)"
else
    echo "❌ Build is missing some changes"
    echo ""
    echo "🔧 Fix: Rebuild frontend"
    echo "   cd frontend"
    echo "   npm run build"
    echo "   cd .."
    echo "   lsof -ti:8002 | xargs kill -9"
    echo "   source venv/bin/activate"
    echo "   python run_on_8002.py"
    BUILD_OK=false
fi

echo ""
echo "========================================"

if [ "$BUILD_OK" = true ]; then
    echo ""
    echo "🌐 Service URL: http://localhost:8002"
    echo "🔓 Open in INCOGNITO mode to bypass cache!"
    echo ""
fi

