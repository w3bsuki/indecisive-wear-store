#!/bin/bash

# Install Stripe CLI on Ubuntu/Debian
echo "Installing Stripe CLI..."

# Add Stripe GPG key
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg

# Add Stripe repository
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list

# Update package list and install
sudo apt update
sudo apt install stripe

echo "Stripe CLI installation complete!"
echo ""
echo "To verify installation, run: stripe --version"
echo ""
echo "To login to your Stripe account, run: stripe login"