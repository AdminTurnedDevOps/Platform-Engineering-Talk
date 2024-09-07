## Install

```
curl -L https://github.com/kubernetes-sigs/cluster-api/releases/download/v1.4.4/clusterctl-linux-amd64 -o clusterctl

sudo install -o root -g root -m 0755 clusterctl /usr/local/bin/clusterctl
```

```
brew install clusterctl
```

## Init Management Cluster

```
export CLUSTER_TOPOLOGY=true
```

```
export AZURE_SUBSCRIPTION_ID=""

# Create an Azure Service Principal and paste the output here
export AZURE_TENANT_ID=""
export AZURE_CLIENT_ID=""
export AZURE_CLIENT_SECRET=""

# Base64 encode the variables
export AZURE_SUBSCRIPTION_ID_B64="$(echo -n "$AZURE_SUBSCRIPTION_ID" | base64 | tr -d '\n')"
export AZURE_TENANT_ID_B64="$(echo -n "$AZURE_TENANT_ID" | base64 | tr -d '\n')"
export AZURE_CLIENT_ID_B64="$(echo -n "$AZURE_CLIENT_ID" | base64 | tr -d '\n')"
export AZURE_CLIENT_SECRET_B64="$(echo -n "$AZURE_CLIENT_SECRET" | base64 | tr -d '\n')"

# Settings needed for AzureClusterIdentity used by the AzureCluster
export AZURE_CLUSTER_IDENTITY_SECRET_NAME="cluster-identity-secret"
export CLUSTER_IDENTITY_NAME="cluster-identity"
export AZURE_CLUSTER_IDENTITY_SECRET_NAMESPACE="default"
```

```
# Create a secret to include the password of the Service Principal identity created in Azure
kubectl create secret generic "${AZURE_CLUSTER_IDENTITY_SECRET_NAME}" --from-literal=clientSecret="${AZURE_CLIENT_SECRET}" --namespace "${AZURE_CLUSTER_IDENTITY_SECRET_NAMESPACE}"
```

```
# Finally, initialize the management cluster
clusterctl init --infrastructure azure
```

## Create The Declarative Config

```
export AZURE_LOCATION="eastus"

export AZURE_CONTROL_PLANE_MACHINE_TYPE="Standard_D2s_v3"
export AZURE_NODE_MACHINE_TYPE="Standard_D2s_v3"

export AZURE_RESOURCE_GROUP="devrelasaservice"
```

```
clusterctl generate cluster capi-azure --kubernetes-version v1.29.0 > capi-azurekubeadm.yaml
```

## Apply Config

```
kubectl apply -f capi-azurekubeadm.yaml
```

## Connect To Cluster

```
clusterctl get kubeconfig capi-azure > capi-azure.kubeconfig
```

## Configure Cloud Provider
```
helm install --kubeconfig=./capi-azure.kubeconfig --repo https://raw.githubusercontent.com/kubernetes-sigs/cloud-provider-azure/master/helm/repo cloud-provider-azure --generate-name --set infra.clusterName=capi-azure --set cloudControllerManager.clusterCIDR="192.168.0.0/16"
```

## CNI Install
```
helm repo add projectcalico https://docs.tigera.io/calico/charts --kubeconfig=./capi-azure.kubeconfig && \
helm install calico projectcalico/tigera-operator --kubeconfig=./capi-azure.kubeconfig -f https://raw.githubusercontent.com/kubernetes-sigs/cluster-api-provider-azure/main/templates/addons/calico/values.yaml --namespace tigera-operator --create-namespace
```