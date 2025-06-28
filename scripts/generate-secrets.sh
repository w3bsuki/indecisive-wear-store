#!/bin/bash

# Script to generate secure secrets for production deployment

echo "Generating secure secrets for production deployment..."
echo ""

# Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Generate Cookie Secret
COOKIE_SECRET=$(openssl rand -base64 32)
echo "COOKIE_SECRET=$COOKIE_SECRET"
echo ""

# Generate Admin Password
ADMIN_PASSWORD=$(openssl rand -base64 16)
echo "ADMIN_PASSWORD=$ADMIN_PASSWORD"
echo ""

echo "----------------------------------------"
echo "IMPORTANT: Save these secrets securely!"
echo "They cannot be recovered if lost."
echo "----------------------------------------"
echo ""

# Create .env.production file
read -p "Do you want to create a .env.production file? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cat > .env.production <<EOF
# Generated on $(date)
# SECURITY WARNING: Keep this file secret and never commit to version control

JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET

# Add your other production variables below:
# DATABASE_URL=
# STRIPE_API_KEY=
# STRIPE_WEBHOOK_SECRET=
# REDIS_URL=
# SUPABASE_URL=
# SUPABASE_KEY=
# SUPABASE_BUCKET=
EOF
    
    echo ".env.production file created successfully!"
    echo "Remember to add it to .gitignore!"
fi