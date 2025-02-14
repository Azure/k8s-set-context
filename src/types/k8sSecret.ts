import * as util from 'util'

export interface K8sSecret {
   data: {
      token: string
      'ca.crt': string
   }
}

/**
 * Throws an error if an object does not have all required fields to be a K8sSecret
 * @param secret
 * @returns A type guarded K8sSecret
 */
export function parseK8sSecret(secret: any): K8sSecret {
   if (!secret) throw Error('K8s secret yaml is invalid')
   if (typeof secret === 'string')
      throw Error('k8s-secret is a string, when it should be YAML')
   if (!secret.data) throw k8sSecretMissingFieldError('data')
   if (!secret.data.token) throw k8sSecretMissingFieldError('token')
   if (!secret.data['ca.crt']) throw k8sSecretMissingFieldError('ca.crt')

   return secret as K8sSecret
}

const k8sSecretMissingFieldError = (field: string): Error =>
   Error(util.format('K8s secret yaml does not contain %s field', field))
