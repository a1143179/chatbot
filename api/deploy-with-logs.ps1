# Deploy Azure Functions with Information level logging
# Make sure you're logged in to Azure first

Write-Host "Deploying Azure Functions with Information logging..." -ForegroundColor Green

# Navigate to the API directory
Set-Location "api"

# Deploy to Azure Function App
# Replace 'chatbotprocessor' with your actual Function App name
func azure functionapp publish chatbotprocessor

Write-Host "Deployment completed with Information logging!" -ForegroundColor Green
Write-Host "Your functions should now be available at:" -ForegroundColor Yellow
Write-Host "https://chatbotprocessor.azurewebsites.net/api/health" -ForegroundColor Cyan
Write-Host "https://chatbotprocessor.azurewebsites.net/api/process" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Log levels set to Information for:" -ForegroundColor Green
Write-Host "- default" -ForegroundColor Cyan
Write-Host "- Host.Results" -ForegroundColor Cyan
Write-Host "- Function" -ForegroundColor Cyan
Write-Host "- Host.Aggregator" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Check Azure Portal > Function App > Monitor > Log stream for detailed logs" -ForegroundColor Yellow 