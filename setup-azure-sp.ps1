# Azure Service Principal Setup Script for Chatbot Deployment
# This script helps create an Azure Service Principal for GitHub Actions deployment

Write-Host "🔧 Azure Service Principal Setup for Chatbot Deployment" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json
    Write-Host "✅ Azure CLI found: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   Windows: winget install -e --id Microsoft.AzureCLI" -ForegroundColor Yellow
    Write-Host "   Or download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please login to Azure first:" -ForegroundColor Yellow
    az login
}

# Get subscription information
Write-Host "📋 Available subscriptions:" -ForegroundColor Cyan
az account list --query "[].{name:name, id:id}" --output table

Write-Host ""
$subscription_id = Read-Host "Please enter your subscription ID (or press Enter to use the default)"

if ([string]::IsNullOrEmpty($subscription_id)) {
    $subscription_id = az account show --query id --output tsv
    Write-Host "Using default subscription: $subscription_id" -ForegroundColor Green
}

# Create service principal
Write-Host ""
Write-Host "🔑 Creating Azure Service Principal..." -ForegroundColor Yellow
Write-Host "This will create a service principal with Contributor role on your subscription." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$sp_name = "chatbot-deployment-$timestamp"

try {
    $sp_output = az ad sp create-for-rbac --name $sp_name --role contributor --scopes "/subscriptions/$subscription_id" --sdk-auth
    
    Write-Host ""
    Write-Host "✅ Service Principal created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Copy the following JSON and add it as AZURE_CREDENTIALS in your GitHub repository secrets:" -ForegroundColor Cyan
    Write-Host "   Repository Settings → Secrets and variables → Actions → New repository secret" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Name: AZURE_CREDENTIALS" -ForegroundColor Yellow
    Write-Host "Value:" -ForegroundColor Yellow
    Write-Host $sp_output -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 GitHub Secrets Setup:" -ForegroundColor Cyan
    Write-Host "1. Go to your GitHub repository" -ForegroundColor White
    Write-Host "2. Click Settings → Secrets and variables → Actions" -ForegroundColor White
    Write-Host "3. Click 'New repository secret'" -ForegroundColor White
    Write-Host "4. Add AZURE_CREDENTIALS with the JSON above" -ForegroundColor White
    Write-Host "5. Add AZURE_FUNCTION_APP_NAME with your function app name" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Important: Keep this JSON secure and don't share it publicly!" -ForegroundColor Red
    
} catch {
    Write-Host "❌ Failed to create service principal. Please check your Azure permissions." -ForegroundColor Red
    exit 1
} 