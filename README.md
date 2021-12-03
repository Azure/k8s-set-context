# Kubernetes set context

This action can be used to set cluster context before other actions like [`azure/k8s-deploy`](https://github.com/Azure/k8s-deploy/tree/master) and [`azure/k8s-create-secret`](https://github.com/Azure/k8s-create-secret/tree/master). It should also be used before `kubectl` commands (in script) are run subsequently in the workflow.

It is a requirement to use [`azure/login`](https://github.com/Azure/login/tree/master) in your workflow before using this action when using the `service-account` or `service-principal` methods.

There are three approaches for specifying the deployment target:

- Kubeconfig file provided as input to the action
- Service account approach where the secret associated with the service account is provided as input to the action
- Service principal approach (only applicable for arc cluster) where service principal provided with 'creds' is used as input to action

In all these approaches it is recommended to store these contents (kubeconfig file content or secret content) in a [secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets/).

Refer to the [action metadata file](./action.yml) for details about inputs. Note that different inputs are required for different method and cluster types. Use the below examples as a reference.

## Example usage

### Kubeconfig approach

```yaml
- uses: azure/k8s-set-context@v2
  with:
    method: kubeconfig
    kubeconfig: <your kubeconfig> # Use secret (https://developer.github.com/actions/managing-workflows/storing-secrets/)
    context: <context name> #If left unspecified, current-context from kubeconfig is used as default
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
    method: service-account
    k8s-url: <URL of the clsuter's API server>
    k8s-secret: <secret associated with the service account>
```

For fetching Server URL, execute the following command on your shell:

```bash
kubectl config view --minify -o 'jsonpath={.clusters[0].cluster.server}'
```

For fetching Secret object required to connect and authenticate with the cluster, the following sequence of commands need to be run:

```bash
kubectl get serviceAccounts <service-account-name> -n <namespace> -o 'jsonpath={.secrets[*].name}'
```

```bash
kubectl get secret <service-account-secret-name> -n <namespace> -o yaml
```

### Service account approach for arc cluster

```yaml
- uses: azure/k8s-set-context@v2
  with:
    method: service-account
    cluster-type: "arc"
    cluster-name: <cluster-name>
    resource-group: <resource-group>
    token: "${{ secrets.SA_TOKEN }}"
```

### Service principal approach for arc cluster

```yaml
- uses: azure/k8s-set-context@v2
  with:
    method: service-principal
    cluster-type: "arc"
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
