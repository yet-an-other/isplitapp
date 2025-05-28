#!/bin/bash

# Define variables
KUBECONFIG="$HOME/remote-kube/hetzner/config"
BASE_DIR="$(dirname "$0")"

# Check if "db-restore" parameter is passed
if [ "$1" = "db-restore" ]; then
  echo "📊 Applying database restore job only..."
  kubectl apply --kubeconfig "$KUBECONFIG" -f "$BASE_DIR/base/restore-db.yaml"
else
  echo "🚀 Deploying complete hetzner environment..."
  kubectl apply --kubeconfig "$KUBECONFIG" -k "$BASE_DIR/overlays/hetzner"

  echo -e "\033[33mif you want to restore the database, run the following command: ./deploy-hetzner.sh db-restore\033[0m"
fi