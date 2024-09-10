## Install

Standard binary:
```
curl -L https://github.com/kubernetes-sigs/cluster-api/releases/download/v1.4.4/clusterctl-linux-amd64 -o clusterctl

sudo install -o root -g root -m 0755 clusterctl /usr/local/bin/clusterctl
```

On Mac:
```
brew install clusterctl
```

## Get Creds

```
az ad sp create-for-rbac --role contributor --scopes="/subscriptions/"
```

## Init Management Cluster

export AZURE_SUBSCRIPTION_ID=""

export AZURE_TENANT_ID=""
export AZURE_CLIENT_ID=""
export AZURE_CLIENT_ID_USER_ASSIGNED_IDENTITY=$AZURE_CLIENT_ID
export AZURE_CLIENT_SECRET=""


export AZURE_CLUSTER_IDENTITY_SECRET_NAME="cluster-identity-secret"
export CLUSTER_IDENTITY_NAME="cluster-identity"
export AZURE_CLUSTER_IDENTITY_SECRET_NAMESPACE="default"


kubectl create secret generic "${AZURE_CLUSTER_IDENTITY_SECRET_NAME}" --from-literal=clientSecret="${AZURE_CLIENT_SECRET}" --namespace "${AZURE_CLUSTER_IDENTITY_SECRET_NAMESPACE}"


clusterctl init --infrastructure azure

```
kubectl create -f - <<EOF
apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
kind: AzureClusterIdentity
metadata:
  labels:
    clusterctl.cluster.x-k8s.io/move-hierarchy: "true"
  name: id
  namespace: default
spec:
  allowedNamespaces: {}
  clientID: 
  clientSecret:
    name: cluster-identity-secret
    namespace: default
  tenantID: 
  type: ServicePrincipal
EOF
```


## Create The Declarative Config

```
export AZURE_LOCATION="eastus"

export AZURE_CONTROL_PLANE_MACHINE_TYPE="Standard_D2s_v3"
export AZURE_NODE_MACHINE_TYPE="Standard_D2s_v3"

export AZURE_RESOURCE_GROUP="devrelasaservice"
```

```
clusterctl generate cluster capi-azure \
  --infrastructure azure \
  --kubernetes-version v1.31.0 \
  --control-plane-machine-count=1 \
  --worker-machine-count=1 \
  > capi-azure.yaml

yq -i "with(. | select(.kind == \"AzureClusterIdentity\"); .spec.type |= \"ServicePrincipal\" | .spec.clientSecret.name |= \"${AZURE_CLUSTER_IDENTITY_SECRET_NAME}\" | .spec.clientSecret.namespace |= \"${AZURE_CLUSTER_IDENTITY_SECRET_NAMESPACE}\")" capi-azure.yaml

```

## Apply Config

```
kubectl apply -f capi-azure.yaml
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

## Cleanup

```
kubectl delete -f capi-azure.yaml
```