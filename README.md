# Kubernetes set context

This action can be used to set cluster context before other actions like [`azure/k8s-deploy`](https://github.com/Azure/k8s-deploy/tree/master) and [`azure/k8s-create-secret`](https://github.com/Azure/k8s-create-secret/tree/master). It should also be used before `kubectl` commands (in script) are run subsequently in the workflow.

It is a requirement to use [`azure/login`](https://github.com/Azure/login/tree/master) in your workflow before using this action when using the `service-account` or `service-principal` methods or when getting the kubeconfig via az cli commands when using `use-az-set-context` and `use-kubelogin`.

## az cli Approaches

Using the `use-az-set-context` flag will override all other methods of obtaining the kubeconfig. If the user is not an admin they are required to use kubelogin to successfully use this Action via az cli approach. The required inputs are listed below:

### az cli Action Inputs

<table>
  <thead>
    <tr>
      <th>Action inputs</th>
      <th>Description</th>
      <th>Required</th>
    </tr>
  </thead>

  <tr>
    <td><code>use-az-set-context</code></td>
    <td>Resource group containing the AKS cluster</td>
    <td>Yes</td>
  </tr>
  <tr>
    <td><code>resource-group</code></td>
    <td>Resource group containing the AKS cluster</td>
    <td>Yes</td>
  </tr>
  <tr>
    <td><code>cluster-name</code>
    <td>Name of the AKS cluster</td>
    <td>Yes</td>
  </tr>
  <tr>
    <td><code>subscription</code></td>
    <td>Subscription tied to AKS cluster</td>
    <td>No</td>
  </tr>
  <tr>
    <td><code>admin</code></td>
    <td>Get cluster admin credentials. </br>Values: true or false</td>
    <td>No</td>
  </tr>
  <tr>
    <td><code>use-kubelogin</code></td>
    <td>Allows non-admin users to use the Action via kubelogin</br>Values: true or false</td>
    <td>Admins: No
        </br>Non-Admins: Yes</td>
  </tr>
</table>

## Admin az cli Examples
### OIDC Authentication (recommended)

```yaml
- uses: azure/login@v1
  with:
     client-id: ${{ secrets.AZURE_CLIENT_ID }}
     tenant-id: ${{ secrets.AZURE_TENANT_ID }}
     subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

- uses: azure/aks-set-context@v3
  with:
     use-az-set-context: 'true'
     resource-group: '<resource group name>'
     cluster-name: '<cluster name>'
```

### Service Principal Authentication

```yaml
- uses: azure/login@v1
  with:
     creds: ${{ secrets.AZURE_CREDENTIALS }}

- uses: azure/aks-set-context@v3
  with:
     use-az-set-context: 'true'
     resource-group: '<resource group name>'
     cluster-name: '<cluster name>'
```

### Non-Admin az cli Users
`kubelogin` is at the core of the non-admin user scenario when using `use-az-set-context`. For more information on `kubelogin`, refer to the documentation [here](https://github.com/Azure/kubelogin). 

Non-Admin users will have to install kubelogin to use this Action succesfully. To set up `kubelogin` you may use the following:
```yaml
- name: Set up kubelogin for non-interactive login
        run: |
          curl -LO https://github.com/Azure/kubelogin/releases/download/v0.0.9/kubelogin-linux-amd64.zip
          sudo unzip -j kubelogin-linux-amd64.zip -d /usr/local/bin
          rm -f kubelogin-linux-amd64.zip
          kubelogin --version
```

### Non-Admin User Example

If you are executing this Action as a non-admin user, you need to toggle the optional `use-kubelogin` Action input to `true` for it to work.

```yaml
- uses: azure/login@v1
  with:
     client-id: ${{ secrets.AZURE_CLIENT_ID }}
     tenant-id: ${{ secrets.AZURE_TENANT_ID }}
     subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

- uses: azure/aks-set-context@v3
  with:
     use-az-set-context: 'true'
     resource-group: '<resource group name>'
     cluster-name: '<cluster name>'
     admin: 'false'
     use-kubelogin: 'true'
```

```yaml
- uses: azure/login@v1
  with:
     creds: ${{ secrets.AZURE_CREDENTIALS }}

- uses: azure/aks-set-context@v3
  with:
     use-az-set-context: 'true'
     resource-group: '<resource group name>'
     cluster-name: '<cluster name>'
     admin: 'false'
     use-kubelogin: 'true'
```

## Other Approaches
There are three other approaches for specifying the deployment target:

-  Kubeconfig file provided as input to the action
-  Service account approach where the secret associated with the service account is provided as input to the action
-  Service principal approach (only applicable for arc cluster) where service principal provided with 'creds' is used as input to action

 To use any of these approaches the `use-az-set-context` flag must not be set to false.

In all these approaches it is recommended to store these contents (kubeconfig file content or secret content) in a [secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets/).

Refer to the [action metadata file](./action.yml) for details about inputs. Note that different inputs are required for different method and cluster types. Use the below examples as a reference.

### Kubeconfig approach

```yaml
- uses: azure/k8s-set-context@v2
  with:
     use-az-set-context: 'false'
     method: kubeconfig
     kubeconfig: <your kubeconfig>
     context: <context name> # current-context from kubeconfig is used as default
```

**Please note** that the input requires the _contents_ of the kubeconfig file, and not its path.

Following are the ways to fetch kubeconfig file onto your local development machine so that the same can be used in the action input shown above.

#### Azure Kubernetes Service cluster

```bash
az aks get-credentials --name
                       --resource-group
                       [--admin]
                       [--file]
                       [--overwrite-existing]
                       [--subscription]
```

Further details can be found in [az aks get-credentials documentation](https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-get-credentials).

#### Generic Kubernetes cluster

Please refer to documentation on fetching [kubeconfig for any generic K8s cluster](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/)

### Service account approach

```yaml
- uses: azure/k8s-set-context@v2
  with:
     use-az-set-context: 'false'
     method: service-account
     k8s-url: <URL of the cluster's API server>
     k8s-secret: <secret associated with the service account>
```

For fetching Server URL, execute the following command on your shell:

```bash
kubectl config view --minify -o 'jsonpath={.clusters[0].cluster.server}'
```

For fetching Secret object required to connect and authenticate with the cluster, the following sequence of commands need to be run:

```bash
kubectl get serviceAccounts <service-account-name> -n <namespace> -o 'jsonpath={.secrets[*].name}'

kubectl get secret <service-account-secret-name> -n <namespace> -o yaml
```

### Service account approach for arc cluster

```yaml
- uses: azure/k8s-set-context@v2
  with:
     use-az-set-context: 'false'
     method: service-account
     cluster-type: arc
     cluster-name: <cluster-name>
     resource-group: <resource-group>
     token: '${{ secrets.SA_TOKEN }}'
```

### Service principal approach for arc cluster

```yaml
- uses: azure/k8s-set-context@v2
  with:
     use-az-set-context: 'false'
     method: service-principal
     cluster-type: arc
     cluster-name: <cluster-name>
     resource-group: <resource-group>
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
