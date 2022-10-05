import * as core from '@actions/core'
import * as jsyaml from 'js-yaml'
import {KubeConfig} from '@kubernetes/client-node'
import {K8sSecret, parseK8sSecret} from '../types/k8sSecret'
import {Method, parseMethod} from '../types/method'
import {createKubeconfig} from '../utils'

/**
 * Gets the kubeconfig based on provided method for a default Kubernetes cluster
 * @returns The kubeconfig
 */
export function getDefaultKubeconfig(): string {
   const method: Method | undefined = parseMethod(
      core.getInput('method', {required: true})
   )

   switch (method) {
      case Method.SERVICE_ACCOUNT: {
         const clusterUrl = core.getInput('k8s-url', {required: true})
         core.debug(
            'Found clusterUrl. Creating kubeconfig using certificate and token'
         )

         const k8sSecret: string = core.getInput('k8s-secret', {
            required: true
         })
         const parsedK8sSecret: K8sSecret = parseK8sSecret(
            jsyaml.load(k8sSecret)
         )
         const certAuth: string = parsedK8sSecret.data['ca.crt']
         const token: string = Buffer.from(
            parsedK8sSecret.data.token,
            'base64'
         ).toString()

         return createKubeconfig(certAuth, token, clusterUrl)
      }
      case Method.SERVICE_PRINCIPAL: {
         core.warning(
            'Service Principal method not supported for default cluster type'
         )
      }
      case undefined: {
         core.warning('Defaulting to kubeconfig method')
      }
      default: {
         core.debug('Setting context using kubeconfig')
         return core.getInput('kubeconfig', {required: true})
      }
   }
}
