# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd F:\CSE471; python app.py"

# Start Admin Panel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd F:\CSE471\Admin; npm run dev"

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd F:\CSE471\frontend; npm run dev"

Write-Host "All servers starting..."
Write-Host "Backend: http://localhost:1581"
Write-Host "Admin:   http://localhost:3001"
Write-Host "Frontend: http://localhost:3000"