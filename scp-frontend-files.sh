#!/bin/bash

# SCP specific frontend files to production
PROD_SERVER="ubuntu@3.26.151.118"
PROD_PATH="~/deployments/clinical-lab/frontend-next"
SSH_KEY="~/pem-folder/myserver.pem"

echo "📤 Copying frontend files to production..."

# Question generator components
scp -i $SSH_KEY frontend-next/src/app/components/question-generator/admin-dashboard.tsx \
    $PROD_SERVER:$PROD_PATH/src/app/components/question-generator/

scp -i $SSH_KEY frontend-next/src/app/components/question-generator/advanced-table-editor.tsx \
    $PROD_SERVER:$PROD_PATH/src/app/components/question-generator/

scp -i $SSH_KEY frontend-next/src/app/components/question-generator/markdown-parser-utils.ts \
    $PROD_SERVER:$PROD_PATH/src/app/components/question-generator/

scp -i $SSH_KEY frontend-next/src/app/components/question-generator/rich-content-editor.tsx \
    $PROD_SERVER:$PROD_PATH/src/app/components/question-generator/

scp -i $SSH_KEY frontend-next/src/app/components/question-generator/rich-content-renderer.tsx \
    $PROD_SERVER:$PROD_PATH/src/app/components/question-generator/

# Unified editor components
scp -i $SSH_KEY frontend-next/src/app/components/question-generator/unified-editor/ExplanationBlockEditor.tsx \
    $PROD_SERVER:$PROD_PATH/src/app/components/question-generator/unified-editor/

scp -i $SSH_KEY frontend-next/src/app/components/question-generator/unified-editor/PerAnswerExplanationEditor.tsx \
    $PROD_SERVER:$PROD_PATH/src/app/components/question-generator/unified-editor/

scp -i $SSH_KEY frontend-next/src/app/components/question-generator/unified-editor/RichTextEditor.tsx \
    $PROD_SERVER:$PROD_PATH/src/app/components/question-generator/unified-editor/

scp -i $SSH_KEY frontend-next/src/app/components/question-generator/unified-editor/content-utils.ts \
    $PROD_SERVER:$PROD_PATH/src/app/components/question-generator/unified-editor/

# Test creation component
scp -i $SSH_KEY frontend-next/src/app/components/test-creation/MarkedToggle.tsx \
    $PROD_SERVER:$PROD_PATH/src/app/components/test-creation/

echo "✅ Files copied successfully!"
echo ""
echo "📋 Next steps on production:"
echo "   cd ~/deployments/clinical-lab/frontend-next"
echo "   npm run build"
echo "   pm2 restart clinical-lab-frontend"

