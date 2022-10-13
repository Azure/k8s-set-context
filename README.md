# Kubernetes set context

This action can be used to set cluster context before other actions like [`azure/k8s-deploy`](https://github.com/Azure/k8s-deploy/tree/master) and [`azure/k8s-create-secret`](https://github.com/Azure/k8s-create-secret/tree/master). It should also be used before `kubectl` commands (in script) are run subsequently in the workflow.

## Azure Login

It is a requirement to use [`azure/login`](https://github.com/Azure/login/tree/master) in your workflow before using this action when using the `service-account` or `service-principal` methods. This can be done via:

-  Credentials from an Azure Service Principal
-  OpenID Connect (OIDC) based Federated Identity Credential

For more information on Azure Login refer [here](<https://github.com/marketplace/actions/azure-login#:~:text=GitHub%20Action%20for,in%20step%20(i)>) and use the examples below as a reference

#### Azure Login via OIDC (Recommended)

```yaml
- uses: azure/login@v1
  with:
     client-id: ${{ secrets.AZURE_CLIENT_ID }}
     tenant-id: ${{ secrets.AZURE_TENANT_ID }}
     subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

#### Azure Login via creds

```yaml
- uses: azure/login@v1
  with:
     creds: ${{ secrets.AZURE_CREDENTIALS }}
```

## Deployment Target Approaches

There are three types of clusters you can specify as deployment targets:

-  `AKS Clusters` using Service Principal or Service Account authentication
-  `ARC Clusters` using Service Principal or Service Account authentication
-  `Generic Clusters` using Kubeconfig passed in as a value or Service Account authentication

In all these approaches it is recommended to store these contents (kubeconfig file content or secret content) in a [secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets/).

Refer to the [action metadata file](./action.yml) for details about inputs.

Use the below examples as a reference on how to access your cluster using the different authentication methods available to it.

### Kubeconfigs

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

### AKS Clusters

#### Service Principal Authentication

```yaml
- uses: azure/k8s-set-context@v4
  with:
     method: service-principal
     resource-group: '<resource group name>'
     cluster-type: aks
     cluster-name: '<cluster name>'
     admin: '<admin status>'
```

##### Non-Admin AKS Users

When using Service Principal authentication the status of the cluster's `admin` credentials can affect the method used to get its kubeconfig from AKS clusters. `Kubelogin` is at the core of the non-admin user scenario when using AKS clusters. For more information on `kubelogin`, refer to the documentation [here](https://github.com/Azure/kubelogin).

Non-Admin users will have to install kubelogin to use this Action succesfully. To set up `kubelogin` you may use the following:

```yaml
- name: Set up kubelogin for non-interactive login
        run: |
          curl -LO https://github.com/Azure/kubelogin/releases/download/v0.0.20/kubelogin-linux-amd64.zip
          sudo unzip -j kubelogin-linux-amd64.zip -d /usr/local/bin
          rm -f kubelogin-linux-amd64.zip
          kubelogin --version
```

#### Service Account Authentication

```yaml
- uses: azure/k8s-set-context@v4
  with:
     method: service-account
     k8s-url: <URL of the cluster's API server>
     k8s-secret: <secret associated with the service account>
     cluster-type: aks
```

For fetching Server URL, execute the following command on your shell:

```bash
kubectl config view --minify -o 'jsonpath={.clusters[0].cluster.server}'
```

For fetching Secret object required to connect and authenticate with the cluster, the following sequence of commands need to be run :

```bash
kubectl get serviceAccounts <service-account-name> -n <namespace> -o 'jsonpath={.secrets[*].name}'

kubectl get secret <service-account-secret-name> -n <namespace> -o yaml
```

### ARC Clusters

#### Service Principal Authentication

```yaml
- uses: azure/k8s-set-context@v4
  with:
     method: service-principal
     resource-group: '<resource group name>'
     cluster-type: arc
     cluster-name: '<cluster name>'
```

#### Service Account Authentication

```yaml
- uses: azure/k8s-set-context@v4
  with:
     method: service-account
     cluster-type: arc
     cluster-name: <cluster-name>
     resource-group: <resource-group>
     token: '${{ secrets.SA_TOKEN }}'
```

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
