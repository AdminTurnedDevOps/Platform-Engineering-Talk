import * as pulumi from "@pulumi/pulumi";
import * as aks from "@pulumi/azure-native/containerservice";

let clusterName: string = "aks0192"
let location: string = "eastus"
let rgName: string = "devrelasaservice"
let k8sVersion: string = "1.30"
let nodeCount: number = 3

new aks.ManagedCluster(clusterName, {
    location: location,
    resourceGroupName: rgName,
    dnsPrefix: "dns-" + clusterName,
    kubernetesVersion: k8sVersion,
    agentPoolProfiles: [{
        count: nodeCount,
        maxPods: 110,
        mode: "System",
        name: "agentpool",
        nodeLabels: {},
        osDiskSizeGB: 30,
        osType: "Linux",
        type: "VirtualMachineScaleSets",
        vmSize: "Standard_DS2_v2",
    }],
    identity: {
        type: "SystemAssigned",
    },
    tags: {
        Environment: "Production",
    },
});
