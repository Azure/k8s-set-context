# Kubernetes set context

Used for setting the target K8s cluster context which will be used by other actions like [`azure/k8s-deploy`](https://github.com/Azure/k8s-actions/tree/master/k8s-deploy), [`azure/k8s-create-secret`](https://github.com/Azure/k8s-actions/tree/master/k8s-create-secret) etc. or run any kubectl commands.

```yaml
- uses: azure/k8s-set-context@v1
  with:
    kubeconfig: '<your kubeconfig>'v# Use secret (https://developer.github.com/actions/managing-workflows/storing-secrets/)
    context: '<context name>'  # Optional, uses the current-context from kubeconfig by default
  id: login
```

```yaml
- uses: azure/k8s-set-context@v1
  with:
    k8s-url: '<your kubernetes cluster url>'
    k8s-secret: '<service account token>' # token value from the result of the below script
  id: login
```

[Use secrets](https://developer.github.com/actions/managing-workflows/storing-secrets/) in workflow for using kubeconfig or k8s-values.

PS: `kubeconfig` takes precedence (i.e. kubeconfig would be created using the value supplied in kubeconfig)

Refer to the action metadata file for details about all the inputs https://github.com/Azure/k8s-actions/blob/master/k8s-set-context/action.yml

## Steps to get Kubeconfig of a K8s cluster: 

### For AKS
```sh
az aks get-credentials --name
                       --resource-group
                       [--admin]
                       [--file]
                       [--overwrite-existing]
                       [--subscription]
```
Refer to https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-get-credentials

### For any K8s cluster
Please refer to https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/


## Steps to get Service account: 

#### k8s-url: Run in your local shell to get server K8s URL
```sh
kubectl config view --minify -o jsonpath={.clusters[0].cluster.server}
```
#### k8s-secret: Run following sequential commands to get the secret value:
Get service account secret names by running
```sh
kubectl get sa <service-account-name> -n <namespace> -o=jsonpath={.secrets[*].name}
```

Use the output of the above command 
```sh
kubectl get secret <service-account-secret-name> -n <namespace> -o json
```
## Using secret for Kubeconfig or Service Account
Now add the values as [a secret](https://developer.github.com/actions/managing-workflows/storing-secrets/) in the GitHub repository. In the example below the secret name is `KUBE_CONFIG` and it can be used in the workflow by using the following syntax:
```yaml
 - uses: azure/k8s-set-context@v1
      with:
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
```

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
