# Kubernetes set context 

This action can be used to set cluster context before other actions like [`azure/k8s-deploy`](https://github.com/Azure/k8s-deploy/tree/master), [`azure/k8s-create-secret`](https://github.com/Azure/k8s-create-secret/tree/master) or any kubectl commands (in script) can be run subsequently in the workflow.

There are two approaches for specifying the deployment target:

- Kubeconfig file provided as input to the action
- Service account approach where the secret associated with the service account is provided as input to the action

If inputs related to both these approaches are provided, kubeconfig approach related inputs are given precedence.

In both these approaches it is recommended to store these contents (kubeconfig file content or secret content) in a [secret](https://developer.github.com/actions/managing-workflows/storing-secrets/) which could be referenced later in the action.

## Action inputs

<table>
  <thead>
    <tr>
      <th>Action inputs</th>
      <th>Description</th>
    </tr>
  </thead>
  <tr>
    <td><code>method</code><br/>Method</td>
    <td>(Optional) Acceptable values: kubeconfig/service-account. Default value: kubeconfig</td>
  </tr>
  <tr>
    <td><code>kubeconfig</code><br/>Kubectl config</td>
    <td>(Relevant for kubeconfig approach) Contents of the configuration file to be used with kubectl (e.g. can be pulled from a secret)</td>
  </tr>
  <tr>
    <td><code>context</code><br/>Context</td>
    <td>(Relevant for kubeconfig approach) Context to be used within the provided kubeconfig file</td>
  </tr>
  <tr>
    <td><code>k8s-url</code><br/>API server URL</td>
    <td>(Relevant for service account approach) API Server URL for the K8s cluster</td>
  </tr>
  <tr>
    <td><code>k8s-secret</code><br/>Secret</td>
    <td>(Relevant for service account approach) Secret associated with the service account to be used for deployments</td>
  </tr>
</table>

## Example usage

### Kubeconfig approach

```yaml
- uses: azure/k8s-set-context@v1
  with:
    method: kubeconfig
    kubeconfig: <your kubeconfig> # Use secret (https://developer.github.com/actions/managing-workflows/storing-secrets/)
    context: <context name>  #If left unspecified, current-context from kubeconfig is used as default
  id: setcontext
```

**Please note** that the input requires the _contents_ of the kubeconfig file, and not its path.

Following are the ways to fetch kubeconfig file onto your local development machine so that the same can be used in the action input shown above:

#### For Azure Kubernetes Service cluster

```sh
az aks get-credentials --name
                       --resource-group
                       [--admin]
                       [--file]
                       [--overwrite-existing]
                       [--subscription]
```

Further details can be found in [az aks get-credentials documentation](https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-get-credentials).

#### For any generic Kubernetes cluster

Please refer to documentation on fetching [kubeconfig for any generic K8s cluster](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/)

### Service account approach

```yaml
- uses: azure/k8s-set-context@v1
  with:
    method: service-account
    k8s-url: <URL of the clsuter's API server>
    k8s-secret: <secret associated with the service account>
  id: setcontext
```

For fetching Server URL, execute the following command on your shell:

```sh
kubectl config view --minify -o 'jsonpath={.clusters[0].cluster.server}'
```

For fetching Secret object required to connect and authenticate with the cluster, the following sequence of commands need to be run:

```sh
kubectl get serviceAccounts <service-account-name> -n <namespace> -o 'jsonpath={.secrets[*].name}'
```

```sh
kubectl get secret <service-account-secret-name> -n <namespace> -o yaml
```

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
