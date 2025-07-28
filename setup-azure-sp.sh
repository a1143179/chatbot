#!/bin/bash

# Azure Service Principal Setup Script for Chatbot Deployment
# This script helps create an Azure Service Principal for GitHub Actions deployment

echo "🔧 Azure Service Principal Setup for Chatbot Deployment"
echo "======================================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   Windows: winget install -e --id Microsoft.AzureCLI"
    echo "   macOS: brew install azure-cli"
    echo "   Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo "🔐 Please login to Azure first:"
    az login
fi

# Get subscription information
echo "📋 Available subscriptions:"
az account list --query "[].{name:name, id:id}" --output table

echo ""
echo "Please enter your subscription ID (or press Enter to use the default):"
read -r subscription_id

if [ -z "$subscription_id" ]; then
    subscription_id=$(az account show --query id --output tsv)
    echo "Using default subscription: $subscription_id"
fi

# Create service principal
echo ""
echo "🔑 Creating Azure Service Principal..."
echo "This will create a service principal with Contributor role on your subscription."

sp_output=$(az ad sp create-for-rbac --name "chatbot-deployment-$(date +%s)" \
    --role contributor \
    --scopes "/subscriptions/$subscription_id" \
    --sdk-auth)

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Service Principal created successfully!"
    echo ""
    echo "📋 Copy the following JSON and add it as AZURE_CREDENTIALS in your GitHub repository secrets:"
    echo "   Repository Settings → Secrets and variables → Actions → New repository secret"
    echo ""
    echo "Name: AZURE_CREDENTIALS"
    echo "Value:"
    echo "$sp_output"
    echo ""
    echo "🔗 GitHub Secrets Setup:"
    echo "1. Go to your GitHub repository"
    echo "2. Click Settings → Secrets and variables → Actions"
    echo "3. Click 'New repository secret'"
    echo "4. Add AZURE_CREDENTIALS with the JSON above"
    echo "5. Add AZURE_FUNCTION_APP_NAME with your function app name"
    echo ""
    echo "⚠️  Important: Keep this JSON secure and don't share it publicly!"
else
    echo "❌ Failed to create service principal. Please check your Azure permissions."
    exit 1
fi 