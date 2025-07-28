# Deploy Azure Functions to Azure
# Make sure you're logged in to Azure first

Write-Host "Deploying Azure Functions to Azure..." -ForegroundColor Green

# Navigate to the API directory
Set-Location "api"

# Deploy to Azure Function App
# Replace 'chatbotprocessor' with your actual Function App name
func azure functionapp publish chatbotprocessor

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Your functions should now be available at:" -ForegroundColor Yellow
Write-Host "https://chatbotprocessor.azurewebsites.net/api/health" -ForegroundColor Cyan
Write-Host "https://chatbotprocessor.azurewebsites.net/api/process" -ForegroundColor Cyan 