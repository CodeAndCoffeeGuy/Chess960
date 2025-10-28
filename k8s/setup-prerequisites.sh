#!/bin/bash

# Setup script for Bullet Chess Kubernetes prerequisites
# Installs and configures all required tools and operators

set -e

echo "🔧 Setting up Bullet Chess Kubernetes prerequisites..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install kubectl if not present
if ! command_exists kubectl; then
    echo "Installing kubectl..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    chmod +x kubectl
    sudo mv kubectl /usr/local/bin/
fi

# Install helm if not present
if ! command_exists helm; then
    echo "Installing Helm..."
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Add Helm repositories
echo "Adding Helm repositories..."
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo add jetstack https://charts.jetstack.io
helm repo add kedacore https://kedacore.github.io/charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Istio service mesh
echo "Installing Istio..."
helm upgrade --install istio-base istio/base -n istio-system --create-namespace
helm upgrade --install istiod istio/istiod -n istio-system --wait
helm upgrade --install istio-ingressgateway istio/gateway -n istio-system

# Enable Istio injection for bullet-chess namespace
kubectl label namespace bullet-chess istio-injection=enabled --overwrite

# Install cert-manager for HTTPS certificates
echo "Installing cert-manager..."
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Install KEDA for advanced autoscaling
echo "Installing KEDA..."
helm upgrade --install keda kedacore/keda \
  --namespace keda \
  --create-namespace

# Install Prometheus Operator
echo "Installing Prometheus Operator..."
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=fast-ssd \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi

# Install cluster autoscaler (AWS-specific - modify for other cloud providers)
echo "Installing cluster autoscaler..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

# Create storage classes for different performance tiers
echo "Creating storage classes..."
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  iops: "16000"
  throughput: "1000"
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF

# Wait for all operators to be ready
echo "Waiting for operators to be ready..."
kubectl wait --for=condition=available deployment --all -n istio-system --timeout=300s
kubectl wait --for=condition=available deployment --all -n cert-manager --timeout=300s
kubectl wait --for=condition=available deployment --all -n keda --timeout=300s

echo "✅ Prerequisites setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your cloud provider credentials"
echo "2. Update DNS settings in https-certificates.yaml"
echo "3. Run ./deploy.sh to deploy the application"
echo ""
echo "📝 Verify installation:"
echo "   kubectl get pods -n istio-system"
echo "   kubectl get pods -n cert-manager"
echo "   kubectl get pods -n keda"