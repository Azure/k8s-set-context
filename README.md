# Kubernetes set context

This action can be used to set cluster context before other actions like [`azure/k8s-deploy`](https://github.com/Azure/k8s-deploy/tree/master) and [`azure/k8s-create-secret`](https://github.com/Azure/k8s-create-secret/tree/master). It should also be used before `kubectl` commands (in script) are run subsequently in the workflow.

## Deployment Target Approaches

There are three types of clusters you can specify as deployment targets:

-  `AKS Clusters` using Service Principal or Service Account authentication
-  `ARC Clusters` using Service Principal or Service Account authentication
-  `Generic Clusters` using Kubeconfig passed in as a value or Service Account authentication

In all of these approaches it is recommended to store these contents (kubeconfig file content or secret content) in a [secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets/). Refer to the [action metadata file](./action.yml) for details about inputs.

## AKS Clusters

### Service Principal Authentication

Service Principal authentication has several requirements before using it in this action. Examples and explanations for them are below:

#### Azure Login

[`azure/login`](https://github.com/Azure/login/tree/master) is required in your workflow before this action if using service-principal. This can be done via:

-  OpenID Connect (OIDC) based Federated Identity Credential
-  Credentials from an Azure Service Principal

For more information on Azure Login refer [here](<https://github.com/marketplace/actions/azure-login#:~:text=GitHub%20Action%20for,in%20step%20(i)>) and use the examples below as a reference

Azure Login via OIDC (Recommended)

```yaml
- uses: azure/login@v1
  with:
     client-id: ${{ secrets.AZURE_CLIENT_ID }}
     tenant-id: ${{ secrets.AZURE_TENANT_ID }}
     subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

Azure Login via creds

```yaml
- uses: azure/login@v1
  with:
     creds: ${{ secrets.AZURE_CREDENTIALS }}
```

#### AKS Cluster Service Principal Examples

A user's admin credentials can affect the method this action uses to get the kubeconfig from an AKS cluster via Service Principal. Admin users do not have extra requirements but non-admin users are required to use `Kubelogin`. Below are examples for both scenarios:

##### Admin Users

```yaml
- uses: azure/login@v1
  with:
     client-id: ${{ secrets.AZURE_CLIENT_ID }}
     tenant-id: ${{ secrets.AZURE_TENANT_ID }}
     subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
- uses: azure/k8s-set-context@v4
  with:
     method: service-principal
     resource-group: '<resource group name>'
     cluster-type: aks
     cluster-name: '<cluster name>'
     admin: '<admin status>'
```

##### Non-Admin Users

`Kubelogin` is at the core of the non-admin user scenario. For more information on `kubelogin`, refer to the documentation [here](https://github.com/Azure/kubelogin).

Non-Admin users have to install kubelogin before this action to use it succesfully. Use the following example as a reference for non-admins:

```yaml
- name: Set up kubelogin for non-interactive login
        run: |
          curl -LO https://github.com/Azure/kubelogin/releases/download/v0.0.20/kubelogin-linux-amd64.zip
          sudo unzip -j kubelogin-linux-amd64.zip -d /usr/local/bin
          rm -f kubelogin-linux-amd64.zip
          kubelogin --version
- uses: azure/login@v1
  with:
     client-id: ${{ secrets.AZURE_CLIENT_ID }}
     tenant-id: ${{ secrets.AZURE_TENANT_ID }}
     subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
- uses: azure/k8s-set-context@v4
  with:
     method: service-principal
     resource-group: '<resource group name>'
     cluster-type: aks
     cluster-name: '<cluster name>'
     admin: 'false'
```

### Service Account Authentication

Service Account authentication does not require Azure Login. Instead it requires the cluster `Server URL` and `Secret`.

For fetching Server URL, execute the following command on your shell:

```bash
kubectl config view --minify -o 'jsonpath={.clusters[0].cluster.server}'
```

For fetching Secret object required to connect and authenticate with the cluster, the following sequence of commands need to be run :

```bash
kubectl get serviceAccounts <service-account-name> -n <namespace> -o 'jsonpath={.secrets[*].name}'

kubectl get secret <service-account-secret-name> -n <namespace> -o yaml
```

#### AKS Cluster Service Account Example

```yaml
- uses: azure/k8s-set-context@v4
  with:
     method: service-account
     k8s-url: <URL of the cluster's API server>
     k8s-secret: <secret associated with the service account>
     cluster-type: aks
```

## ARC Clusters

ARC Cluster Service Principal Authentication also requires Azure Login. Use the [AKS Azure Login](https://github.com/aamgayle/k8s-set-context/edit/test2br/README.md#azure-login) section as reference for it.

#### ARC Cluster Service Principal Example

```yaml
- uses: azure/k8s-set-context@v4
  with:
     method: service-principal
     resource-group: '<resource group name>'
     cluster-type: arc
     cluster-name: '<cluster name>'
```

#### ARC Cluster Service Account Authentication

```yaml
- uses: azure/k8s-set-context@v4
  with:
     method: service-account
     cluster-type: arc
     cluster-name: <cluster-name>
     resource-group: <resource-group>
     token: '${{ secrets.SA_TOKEN }}'
```

## Generic Clusters

#### Kubeconfigs Method

```yaml
- uses: azure/k8s-set-context@v4
  with:
     method: kubeconfig
     kubeconfig: <your kubeconfig>
     context: <context name> # current-context from kubeconfig is used as default
```

**Please note** that the input requires the _contents_ of the kubeconfig file, and not its path.

You will need to fetch a kubeconfig file onto your local development machine so that the same can be used in the action input shown above.

Please refer to documentation on fetching [kubeconfig for any generic K8s cluster](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/)

#### Generic Cluster Service Account Authentication

Generic clusters and AKS clusters Service Account Authentication methods have similar requirements. Refer to the [AKS Service Account Authentication](https://github.com/aamgayle/k8s-set-context/edit/test2br/README.md#service-account-authentication) section for examples and inputs.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
