import * as core from '@actions/core'
import * as jsyaml from 'js-yaml'
import {KubeConfig} from '@kubernetes/client-node'
import {K8sSecret, parseK8sSecret} from '../types/k8sSecret'
import {Method, parseMethod} from '../types/method'

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
         enum Encoding {
            Base64 = 'base64',
            Plaintext = 'plaintext'
         }

         const rawKubeconfig = core.getInput('kubeconfig', {required: true})
         const encoding =
            core.getInput('kubeconfig-encoding')?.toLowerCase() ||
            Encoding.Plaintext

         if (encoding !== Encoding.Base64 && encoding !== Encoding.Plaintext) {
            throw new Error(
               `Invalid kubeconfig-encoding: '${encoding}'. Must be 'plaintext' or 'base64'.`
            )
         }
         const kubeconfig =
            encoding === Encoding.Base64
               ? Buffer.from(rawKubeconfig, 'base64').toString('utf-8')
               : rawKubeconfig

         return kubeconfig
      }
   }
}

/**
 * Creates a kubeconfig and returns the string representation
 * @param certAuth The certificate authentication of the cluster
 * @param token The user token
 * @param clusterUrl The server url of the cluster
 * @returns The kubeconfig as a string
 */
export function createKubeconfig(
   certAuth: string,
   token: string,
   clusterUrl: string
): string {
   const kc = new KubeConfig()
   kc.loadFromClusterAndUser(
      {
         name: 'default',
         server: clusterUrl,
         caData: certAuth,
         skipTLSVerify: false
      },
      {
         name: 'default-user',
         token
      }
   )
   return kc.exportConfig()
}
