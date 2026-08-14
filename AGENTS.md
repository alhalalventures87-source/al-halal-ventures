# Git Push Workflow
Whenever the user asks to commit or push changes, or when committing/pushing after making changes, NEVER ask in text. ALWAYS trigger the native Windows desktop popup modal dialog by running:
powershell -ExecutionPolicy Bypass -File "C:\Users\DELL\git-push-modal.ps1"
This lets the user click their project and click "Push & Continue" directly on their screen with no typing needed.
